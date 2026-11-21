import {
  SensorTelemetryProvider,
  startProviderServer,
} from "./index.js";
import {
  TelemetryStateHub,
  verifyTelemetrySignature,
} from "../../../packages/telemetry-sim/src/index.js";

const SENSOR_ID = "cold-zone-b-temp";
const METRIC = "temperature";
const UNIT = "C";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? "3000");

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  return port;
}

async function main(): Promise<void> {
  const signingSecret = requiredEnv("LATCH_SIM_SIGNING_SECRET");
  const hub = new TelemetryStateHub();

  hub.registerSensor(
    {
      sensor: SENSOR_ID,
      metric: METRIC,
      unit: UNIT,
      source: "simulator:cold-zone-b",
      signingSecret,
      initialValue: -18.4,
    },
    new Date(),
  );

  let sampleIndex = 0;

  const refreshTimer = setInterval(() => {
    sampleIndex += 1;

    // Deterministic simulated cold-zone telemetry. This remains deliberately
    // narrow: the public Provider only sells the one capability documented in
    // its serving policy.
    const value = Number(
      (-18.4 + Math.sin(sampleIndex / 4) * 0.12).toFixed(3),
    );

    hub.publish(SENSOR_ID, value, new Date());
  }, 15_000);

  refreshTimer.unref();

  const provider = new SensorTelemetryProvider({
    source: hub,
    policies: [
      {
        sensor: SENSOR_ID,
        metric: METRIC,
        unit: UNIT,
        maxAgeSeconds: 120,
        plausibleRange: {
          min: -35,
          max: 10,
        },
        requireIntegrity: true,
      },
    ],
    verifyIntegrity: (reading) =>
      verifyTelemetrySignature(reading, signingSecret),
  });

  const running = await startProviderServer(provider, {
    host: "0.0.0.0",
    port: parsePort(process.env.PORT),
  });

  console.log(
    JSON.stringify({
      event: "provider_started",
      service: "latch-telemetry-provider",
      intent: "SENSOR_TELEMETRY_VERIFY_GENERAL",
      sensor: SENSOR_ID,
      metric: METRIC,
      simulated: true,
    }),
  );

  async function shutdown(signal: string) {
    console.log(JSON.stringify({ event: "provider_stopping", signal }));
    clearInterval(refreshTimer);
    await running.close();
    process.exit(0);
  }

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "provider_start_failed",
      message: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
