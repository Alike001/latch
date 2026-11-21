import { describe, expect, it } from "vitest";
import { TelemetryReadingSchema, TelemetryRequestSchema } from "../src/telemetry.js";

describe("Latch Stage 1 telemetry contracts", () => {
  it("accepts a complete canonical reading", () => {
    const reading = TelemetryReadingSchema.parse({
      sensor: "cold-zone-b-temp",
      metric: "temperature",
      value: -18.4,
      unit: "C",
      observedAt: "2026-11-21T12:30:00Z",
      sequence: 142,
      source: "simulator:cold-zone-b",
      signature: "fixture-valid-signature",
    });

    expect(reading.sensor).toBe("cold-zone-b-temp");
  });

  it("rejects a reading without freshness evidence", () => {
    expect(() => TelemetryReadingSchema.parse({
      sensor: "cold-zone-b-temp",
      metric: "temperature",
      value: -18.4,
      unit: "C",
    })).toThrow();
  });

  it("requires a bounded request policy", () => {
    expect(() => TelemetryRequestSchema.parse({
      sensor: "cold-zone-b-temp",
      metric: "temperature",
      acceptedUnits: ["C"],
      maxAgeSeconds: 120,
      plausibleRange: { min: 10, max: -10 },
      requireIntegrity: true,
    })).toThrow();
  });
});
