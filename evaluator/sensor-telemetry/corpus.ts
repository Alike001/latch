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
  context: string;
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
    context:
      "A refrigerated logistics operator is moving frozen vaccine cartons between two warehouses. The cart has crossed into a zone managed by a different vendor, so the controller must decide whether the remote cold-room reading is usable before continuing the transfer.",
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
    context:
      "A water-treatment robot is waiting for permission to open a transfer valve. The pressure sensor is owned by the pump station operator rather than the robot fleet, so the machine needs a trustworthy cross-operator reading before it resumes the pumping sequence.",
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
    context:
      "An autonomous inspection trolley is approaching a production cell maintained by another contractor. It needs the motor vibration reading to decide whether the cell is operating normally enough for the scheduled inspection task to continue.",
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
    context:
      "A greenhouse service drone is about to begin a misting job in a bay operated by a partner farm. The drone does not own the humidity sensor and must verify the partner's live environmental reading before it changes the task plan.",
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
    context:
      "A maintenance agent is diagnosing a freezer door actuator at a third-party cold-storage site. The current sensor belongs to the site operator, and the agent needs a valid electrical reading before it can continue the non-emergency maintenance workflow.",
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

function promptFor(
  scenario: TelemetryScenario,
  fault: TelemetryFault,
): string {
  const facts =
    `Requested sensor: "${scenario.sensor}". Requested metric: "${scenario.metric}". Accepted unit: "${scenario.unit}". Plausible range: ${scenario.plausibleRange.min} to ${scenario.plausibleRange.max}. Evaluate at ${scenario.queryTime}; readings older than ${scenario.maxAgeSeconds} seconds are stale.`;

  const focus: Record<TelemetryFault, string> = {
    wrong_sensor:
      "Identity check: choose the answer that actually belongs to the requested sensor. A numerically plausible reading from a different device is not acceptable.",
    wrong_metric:
      "Semantic check: choose the answer that reports the requested metric itself. Reject an answer carrying another measurement type even when its other fields look well formed.",
    wrong_unit:
      "Unit check: choose the answer expressed in the accepted unit for this task. Do not silently reinterpret a value from an incompatible or unknown unit.",
    non_numeric_value:
      "Value-type check: choose the answer with a finite numeric measurement. Error strings, status words, or placeholders cannot substitute for telemetry.",
    implausible_value:
      "Calibration check: choose the finite reading that stays inside the stated operational range. Reject a well-structured but physically implausible outlier.",
    stale_timestamp:
      "Freshness check: choose the reading whose observation time is recent enough for the task. A correctly shaped historical reading outside the freshness window must lose.",
    future_timestamp:
      "Clock-sanity check: choose the answer whose observation time is not later than the evaluation time. Future-dated telemetry is not trustworthy for this decision.",
    missing_timestamp:
      "Traceability check: choose the answer that includes a usable observed_at timestamp. Without observation time, freshness cannot be established.",
  };

  return `${scenario.context} ${facts} ${focus[fault]}`;
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
        prompt: promptFor(scenario, fault),
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
