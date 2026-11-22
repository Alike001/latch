import {
  type MachineTask,
  type TelemetryRequest,
} from "../packages/core/src/index.js";
import { recoverTaskTelemetry } from "../apps/controller/src/index.js";
import {
  createPinnedTelegraphEscrowAcquirer,
  loadLocalTelegraphSigner,
} from "../apps/controller/src/telegraph-escrow.js";

async function main(): Promise<void> {
  if (process.env.LATCH_LIVE_PAID !== "1") {
    throw new Error(
      "Refusing to spend test USDC. Re-run with LATCH_LIVE_PAID=1 after reviewing the funded Telegraph escrow.",
    );
  }

  const signer = loadLocalTelegraphSigner();

  const task: MachineTask = {
    id: "task-cold-chain-live-001",
    machineId: "cart-7",
    name: "Move frozen shipment to outbound dock",
    state: "RUNNING",
    requiredTelemetry: [
      {
        sensor: "cold-zone-b-temp",
        metric: "temperature",
      },
    ],
  };

  const request: TelemetryRequest = {
    sensor: "cold-zone-b-temp",
    metric: "temperature",
    acceptedUnits: ["C"],
    maxAgeSeconds: 120,
    plausibleRange: {
      min: -35,
      max: 10,
    },
    // The live canonical Telegraph Intent does not expose the Provider's private
    // simulator signature. Stage 7 therefore validates canonical identity,
    // unit, value, plausibility and freshness, while preserving Telegraph's
    // signal/payment evidence separately.
    requireIntegrity: false,
  };

  const acquire = createPinnedTelegraphEscrowAcquirer({
    signer,
    minerId: "7317701",
    providerSlug: "latch-telemetry",
    maxPriceUusdc: 10_000,
  });

  const result = await recoverTaskTelemetry({
    task,
    request,
    localReading: null,
    acquire,
    context: {
      now: () => new Date(),
    },
  });

  console.log(
    JSON.stringify(
      {
        event: "stage7_live_paid_recovery",
        payer: signer.address,
        result,
      },
      null,
      2,
    ),
  );

  if (result.finalDecision.action !== "CONTINUE") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "stage7_live_paid_recovery_failed",
      message: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
