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

export interface DatasetShortcutMetrics {
  pairCount: number;
  uniqueRejectedCount: number;
  largestSingleRejectedShare: number;
  pickShorterAccuracy: number;
  pickLongerAccuracy: number;
  meanChosenLength: number;
  meanRejectedLength: number;
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
  {
    id: "conveyor-speed",
    context:
      "A parcel-sorting robot is entering a conveyor segment operated by a neighboring logistics company. It needs the partner conveyor speed to coordinate a routine handoff without guessing the belt timing.",
    sensor: "conveyor-3-speed",
    metric: "belt_speed",
    value: 1.25,
    unit: "m/s",
    observedAt: "2026-11-22T08:50:00.000Z",
    queryTime: "2026-11-22T08:50:20.000Z",
    maxAgeSeconds: 60,
    plausibleRange: { min: 0.2, max: 2.5 },
  },
  {
    id: "battery-voltage",
    context:
      "A warehouse service agent is checking a battery rack owned by the facility operator before beginning a scheduled charging-cycle inspection. The agent needs a current voltage reading from the operator's telemetry system.",
    sensor: "battery-rack-voltage",
    metric: "voltage",
    value: 51.8,
    unit: "V",
    observedAt: "2026-11-22T09:00:00.000Z",
    queryTime: "2026-11-22T09:00:25.000Z",
    maxAgeSeconds: 90,
    plausibleRange: { min: 44, max: 58 },
  },
  {
    id: "tank-level",
    context:
      "An autonomous inventory agent is reconciling a shared process tank before a routine material transfer. The tank instrumentation belongs to another operator, so the agent must validate the external level reading before updating the transfer plan.",
    sensor: "tank-9-level",
    metric: "liquid_level",
    value: 72.4,
    unit: "%",
    observedAt: "2026-11-22T09:10:00.000Z",
    queryTime: "2026-11-22T09:10:30.000Z",
    maxAgeSeconds: 120,
    plausibleRange: { min: 0, max: 100 },
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
      "Traceability check: choose the answer that includes a usable observed_at timestamp. A null or missing observation time cannot establish freshness.",
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

function donorScenario(
  scenarioIndex: number,
  offset: number,
): TelemetryScenario {
  return TELEMETRY_SCENARIOS[
    (scenarioIndex + offset) % TELEMETRY_SCENARIOS.length
  ]!;
}

function donorWithDifferentUnit(
  scenario: TelemetryScenario,
  scenarioIndex: number,
): TelemetryScenario {
  for (let offset = 1; offset < TELEMETRY_SCENARIOS.length; offset += 1) {
    const donor = donorScenario(scenarioIndex, offset);

    if (donor.unit !== scenario.unit) {
      return donor;
    }
  }

  throw new Error(`No alternate unit donor for ${scenario.id}`);
}

function donorImplausibleValue(
  scenario: TelemetryScenario,
  scenarioIndex: number,
): number {
  const candidates = TELEMETRY_SCENARIOS.filter(
    (candidate) =>
      candidate.value < scenario.plausibleRange.min ||
      candidate.value > scenario.plausibleRange.max,
  );

  if (candidates.length === 0) {
    return scenario.plausibleRange.max + 1;
  }

  return candidates[scenarioIndex % candidates.length]!.value;
}

function staleTimestamp(
  scenario: TelemetryScenario,
): string {
  const query = new Date(scenario.queryTime).getTime();

  const donor = TELEMETRY_SCENARIOS.find((candidate) => {
    const ageSeconds =
      (query - new Date(candidate.observedAt).getTime()) / 1000;

    return ageSeconds > scenario.maxAgeSeconds;
  });

  return donor?.observedAt ?? "2026-11-22T07:50:00.000Z";
}

function futureTimestamp(
  scenario: TelemetryScenario,
): string {
  const query = new Date(scenario.queryTime).getTime();

  const donor = TELEMETRY_SCENARIOS.find(
    (candidate) =>
      new Date(candidate.observedAt).getTime() > query,
  );

  return donor?.observedAt ?? "2026-11-22T09:20:00.000Z";
}

function rejectedAnswer(
  scenario: TelemetryScenario,
  fault: TelemetryFault,
  scenarioIndex: number,
): Record<string, unknown> {
  const answer = canonicalAnswer(scenario);

  switch (fault) {
    case "wrong_sensor":
      answer.sensor = donorScenario(
        scenarioIndex,
        1,
      ).sensor;
      break;

    case "wrong_metric":
      answer.metric = donorScenario(
        scenarioIndex,
        2,
      ).metric;
      break;

    case "wrong_unit":
      answer.unit = donorWithDifferentUnit(
        scenario,
        scenarioIndex,
      ).unit;
      break;

    case "non_numeric_value":
      // Keep the surface tokens looking like real telemetry. JSON quotes make
      // the value the wrong type even though its digits are borrowed from a
      // valid reading elsewhere in the corpus.
      answer.value = String(
        donorScenario(scenarioIndex, 3).value,
      );
      break;

    case "implausible_value":
      // Borrow another real telemetry value that is outside this task's
      // calibration range instead of inventing an obvious outlier token.
      answer.value = donorImplausibleValue(
        scenario,
        scenarioIndex,
      );
      break;

    case "stale_timestamp":
      answer.observed_at = staleTimestamp(scenario);
      break;

    case "future_timestamp":
      answer.observed_at = futureTimestamp(scenario);
      break;

    case "missing_timestamp":
      // Keep the canonical field shape but remove usable time evidence.
      answer.observed_at = "";
      break;
  }

  return answer;
}

export function buildTelemetryPreferenceCorpus(): CorpusCase[] {
  return TELEMETRY_SCENARIOS.flatMap((scenario, scenarioIndex) =>
    TELEMETRY_FAULTS.map((fault) => ({
      id: `${scenario.id}::${fault}`,
      fault,
      scenario,
      row: {
        prompt: promptFor(scenario, fault),
        chosen: JSON.stringify(canonicalAnswer(scenario)),
        rejected: JSON.stringify(
          rejectedAnswer(scenario, fault, scenarioIndex),
        ),
        label_kind: "preference_pair" as const,
        provenance: {
          source_kind: "human" as const,
          source_url: PROVENANCE_URL,
        },
      },
    })),
  );
}

export function datasetShortcutMetrics(
  cases: readonly CorpusCase[],
): DatasetShortcutMetrics {
  const rejectedCounts = new Map<string, number>();
  let shorterChosen = 0;
  let shorterRejected = 0;
  let ties = 0;
  let chosenLength = 0;
  let rejectedLength = 0;

  for (const item of cases) {
    const chosen = item.row.chosen.length;
    const rejected = item.row.rejected.length;

    chosenLength += chosen;
    rejectedLength += rejected;
    rejectedCounts.set(
      item.row.rejected,
      (rejectedCounts.get(item.row.rejected) ?? 0) + 1,
    );

    if (chosen < rejected) {
      shorterChosen += 1;
    } else if (rejected < chosen) {
      shorterRejected += 1;
    } else {
      ties += 1;
    }
  }

  const pairCount = cases.length;
  const largestRejectedCount = Math.max(
    ...rejectedCounts.values(),
  );

  return {
    pairCount,
    uniqueRejectedCount: rejectedCounts.size,
    largestSingleRejectedShare: largestRejectedCount / pairCount,
    pickShorterAccuracy:
      (shorterChosen + ties * 0.5) / pairCount,
    pickLongerAccuracy:
      (shorterRejected + ties * 0.5) / pairCount,
    meanChosenLength: chosenLength / pairCount,
    meanRejectedLength: rejectedLength / pairCount,
  };
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
