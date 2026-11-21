import {
  TelemetryReadingSchema,
  type TelemetryReading,
} from "../../../packages/core/src/telemetry.js";
import type {
  SensorSnapshot,
} from "../../../packages/telemetry-sim/src/index.js";

export const SENSOR_TELEMETRY_INTENT =
  "SENSOR_TELEMETRY_VERIFY_GENERAL";

export interface SensorServingPolicy {
  sensor: string;
  metric: string;
  unit: string;
  maxAgeSeconds: number;
  plausibleRange: {
    min: number;
    max: number;
  };
  requireIntegrity: boolean;
}

export interface TelemetrySnapshotSource {
  snapshot(sensor: string): SensorSnapshot;
}

export interface ProviderDependencies {
  source: TelemetrySnapshotSource;
  policies: SensorServingPolicy[];
  verifyIntegrity?: (
    reading: TelemetryReading,
    policy: SensorServingPolicy,
  ) => boolean;
  now?: () => Date;
}

export interface CanonicalTelemetryResponse {
  sensor: string;
  metric: string;
  value: number;
  unit: string;
  observed_at: string;
  source?: string;
  sequence?: number;
  integrity: "verified" | "not_required";
  served_at: string;
}

export class ProviderError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
    this.code = code;
  }
}

function validatePolicy(policy: SensorServingPolicy): void {
  if (
    !policy.sensor ||
    !policy.metric ||
    !policy.unit ||
    !Number.isInteger(policy.maxAgeSeconds) ||
    policy.maxAgeSeconds <= 0 ||
    !Number.isFinite(policy.plausibleRange.min) ||
    !Number.isFinite(policy.plausibleRange.max) ||
    policy.plausibleRange.min > policy.plausibleRange.max
  ) {
    throw new Error(`invalid serving policy for ${policy.sensor || "unknown sensor"}`);
  }
}

export class SensorTelemetryProvider {
  private readonly policies = new Map<string, SensorServingPolicy>();
  private readonly source: TelemetrySnapshotSource;
  private readonly verifyIntegrity?: ProviderDependencies["verifyIntegrity"];
  private readonly now: () => Date;

  constructor(dependencies: ProviderDependencies) {
    if (dependencies.policies.length === 0) {
      throw new Error("Provider requires at least one shareable sensor policy");
    }

    this.source = dependencies.source;
    this.verifyIntegrity = dependencies.verifyIntegrity;
    this.now = dependencies.now ?? (() => new Date());

    for (const policy of dependencies.policies) {
      validatePolicy(policy);

      if (this.policies.has(policy.sensor)) {
        throw new Error(`duplicate serving policy for ${policy.sensor}`);
      }

      this.policies.set(policy.sensor, {
        ...policy,
        plausibleRange: { ...policy.plausibleRange },
      });
    }
  }

  query(sensor: string, metric: string): CanonicalTelemetryResponse {
    const policy = this.policies.get(sensor);

    // Privacy boundary: a sensor that exists internally but has no explicit
    // serving policy is indistinguishable from an unknown sensor externally.
    if (!policy) {
      throw new ProviderError(
        404,
        "sensor_not_shareable",
        "Requested sensor is not available from this Provider",
      );
    }

    if (metric !== policy.metric) {
      throw new ProviderError(
        422,
        "metric_not_supported",
        "Requested metric is not supported for this sensor",
      );
    }

    let snapshot: SensorSnapshot;

    try {
      snapshot = this.source.snapshot(sensor);
    } catch {
      throw new ProviderError(
        503,
        "telemetry_source_unavailable",
        "Configured telemetry source is unavailable",
      );
    }

    if (!snapshot.online || snapshot.reading === null) {
      throw new ProviderError(
        503,
        "telemetry_unavailable",
        "Sensor is currently offline or has no reading",
      );
    }

    const parsed = TelemetryReadingSchema.safeParse(snapshot.reading);

    if (!parsed.success) {
      throw new ProviderError(
        503,
        "telemetry_malformed",
        "Telemetry source returned a non-canonical reading",
      );
    }

    const reading = parsed.data;

    if (reading.sensor !== policy.sensor || reading.metric !== policy.metric) {
      throw new ProviderError(
        409,
        "telemetry_identity_mismatch",
        "Telemetry source identity does not match the serving policy",
      );
    }

    if (reading.unit !== policy.unit) {
      throw new ProviderError(
        409,
        "telemetry_unit_mismatch",
        "Telemetry unit does not match the serving policy",
      );
    }

    if (
      reading.value < policy.plausibleRange.min ||
      reading.value > policy.plausibleRange.max
    ) {
      throw new ProviderError(
        409,
        "telemetry_out_of_range",
        "Telemetry value is outside the configured plausible range",
      );
    }

    const now = this.now();
    const observedAt = new Date(reading.observedAt);
    const ageSeconds = (now.getTime() - observedAt.getTime()) / 1000;

    if (ageSeconds < 0) {
      throw new ProviderError(
        409,
        "telemetry_from_future",
        "Telemetry observation timestamp is in the future",
      );
    }

    if (ageSeconds > policy.maxAgeSeconds) {
      throw new ProviderError(
        409,
        "telemetry_stale",
        "Telemetry reading is older than the Provider freshness policy",
      );
    }

    let integrity: CanonicalTelemetryResponse["integrity"] = "not_required";

    if (policy.requireIntegrity) {
      if (!this.verifyIntegrity) {
        throw new ProviderError(
          503,
          "integrity_verifier_unavailable",
          "Provider integrity verification is not configured",
        );
      }

      let verified = false;

      try {
        verified = this.verifyIntegrity(reading, policy);
      } catch {
        verified = false;
      }

      if (!verified) {
        throw new ProviderError(
          409,
          "telemetry_integrity_failed",
          "Telemetry integrity verification failed",
        );
      }

      integrity = "verified";
    }

    return {
      sensor: reading.sensor,
      metric: reading.metric,
      value: reading.value,
      unit: reading.unit,
      observed_at: reading.observedAt,
      ...(reading.source ? { source: reading.source } : {}),
      ...(reading.sequence !== undefined
        ? { sequence: reading.sequence }
        : {}),
      integrity,
      served_at: now.toISOString(),
    };
  }
}
