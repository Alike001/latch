import {
  EvidenceDecisionSchema,
  TelemetryReadingSchema,
  TelemetryRequestSchema,
  type EvidenceCheck,
  type EvidenceDecision,
  type TelemetryReading,
  type TelemetryRequest,
} from "./telemetry.js";

export interface EvidenceGateContext {
  now: Date | string;
  canRetry?: boolean;
  onExhausted?: "HOLD" | "ESCALATE";
  verifyIntegrity?: (reading: TelemetryReading) => boolean;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNow(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Evidence Gate requires a valid current time");
  }

  return date;
}

function result(
  key: EvidenceCheck["key"],
  ok: boolean,
  reason?: string,
): EvidenceCheck {
  return reason ? { key, ok, reason } : { key, ok };
}

function readString(
  reading: UnknownRecord,
  key: string,
): string | null {
  const value = reading[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readFiniteNumber(
  reading: UnknownRecord,
  key: string,
): number | null {
  const value = reading[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function failureAction(context: EvidenceGateContext): EvidenceDecision["action"] {
  if (context.canRetry) {
    return "REBUY";
  }

  return context.onExhausted ?? "HOLD";
}

/**
 * Deterministically evaluates whether a Provider reading is trustworthy enough
 * to influence a Latch machine task.
 *
 * The Gate deliberately accepts unknown input because a Provider response
 * cannot be trusted to already satisfy our internal TypeScript type. Every
 * required semantic is checked explicitly before the response can be accepted.
 *
 * Spending authority and Provider selection remain controller responsibilities.
 * The Gate only validates evidence and recommends what should happen after a
 * failed reading: REBUY when another attempt is allowed, otherwise HOLD or an
 * explicitly configured ESCALATE.
 */
export function evaluateTelemetry(
  requestInput: TelemetryRequest,
  readingInput: unknown,
  context: EvidenceGateContext,
): EvidenceDecision {
  const request = TelemetryRequestSchema.parse(requestInput);
  const now = parseNow(context.now);
  const checks: EvidenceCheck[] = [];

  if (!isRecord(readingInput)) {
    checks.push(result("availability", false, "telemetry_unavailable"));

    return EvidenceDecisionSchema.parse({
      accepted: false,
      checks,
      action: failureAction(context),
    });
  }

  checks.push(result("availability", true));

  const sensor = readString(readingInput, "sensor");
  checks.push(
    result(
      "sensor",
      sensor === request.sensor,
      sensor === null
        ? "sensor_missing"
        : sensor === request.sensor
          ? undefined
          : "sensor_mismatch",
    ),
  );

  const metric = readString(readingInput, "metric");
  checks.push(
    result(
      "metric",
      metric === request.metric,
      metric === null
        ? "metric_missing"
        : metric === request.metric
          ? undefined
          : "metric_mismatch",
    ),
  );

  const unit = readString(readingInput, "unit");
  const unitAccepted = unit !== null && request.acceptedUnits.includes(unit);
  checks.push(
    result(
      "unit",
      unitAccepted,
      unit === null
        ? "unit_missing"
        : unitAccepted
          ? undefined
          : "unit_not_accepted",
    ),
  );

  const value = readFiniteNumber(readingInput, "value");
  checks.push(
    result(
      "value",
      value !== null,
      value === null ? "value_not_finite_number" : undefined,
    ),
  );

  const observedAtRaw = readString(readingInput, "observedAt");
  const observedAt =
    observedAtRaw === null ? null : new Date(observedAtRaw);
  const validTimestamp =
    observedAt !== null && !Number.isNaN(observedAt.getTime());

  const isFuture =
    validTimestamp && observedAt!.getTime() > now.getTime();

  checks.push(
    result(
      "future_timestamp",
      validTimestamp && !isFuture,
      observedAtRaw === null
        ? "observed_at_missing"
        : !validTimestamp
          ? "observed_at_invalid"
          : isFuture
            ? "observed_at_in_future"
            : undefined,
    ),
  );

  const ageSeconds =
    validTimestamp
      ? (now.getTime() - observedAt!.getTime()) / 1000
      : null;

  const fresh =
    ageSeconds !== null &&
    ageSeconds >= 0 &&
    ageSeconds <= request.maxAgeSeconds;

  checks.push(
    result(
      "freshness",
      fresh,
      observedAtRaw === null
        ? "observed_at_missing"
        : !validTimestamp
          ? "observed_at_invalid"
          : isFuture
            ? "observed_at_in_future"
            : ageSeconds! > request.maxAgeSeconds
              ? "telemetry_stale"
              : undefined,
    ),
  );

  const plausible =
    value !== null &&
    value >= request.plausibleRange.min &&
    value <= request.plausibleRange.max;

  checks.push(
    result(
      "plausibility",
      plausible,
      value === null
        ? "value_not_finite_number"
        : plausible
          ? undefined
          : "value_outside_plausible_range",
    ),
  );

  if (!request.requireIntegrity) {
    checks.push(result("integrity", true, "integrity_not_required"));
  } else {
    const parsedReading = TelemetryReadingSchema.safeParse(readingInput);

    if (!parsedReading.success) {
      checks.push(
        result("integrity", false, "reading_not_canonical_for_integrity_check"),
      );
    } else if (!context.verifyIntegrity) {
      checks.push(result("integrity", false, "integrity_verifier_missing"));
    } else {
      let integrityOk = false;

      try {
        integrityOk = context.verifyIntegrity(parsedReading.data);
      } catch {
        integrityOk = false;
      }

      checks.push(
        result(
          "integrity",
          integrityOk,
          integrityOk ? undefined : "integrity_verification_failed",
        ),
      );
    }
  }

  const accepted = checks.every((check) => check.ok);

  return EvidenceDecisionSchema.parse({
    accepted,
    checks,
    action: accepted ? "CONTINUE" : failureAction(context),
  });
}
