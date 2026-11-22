export type TelemetryFault =
  | "wrong_sensor"
  | "wrong_metric"
  | "wrong_unit"
  | "non_numeric_value"
  | "implausible_value"
  | "stale_timestamp"
  | "future_timestamp"
  | "missing_timestamp";

export interface TelemetryScenario {
  id: string;
  sensor: string;
  metric: string;
  value: number;
  unit: string;
  observedAt: string;
  queryTime: string;
  maxAgeSeconds: number;
  plausibleRange: {
    min: number;
    max: number;
  };
}

export interface PreferenceRow {
  prompt: string;
  chosen: string;
  rejected: string;
  label_kind: "preference_pair";
  provenance: {
    source_kind: "human";
    source_url: string;
  };
}

export interface CorpusCase {
  id: string;
  fault: TelemetryFault;
  scenario: TelemetryScenario;
  row: PreferenceRow;
}

export const TELEMETRY_SCENARIOS: readonly TelemetryScenario[] = [
  {
    id: "cold-chain-temperature",
    sensor: "cold-zone-b-temp",
    metric: "temperature",
    value: -18.4,
    unit: "C",
    observedAt: "2026-11-22T08:00:00.000Z",
    queryTime: "2026-11-22T08:00:30.000Z",
    maxAgeSeconds: 120,
    plausibleRange: { min: -35, max: 10 },
  },
  {
    id: "pump-pressure",
    sensor: "pump-17-pressure",
    metric: "pressure",
    value: 241,
    unit: "kPa",
    observedAt: "2026-11-22T08:10:00.000Z",
    queryTime: "2026-11-22T08:10:20.000Z",
    maxAgeSeconds: 90,
    plausibleRange: { min: 200, max: 300 },
  },
  {
    id: "motor-vibration",
    sensor: "motor-a-vibration",
    metric: "vibration",
    value: 3.1,
    unit: "mm/s",
    observedAt: "2026-11-22T08:20:00.000Z",
    queryTime: "2026-11-22T08:20:45.000Z",
    maxAgeSeconds: 120,
    plausibleRange: { min: 0, max: 8 },
  },
  {
    id: "greenhouse-humidity",
    sensor: "greenhouse-4-humidity",
    metric: "relative_humidity",
    value: 61,
    unit: "%",
    observedAt: "2026-11-22T08:30:00.000Z",
    queryTime: "2026-11-22T08:30:20.000Z",
    maxAgeSeconds: 60,
    plausibleRange: { min: 30, max: 85 },
  },
  {
    id: "freezer-current",
    sensor: "freezer-door-current",
    metric: "current",
    value: 1.8,
    unit: "A",
    observedAt: "2026-11-22T08:40:00.000Z",
    queryTime: "2026-11-22T08:40:15.000Z",
    maxAgeSeconds: 60,
    plausibleRange: { min: 0, max: 5 },
  },
];

export const TELEMETRY_FAULTS: readonly TelemetryFault[] = [
  "wrong_sensor",
  "wrong_metric",
  "wrong_unit",
  "non_numeric_value",
  "implausible_value",
  "stale_timestamp",
  "future_timestamp",
  "missing_timestamp",
];

const PROVENANCE_URL =
  "https://github.com/Alike001/latch/blob/main/evaluator/sensor-telemetry/README.md";

function promptFor(scenario: TelemetryScenario): string {
  return [
    `Verify the live telemetry answer for sensor "${scenario.sensor}" and metric "${scenario.metric}".`,
    `Evaluate it at ${scenario.queryTime}.`,
    `The accepted unit is "${scenario.unit}", the plausible calibration range is ${scenario.plausibleRange.min} to ${scenario.plausibleRange.max},`,
    `and readings older than ${scenario.maxAgeSeconds} seconds are stale.`,
    "Prefer the answer that preserves the requested sensor/metric identity, a finite plausible value, the accepted unit, and a present, non-future, fresh observed_at timestamp.",
  ].join(" ");
}

function canonicalAnswer(scenario: TelemetryScenario): Record<string, unknown> {
  return {
    sensor: scenario.sensor,
    metric: scenario.metric,
    value: scenario.value,
    unit: scenario.unit,
    observed_at: scenario.observedAt,
  };
}

function rejectedAnswer(
  scenario: TelemetryScenario,
  fault: TelemetryFault,
): Record<string, unknown> {
  const answer = canonicalAnswer(scenario);

  switch (fault) {
    case "wrong_sensor":
      answer.sensor = `${scenario.sensor}-other`;
      break;
    case "wrong_metric":
      answer.metric = `${scenario.metric}_other`;
      break;
    case "wrong_unit":
      answer.unit =
        scenario.unit === "C"
          ? "F"
          : scenario.unit === "%"
            ? "fraction"
            : "unknown";
      break;
    case "non_numeric_value":
      answer.value = "sensor-error";
      break;
    case "implausible_value":
      answer.value = scenario.plausibleRange.max + Math.max(
        50,
        Math.abs(scenario.plausibleRange.max - scenario.plausibleRange.min) * 10,
      );
      break;
    case "stale_timestamp": {
      const query = new Date(scenario.queryTime);
      answer.observed_at = new Date(
        query.getTime() - (scenario.maxAgeSeconds + 300) * 1000,
      ).toISOString();
      break;
    }
    case "future_timestamp": {
      const query = new Date(scenario.queryTime);
      answer.observed_at = new Date(query.getTime() + 300_000).toISOString();
      break;
    }
    case "missing_timestamp":
      delete answer.observed_at;
      break;
  }

  return answer;
}

export function buildTelemetryPreferenceCorpus(): CorpusCase[] {
  return TELEMETRY_SCENARIOS.flatMap((scenario) =>
    TELEMETRY_FAULTS.map((fault) => ({
      id: `${scenario.id}::${fault}`,
      fault,
      scenario,
      row: {
        prompt: promptFor(scenario),
        chosen: JSON.stringify(canonicalAnswer(scenario)),
        rejected: JSON.stringify(rejectedAnswer(scenario, fault)),
        label_kind: "preference_pair" as const,
        provenance: {
          source_kind: "human" as const,
          source_url: PROVENANCE_URL,
        },
      },
    })),
  );
}

function parseAnswer(text: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(text);

    return typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function referenceCorpusScore(
  scenario: TelemetryScenario,
  answerText: string,
): number {
  const answer = parseAnswer(answerText);

  if (!answer) {
    return 0;
  }

  let score = 0;

  if (answer.sensor === scenario.sensor) score += 1;
  if (answer.metric === scenario.metric) score += 1;
  if (answer.unit === scenario.unit) score += 1;

  const value =
    typeof answer.value === "number" ? answer.value : Number.NaN;

  if (Number.isFinite(value)) {
    score += 1;

    if (
      value >= scenario.plausibleRange.min &&
      value <= scenario.plausibleRange.max
    ) {
      score += 1;
    }
  }

  if (typeof answer.observed_at === "string") {
    const observed = new Date(answer.observed_at);
    const query = new Date(scenario.queryTime);

    if (!Number.isNaN(observed.getTime())) {
      score += 1;

      if (observed.getTime() <= query.getTime()) {
        score += 1;

        const ageSeconds =
          (query.getTime() - observed.getTime()) / 1000;

        if (ageSeconds <= scenario.maxAgeSeconds) {
          score += 1;
        }
      }
    }
  }

  return score;
}
