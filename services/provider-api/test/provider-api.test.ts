import { describe, expect, it } from "vitest";

import {
  SensorTelemetryProvider,
  startProviderServer,
  type SensorServingPolicy,
} from "../src/index.js";
import {
  TelemetryStateHub,
  verifyTelemetrySignature,
} from "../../../packages/telemetry-sim/src/index.js";

const SHAREABLE_SECRET = "stage4-shareable-secret";
const PRIVATE_SECRET = "stage4-private-secret";

const policy: SensorServingPolicy = {
  sensor: "cold-zone-b-temp",
  metric: "temperature",
  unit: "C",
  maxAgeSeconds: 120,
  plausibleRange: {
    min: -35,
    max: 10,
  },
  requireIntegrity: true,
};

function createFixture() {
  let now = new Date("2026-11-21T14:00:30Z");
  const hub = new TelemetryStateHub();

  hub.registerSensor(
    {
      sensor: "cold-zone-b-temp",
      metric: "temperature",
      unit: "C",
      source: "simulator:cold-zone-b",
      signingSecret: SHAREABLE_SECRET,
      initialValue: -18.4,
    },
    "2026-11-21T14:00:00Z",
  );

  hub.registerSensor(
    {
      sensor: "internal-motor-current",
      metric: "current",
      unit: "A",
      source: "simulator:robot-7",
      signingSecret: PRIVATE_SECRET,
      initialValue: 4.2,
    },
    "2026-11-21T14:00:00Z",
  );

  const provider = new SensorTelemetryProvider({
    source: hub,
    policies: [policy],
    now: () => now,
    verifyIntegrity: (reading) =>
      verifyTelemetrySignature(reading, SHAREABLE_SECRET),
  });

  return {
    hub,
    provider,
    setNow(value: string) {
      now = new Date(value);
    },
  };
}

async function withServer<T>(
  provider: SensorTelemetryProvider,
  run: (origin: string) => Promise<T>,
): Promise<T> {
  const server = await startProviderServer(provider);

  try {
    return await run(server.origin);
  } finally {
    await server.close();
  }
}

