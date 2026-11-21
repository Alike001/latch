import { describe, expect, it } from "vitest";

import { evaluateTelemetry } from "../src/evidence-gate.js";
import type { TelemetryRequest } from "../src/telemetry.js";
import {
  TelemetryStateHub,
  verifyTelemetrySignature,
} from "../../telemetry-sim/src/index.js";

const SECRET = "stage3-test-secret";

const request: TelemetryRequest = {
  sensor: "cold-zone-b-temp",
  metric: "temperature",
  acceptedUnits: ["C"],
  maxAgeSeconds: 120,
  plausibleRange: {
    min: -35,
    max: 10,
  },
  requireIntegrity: true,
};

function createHub() {
  const hub = new TelemetryStateHub();

  hub.registerSensor(
    {
      sensor: "cold-zone-b-temp",
      metric: "temperature",
      unit: "C",
      source: "simulator:cold-zone-b",
      signingSecret: SECRET,
      initialValue: -18.4,
    },
    "2026-11-21T12:30:00Z",
  );

  return hub;
}

function verifier(reading: Parameters<typeof verifyTelemetrySignature>[0]) {
  return verifyTelemetrySignature(reading, SECRET);
}

function check(
  decision: ReturnType<typeof evaluateTelemetry>,
  key: string,
) {
  return decision.checks.find((item) => item.key === key);
}

