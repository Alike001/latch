import { createHmac, timingSafeEqual } from "node:crypto";

import type { TelemetryReading } from "../../core/src/telemetry.js";

export interface SensorDefinition {
  sensor: string;
  metric: string;
  unit: string;
  source: string;
  signingSecret: string;
  initialValue: number;
}

export interface SensorSnapshot {
  sensor: string;
  metric: string;
  expectedUnit: string;
  source: string;
  online: boolean;
  sequence: number;
  lastSeen: string;
  heartbeatAt: string;
  reading: TelemetryReading | null;
}

interface SensorRuntime {
  definition: SensorDefinition;
  online: boolean;
  sequence: number;
  lastSeen: string;
  heartbeatAt: string;
  reading: TelemetryReading;
}

function asIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid timestamp");
  }

  return date.toISOString();
}

function assertFiniteValue(value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error("telemetry value must be finite");
  }
}

function unsignedReading(reading: TelemetryReading): Omit<TelemetryReading, "signature"> {
  const {
    sensor,
    metric,
    value,
    unit,
    observedAt,
    sequence,
    source,
  } = reading;

  return {
    sensor,
    metric,
    value,
    unit,
    observedAt,
    sequence,
    source,
  };
}

/**
 * Stable serialization for simulator integrity checks.
 *
 * This is intentionally explicit rather than JSON-stringifying an arbitrary
 * object. A future Provider can replace the simulator's HMAC with a production
 * signing mechanism without changing the Evidence Gate's semantics.
 */
export function canonicalTelemetryPayload(
  reading: Omit<TelemetryReading, "signature">,
): string {
  return JSON.stringify({
    sensor: reading.sensor,
    metric: reading.metric,
    value: reading.value,
    unit: reading.unit,
    observedAt: reading.observedAt,
    sequence: reading.sequence ?? null,
    source: reading.source ?? null,
  });
}

export function signTelemetry(
  reading: Omit<TelemetryReading, "signature">,
  secret: string,
): string {
  if (!secret) {
    throw new Error("signing secret is required");
  }

  return createHmac("sha256", secret)
    .update(canonicalTelemetryPayload(reading))
    .digest("hex");
}

