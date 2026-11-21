import { describe, expect, it } from "vitest";

import {
  TelemetryStateHub,
  verifyTelemetrySignature,
} from "../src/index.js";

const SECRET = "stage2-test-secret";

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

describe("TelemetryStateHub", () => {
  it("registers a deterministic signed sensor reading", () => {
    const hub = createHub();
    const snapshot = hub.snapshot("cold-zone-b-temp");

    expect(snapshot.online).toBe(true);
    expect(snapshot.sequence).toBe(1);
    expect(snapshot.lastSeen).toBe("2026-11-21T12:30:00.000Z");
    expect(snapshot.heartbeatAt).toBe("2026-11-21T12:30:00.000Z");
    expect(snapshot.reading?.value).toBe(-18.4);
    expect(snapshot.reading?.unit).toBe("C");

    expect(
      verifyTelemetrySignature(snapshot.reading!, SECRET),
    ).toBe(true);
  });

  it("increments sequence when fresh telemetry is published", () => {
    const hub = createHub();

    const snapshot = hub.publish(
      "cold-zone-b-temp",
      -18.2,
      "2026-11-21T12:30:10Z",
    );

    expect(snapshot.sequence).toBe(2);
    expect(snapshot.reading?.value).toBe(-18.2);
    expect(snapshot.reading?.observedAt).toBe(
      "2026-11-21T12:30:10.000Z",
    );
    expect(
      verifyTelemetrySignature(snapshot.reading!, SECRET),
    ).toBe(true);
  });

  it("updates heartbeat without creating a fake telemetry reading", () => {
    const hub = createHub();

    const snapshot = hub.heartbeat(
      "cold-zone-b-temp",
      "2026-11-21T12:30:20Z",
    );

    expect(snapshot.sequence).toBe(1);
    expect(snapshot.reading?.observedAt).toBe(
      "2026-11-21T12:30:00.000Z",
    );
    expect(snapshot.heartbeatAt).toBe(
      "2026-11-21T12:30:20.000Z",
    );
    expect(snapshot.lastSeen).toBe(
      "2026-11-21T12:30:20.000Z",
    );
  });

  it("disconnects a sensor without inventing fallback telemetry", () => {
    const hub = createHub();

    const disconnected = hub.disconnect("cold-zone-b-temp");

    expect(disconnected.online).toBe(false);
    expect(disconnected.reading).toBeNull();

    expect(() =>
      hub.publish(
        "cold-zone-b-temp",
        -18,
        "2026-11-21T12:31:00Z",
      ),
    ).toThrow("sensor is offline");
  });

  it("reconnects with a new fresh signed reading", () => {
    const hub = createHub();
    hub.disconnect("cold-zone-b-temp");

    const snapshot = hub.reconnect(
      "cold-zone-b-temp",
      "2026-11-21T12:31:00Z",
      -18.1,
    );

    expect(snapshot.online).toBe(true);
    expect(snapshot.sequence).toBe(2);
    expect(snapshot.reading?.value).toBe(-18.1);
    expect(
      verifyTelemetrySignature(snapshot.reading!, SECRET),
    ).toBe(true);
  });

  it("injects stale but correctly signed telemetry", () => {
    const hub = createHub();

    const snapshot = hub.injectStale(
      "cold-zone-b-temp",
      3600,
      "2026-11-21T13:30:00Z",
    );

    expect(snapshot.sequence).toBe(2);
    expect(snapshot.lastSeen).toBe("2026-11-21T13:30:00.000Z");
    expect(snapshot.reading?.observedAt).toBe(
      "2026-11-21T12:30:00.000Z",
    );

    expect(
      verifyTelemetrySignature(snapshot.reading!, SECRET),
    ).toBe(true);
  });

  it("injects a semantically wrong unit with valid integrity", () => {
    const hub = createHub();

    const snapshot = hub.injectWrongUnit(
      "cold-zone-b-temp",
      "F",
      "2026-11-21T12:31:00Z",
    );

    expect(snapshot.reading?.unit).toBe("F");
    expect(snapshot.expectedUnit).toBe("C");

    expect(
      verifyTelemetrySignature(snapshot.reading!, SECRET),
    ).toBe(true);
  });

  it("detects deliberately corrupted integrity", () => {
    const hub = createHub();

    const snapshot = hub.corruptIntegrity("cold-zone-b-temp");

    expect(
      verifyTelemetrySignature(snapshot.reading!, SECRET),
    ).toBe(false);
  });

  it("restores canonical unit and valid integrity after a fault", () => {
    const hub = createHub();
    hub.injectWrongUnit(
      "cold-zone-b-temp",
      "F",
      "2026-11-21T12:31:00Z",
    );
    hub.corruptIntegrity("cold-zone-b-temp");

    const snapshot = hub.restore(
      "cold-zone-b-temp",
      -18,
      "2026-11-21T12:32:00Z",
    );

    expect(snapshot.reading?.unit).toBe("C");
    expect(snapshot.reading?.value).toBe(-18);
    expect(
      verifyTelemetrySignature(snapshot.reading!, SECRET),
    ).toBe(true);
  });

  it("rejects duplicate and unknown sensors", () => {
    const hub = createHub();

    expect(() =>
      hub.registerSensor(
        {
          sensor: "cold-zone-b-temp",
          metric: "temperature",
          unit: "C",
          source: "simulator:duplicate",
          signingSecret: SECRET,
          initialValue: -18,
        },
        "2026-11-21T12:30:00Z",
      ),
    ).toThrow("sensor already registered");

    expect(() => hub.snapshot("does-not-exist")).toThrow(
      "unknown sensor",
    );
  });
});