describe("Stage 4 Provider API", () => {
  it("serves the canonical SENSOR_TELEMETRY_VERIFY answer fields", async () => {
    const { provider } = createFixture();

    await withServer(provider, async (origin) => {
      const response = await fetch(
        `${origin}/telemetry?sensor=cold-zone-b-temp&metric=temperature`,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        sensor: "cold-zone-b-temp",
        metric: "temperature",
        value: -18.4,
        unit: "C",
        observed_at: "2026-11-21T14:00:00.000Z",
        source: "simulator:cold-zone-b",
        integrity: "verified",
      });
      expect(body.served_at).toBe("2026-11-21T14:00:30.000Z");
    });
  });

  it("exposes a health route without pretending it serves an Intent result", async () => {
    const { provider } = createFixture();

    await withServer(provider, async (origin) => {
      const response = await fetch(`${origin}/health`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        ok: true,
        service: "latch-provider-api",
        intent: "SENSOR_TELEMETRY_VERIFY_GENERAL",
      });
    });
  });

  it("requires exactly one sensor and metric parameter", async () => {
    const { provider } = createFixture();

    await withServer(provider, async (origin) => {
      const missing = await fetch(
        `${origin}/telemetry?sensor=cold-zone-b-temp`,
      );
      const duplicate = await fetch(
        `${origin}/telemetry?sensor=cold-zone-b-temp&sensor=other&metric=temperature`,
      );

      expect(missing.status).toBe(400);
      expect((await missing.json()).error.code).toBe("invalid_request");
      expect(duplicate.status).toBe(400);
      expect((await duplicate.json()).error.code).toBe("invalid_request");
    });
  });

  it("does not reveal internally known sensors that are not explicitly shareable", async () => {
    const { provider } = createFixture();

    await withServer(provider, async (origin) => {
      const response = await fetch(
        `${origin}/telemetry?sensor=internal-motor-current&metric=current`,
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe("sensor_not_shareable");
      expect(body.value).toBeUndefined();
    });
  });

  it("rejects unsupported metrics for a shareable sensor", async () => {
    const { provider } = createFixture();

    await withServer(provider, async (origin) => {
      const response = await fetch(
        `${origin}/telemetry?sensor=cold-zone-b-temp&metric=humidity`,
      );

      expect(response.status).toBe(422);
      expect((await response.json()).error.code).toBe(
        "metric_not_supported",
      );
    });
  });

  it("returns a real failure when the sensor disconnects", async () => {
    const { hub, provider } = createFixture();
    hub.disconnect("cold-zone-b-temp");

    await withServer(provider, async (origin) => {
      const response = await fetch(
        `${origin}/telemetry?sensor=cold-zone-b-temp&metric=temperature`,
      );
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.error.code).toBe("telemetry_unavailable");
      expect(body.value).toBeUndefined();
    });
  });

  it("refuses stale telemetry instead of returning it with HTTP 200", async () => {
    const { hub, provider, setNow } = createFixture();
    setNow("2026-11-21T15:00:00Z");
    hub.injectStale(
      "cold-zone-b-temp",
      600,
      "2026-11-21T15:00:00Z",
    );

    await withServer(provider, async (origin) => {
      const response = await fetch(
        `${origin}/telemetry?sensor=cold-zone-b-temp&metric=temperature`,
      );

      expect(response.status).toBe(409);
      expect((await response.json()).error.code).toBe("telemetry_stale");
    });
  });

  it("refuses a correctly signed reading with the wrong unit", async () => {
    const { hub, provider, setNow } = createFixture();
    setNow("2026-11-21T14:01:00Z");
    hub.injectWrongUnit(
      "cold-zone-b-temp",
      "F",
      "2026-11-21T14:01:00Z",
    );

    await withServer(provider, async (origin) => {
      const response = await fetch(
        `${origin}/telemetry?sensor=cold-zone-b-temp&metric=temperature`,
      );

      expect(response.status).toBe(409);
      expect((await response.json()).error.code).toBe(
        "telemetry_unit_mismatch",
      );
    });
  });

  it("refuses implausible telemetry even when it is fresh and signed", async () => {
    const { hub, provider, setNow } = createFixture();
    setNow("2026-11-21T14:01:00Z");
    hub.publish(
      "cold-zone-b-temp",
      99,
      "2026-11-21T14:01:00Z",
    );

    await withServer(provider, async (origin) => {
      const response = await fetch(
        `${origin}/telemetry?sensor=cold-zone-b-temp&metric=temperature`,
      );

      expect(response.status).toBe(409);
      expect((await response.json()).error.code).toBe(
        "telemetry_out_of_range",
      );
    });
  });

  it("refuses corrupted integrity instead of publishing a paid-looking answer", async () => {
    const { hub, provider } = createFixture();
    hub.corruptIntegrity("cold-zone-b-temp");

    await withServer(provider, async (origin) => {
      const response = await fetch(
        `${origin}/telemetry?sensor=cold-zone-b-temp&metric=temperature`,
      );

      expect(response.status).toBe(409);
      expect((await response.json()).error.code).toBe(
        "telemetry_integrity_failed",
      );
    });
  });

  it("fails closed when integrity is required but no verifier is configured", async () => {
    const fixture = createFixture();
    const provider = new SensorTelemetryProvider({
      source: fixture.hub,
      policies: [policy],
      now: () => new Date("2026-11-21T14:00:30Z"),
    });

    await withServer(provider, async (origin) => {
      const response = await fetch(
        `${origin}/telemetry?sensor=cold-zone-b-temp&metric=temperature`,
      );

      expect(response.status).toBe(503);
      expect((await response.json()).error.code).toBe(
        "integrity_verifier_unavailable",
      );
    });
  });

  it("rejects non-GET calls instead of accepting ambiguous request shapes", async () => {
    const { provider } = createFixture();

    await withServer(provider, async (origin) => {
      const response = await fetch(`${origin}/telemetry`, {
        method: "POST",
      });

      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET");
    });
  });
});