export function verifyTelemetrySignature(
  reading: TelemetryReading,
  secret: string,
): boolean {
  if (!reading.signature || !secret) {
    return false;
  }

  const expected = signTelemetry(unsignedReading(reading), secret);
  const actualBuffer = Buffer.from(reading.signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export class TelemetryStateHub {
  private readonly sensors = new Map<string, SensorRuntime>();

  registerSensor(
    definition: SensorDefinition,
    now: Date | string,
  ): SensorSnapshot {
    if (this.sensors.has(definition.sensor)) {
      throw new Error(`sensor already registered: ${definition.sensor}`);
    }

    if (
      !definition.sensor ||
      !definition.metric ||
      !definition.unit ||
      !definition.source ||
      !definition.signingSecret
    ) {
      throw new Error("sensor definition is incomplete");
    }

    assertFiniteValue(definition.initialValue);

    const timestamp = asIso(now);
    const sequence = 1;
    const reading = this.createSignedReading(
      definition,
      definition.initialValue,
      definition.unit,
      timestamp,
      sequence,
    );

    this.sensors.set(definition.sensor, {
      definition: { ...definition },
      online: true,
      sequence,
      lastSeen: timestamp,
      heartbeatAt: timestamp,
      reading,
    });

    return this.snapshot(definition.sensor);
  }

  publish(
    sensor: string,
    value: number,
    now: Date | string,
  ): SensorSnapshot {
    assertFiniteValue(value);

    const runtime = this.requireSensor(sensor);
    this.requireOnline(runtime);

    const timestamp = asIso(now);
    runtime.sequence += 1;
    runtime.lastSeen = timestamp;
    runtime.heartbeatAt = timestamp;
    runtime.reading = this.createSignedReading(
      runtime.definition,
      value,
      runtime.definition.unit,
      timestamp,
      runtime.sequence,
    );

    return this.snapshot(sensor);
  }

  heartbeat(sensor: string, now: Date | string): SensorSnapshot {
    const runtime = this.requireSensor(sensor);
    this.requireOnline(runtime);

    const timestamp = asIso(now);
    runtime.lastSeen = timestamp;
    runtime.heartbeatAt = timestamp;

    return this.snapshot(sensor);
  }

  disconnect(sensor: string): SensorSnapshot {
    const runtime = this.requireSensor(sensor);
    runtime.online = false;
    return this.snapshot(sensor);
  }

  reconnect(
    sensor: string,
    now: Date | string,
    value?: number,
  ): SensorSnapshot {
    const runtime = this.requireSensor(sensor);
    runtime.online = true;

    return this.publish(
      sensor,
      value ?? runtime.reading.value,
      now,
    );
  }

  /**
   * Simulates receiving a newly delivered reading whose observation time is old.
   * The payload remains correctly signed so Stage 3 can distinguish integrity
   * from freshness: valid signature does not mean fresh data.
   */
  injectStale(
    sensor: string,
    ageSeconds: number,
    now: Date | string,
  ): SensorSnapshot {
    if (!Number.isFinite(ageSeconds) || ageSeconds < 0) {
      throw new Error("ageSeconds must be a non-negative finite number");
    }

    const runtime = this.requireSensor(sensor);
    this.requireOnline(runtime);

    const receivedAt = new Date(asIso(now));
    const observedAt = new Date(
      receivedAt.getTime() - ageSeconds * 1000,
    ).toISOString();

    runtime.sequence += 1;
    runtime.lastSeen = receivedAt.toISOString();
    runtime.heartbeatAt = receivedAt.toISOString();
    runtime.reading = this.createSignedReading(
      runtime.definition,
      runtime.reading.value,
      runtime.definition.unit,
      observedAt,
      runtime.sequence,
    );

    return this.snapshot(sensor);
  }

  /**
   * Delivers a correctly signed reading with a semantically wrong unit.
   * This is useful for proving the Evidence Gate validates more than integrity.
   */
  injectWrongUnit(
    sensor: string,
    wrongUnit: string,
    now: Date | string,
  ): SensorSnapshot {
    if (!wrongUnit) {
      throw new Error("wrongUnit is required");
    }

    const runtime = this.requireSensor(sensor);
    this.requireOnline(runtime);

    const timestamp = asIso(now);
    runtime.sequence += 1;
    runtime.lastSeen = timestamp;
    runtime.heartbeatAt = timestamp;
    runtime.reading = this.createSignedReading(
      runtime.definition,
      runtime.reading.value,
      wrongUnit,
      timestamp,
      runtime.sequence,
    );

    return this.snapshot(sensor);
  }

  corruptIntegrity(sensor: string): SensorSnapshot {
    const runtime = this.requireSensor(sensor);
    this.requireOnline(runtime);

    runtime.reading = {
      ...runtime.reading,
      signature: `corrupt-${runtime.reading.signature ?? "missing"}`,
    };

    return this.snapshot(sensor);
  }

  /**
   * Returns the sensor to its canonical metric/unit/source and publishes a fresh,
   * correctly signed reading.
   */
  restore(
    sensor: string,
    value: number,
    now: Date | string,
  ): SensorSnapshot {
    const runtime = this.requireSensor(sensor);
    runtime.online = true;
    return this.publish(sensor, value, now);
  }

  snapshot(sensor: string): SensorSnapshot {
    const runtime = this.requireSensor(sensor);

    return {
      sensor: runtime.definition.sensor,
      metric: runtime.definition.metric,
      expectedUnit: runtime.definition.unit,
      source: runtime.definition.source,
      online: runtime.online,
      sequence: runtime.sequence,
      lastSeen: runtime.lastSeen,
      heartbeatAt: runtime.heartbeatAt,
      reading: runtime.online ? { ...runtime.reading } : null,
    };
  }

  listSnapshots(): SensorSnapshot[] {
    return [...this.sensors.keys()]
      .sort()
      .map((sensor) => this.snapshot(sensor));
  }


  private createSignedReading(
    definition: SensorDefinition,
    value: number,
    unit: string,
    observedAt: string,
    sequence: number,
  ): TelemetryReading {
    const unsigned: Omit<TelemetryReading, "signature"> = {
      sensor: definition.sensor,
      metric: definition.metric,
      value,
      unit,
      observedAt,
      sequence,
      source: definition.source,
    };

    return {
      ...unsigned,
      signature: signTelemetry(unsigned, definition.signingSecret),
    };
  }

  private requireSensor(sensor: string): SensorRuntime {
    const runtime = this.sensors.get(sensor);

    if (!runtime) {
      throw new Error(`unknown sensor: ${sensor}`);
    }

    return runtime;
  }

  private requireOnline(runtime: SensorRuntime): void {
    if (!runtime.online) {
      throw new Error(`sensor is offline: ${runtime.definition.sensor}`);
    }
  }
}