describe("evaluateTelemetry", () => {
  it("continues only when every required check passes", () => {
    const hub = createHub();
    const reading = hub.snapshot("cold-zone-b-temp").reading;

    const decision = evaluateTelemetry(request, reading, {
      now: "2026-11-21T12:31:00Z",
      canRetry: true,
      verifyIntegrity: verifier,
    });

    expect(decision.accepted).toBe(true);
    expect(decision.action).toBe("CONTINUE");
    expect(decision.checks).toHaveLength(9);
    expect(decision.checks.every((item) => item.ok)).toBe(true);
  });

  it("rejects stale telemetry even when its signature is valid", () => {
    const hub = createHub();
    const reading = hub.injectStale(
      "cold-zone-b-temp",
      3600,
      "2026-11-21T13:30:00Z",
    ).reading;

    const decision = evaluateTelemetry(request, reading, {
      now: "2026-11-21T13:30:00Z",
      canRetry: true,
      verifyIntegrity: verifier,
    });

    expect(decision.accepted).toBe(false);
    expect(decision.action).toBe("REBUY");
    expect(check(decision, "freshness")).toMatchObject({
      ok: false,
      reason: "telemetry_stale",
    });
    expect(check(decision, "integrity")?.ok).toBe(true);
  });

  it("rejects a correctly signed reading with the wrong unit", () => {
    const hub = createHub();
    const reading = hub.injectWrongUnit(
      "cold-zone-b-temp",
      "F",
      "2026-11-21T12:31:00Z",
    ).reading;

    const decision = evaluateTelemetry(request, reading, {
      now: "2026-11-21T12:31:30Z",
      canRetry: true,
      verifyIntegrity: verifier,
    });

    expect(decision.accepted).toBe(false);
    expect(decision.action).toBe("REBUY");
    expect(check(decision, "unit")).toMatchObject({
      ok: false,
      reason: "unit_not_accepted",
    });
    expect(check(decision, "integrity")?.ok).toBe(true);
  });

  it("rejects corrupted integrity", () => {
    const hub = createHub();
    const reading = hub.corruptIntegrity("cold-zone-b-temp").reading;

    const decision = evaluateTelemetry(request, reading, {
      now: "2026-11-21T12:31:00Z",
      canRetry: false,
      verifyIntegrity: verifier,
    });

    expect(decision.accepted).toBe(false);
    expect(decision.action).toBe("HOLD");
    expect(check(decision, "integrity")).toMatchObject({
      ok: false,
      reason: "integrity_verification_failed",
    });
  });

  it("rejects telemetry from the wrong sensor identity", () => {
    const hub = createHub();
    const reading = {
      ...hub.snapshot("cold-zone-b-temp").reading!,
      sensor: "cold-zone-c-temp",
    };

    const decision = evaluateTelemetry(request, reading, {
      now: "2026-11-21T12:31:00Z",
      canRetry: true,
      verifyIntegrity: verifier,
    });

    expect(decision.accepted).toBe(false);
    expect(decision.action).toBe("REBUY");
    expect(check(decision, "sensor")).toMatchObject({
      ok: false,
      reason: "sensor_mismatch",
    });
    expect(check(decision, "integrity")?.ok).toBe(false);
  });

  it("rejects future-dated telemetry", () => {
    const hub = createHub();
    const reading = hub.publish(
      "cold-zone-b-temp",
      -18.2,
      "2026-11-21T12:35:00Z",
    ).reading;

    const decision = evaluateTelemetry(request, reading, {
      now: "2026-11-21T12:31:00Z",
      canRetry: false,
      verifyIntegrity: verifier,
    });

    expect(decision.accepted).toBe(false);
    expect(check(decision, "future_timestamp")).toMatchObject({
      ok: false,
      reason: "observed_at_in_future",
    });
    expect(check(decision, "freshness")?.ok).toBe(false);
  });

  it("rejects a value outside the configured plausible range", () => {
    const hub = createHub();
    const reading = hub.publish(
      "cold-zone-b-temp",
      99,
      "2026-11-21T12:31:00Z",
    ).reading;

    const decision = evaluateTelemetry(request, reading, {
      now: "2026-11-21T12:31:30Z",
      canRetry: true,
      verifyIntegrity: verifier,
    });

    expect(decision.accepted).toBe(false);
    expect(check(decision, "plausibility")).toMatchObject({
      ok: false,
      reason: "value_outside_plausible_range",
    });
  });

  it("treats unavailable telemetry as a hard validation failure without fabricating fields", () => {
    const decision = evaluateTelemetry(request, null, {
      now: "2026-11-21T12:31:00Z",
      canRetry: false,
      verifyIntegrity: verifier,
    });

    expect(decision).toEqual({
      accepted: false,
      action: "HOLD",
      checks: [
        {
          key: "availability",
          ok: false,
          reason: "telemetry_unavailable",
        },
      ],
    });
  });

  it("fails closed when integrity is required but no verifier is configured", () => {
    const hub = createHub();
    const reading = hub.snapshot("cold-zone-b-temp").reading;

    const decision = evaluateTelemetry(request, reading, {
      now: "2026-11-21T12:31:00Z",
      canRetry: false,
    });

    expect(decision.accepted).toBe(false);
    expect(check(decision, "integrity")).toMatchObject({
      ok: false,
      reason: "integrity_verifier_missing",
    });
  });

  it("rejects malformed Provider payloads instead of trusting caller types", () => {
    const decision = evaluateTelemetry(
      request,
      {
        sensor: "cold-zone-b-temp",
        metric: "temperature",
        value: "-18.4",
        unit: "C",
        observedAt: "not-a-time",
        signature: "looks-real",
      },
      {
        now: "2026-11-21T12:31:00Z",
        canRetry: true,
        verifyIntegrity: verifier,
      },
    );

    expect(decision.accepted).toBe(false);
    expect(decision.action).toBe("REBUY");
    expect(check(decision, "value")).toMatchObject({
      ok: false,
      reason: "value_not_finite_number",
    });
    expect(check(decision, "future_timestamp")).toMatchObject({
      ok: false,
      reason: "observed_at_invalid",
    });
    expect(check(decision, "integrity")).toMatchObject({
      ok: false,
      reason: "reading_not_canonical_for_integrity_check",
    });
  });

  it("supports explicit operator escalation only when retry is exhausted", () => {
    const hub = createHub();
    const reading = hub.injectWrongUnit(
      "cold-zone-b-temp",
      "F",
      "2026-11-21T12:31:00Z",
    ).reading;

    const decision = evaluateTelemetry(request, reading, {
      now: "2026-11-21T12:31:30Z",
      canRetry: false,
      onExhausted: "ESCALATE",
      verifyIntegrity: verifier,
    });

    expect(decision.accepted).toBe(false);
    expect(decision.action).toBe("ESCALATE");
  });

  it("does not require integrity when request policy explicitly disables it", () => {
    const hub = createHub();
    const reading = hub.corruptIntegrity("cold-zone-b-temp").reading;

    const decision = evaluateTelemetry(
      {
        ...request,
        requireIntegrity: false,
      },
      reading,
      {
        now: "2026-11-21T12:31:00Z",
        canRetry: false,
      },
    );

    expect(decision.accepted).toBe(true);
    expect(decision.action).toBe("CONTINUE");
    expect(check(decision, "integrity")).toMatchObject({
      ok: true,
      reason: "integrity_not_required",
    });
  });
});
