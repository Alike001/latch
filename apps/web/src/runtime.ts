import type {
  EvidenceDecision,
  MachineTask,
  SpendPolicy,
  TelegraphPurchaseRecord,
  TelemetryReading,
  TelemetryRequest,
} from "../../../packages/core/src/index.js";
import {
  TelemetryStateHub,
  verifyTelemetrySignature,
  type SensorSnapshot,
} from "../../../packages/telemetry-sim/src/index.js";
import {
  SpendAuthoritySession,
  recoverTaskTelemetryWithSpendAuthority,
  type BoundedRecoveryResult,
} from "../../controller/src/spend-authority.js";
import {
  createPinnedTelegraphEscrowAcquirer,
  loadLocalTelegraphSigner,
} from "../../controller/src/telegraph-escrow.js";
import type { TelemetryAcquirer } from "../../controller/src/index.js";

const SENSOR = "cold-zone-b-temp";
const METRIC = "temperature";
const UNIT = "C";
const LOCAL_SECRET = "latch-control-room-local-v1";
const PROVIDER_SECRET = "latch-control-room-provider-v1";
const DEFAULT_VALUE = -18.4;
const PLANNED_PRICE_UUSDC = 10_000;

export type ControlRoomFault =
  | "disconnect"
  | "stale"
  | "wrong_unit"
  | "corrupt_integrity"
  | "provider_unavailable"
  | "restore";

export type RecoveryMode = "simulation" | "live";

export interface ControlRoomEvent {
  id: number;
  at: string;
  kind: string;
  message: string;
}

export interface ControlRoomState {
  product: {
    name: "Latch";
    mission: "Mission 11";
    route: "Route 2 — Machines trade telemetry";
    liveTelegraphEnabled: boolean;
  };
  task: MachineTask;
  telemetry: {
    status: string;
    fault: ControlRoomFault | "none";
    snapshot: SensorSnapshot;
    integrityVerified: boolean | null;
  };
  provider: {
    available: boolean;
    mode: "independent_remote_source";
  };
  spend: {
    policy: SpendPolicy;
    session: ReturnType<SpendAuthoritySession["snapshot"]>;
  };
  latestRecovery: {
    at: string;
    mode: RecoveryMode;
    result: BoundedRecoveryResult;
  } | null;
  historicalLiveProof: {
    providerId: "7317701";
    amountUusdc: 10000;
    receiptHash: string;
    signalId: string;
    finalDecision: "CONTINUE";
  };
  events: ControlRoomEvent[];
}

export interface ControlRoomRuntimeOptions {
  now?: () => Date;
  liveTelegraphEnabled?: boolean;
}

function cloneTask(task: MachineTask): MachineTask {
  return {
    ...task,
    requiredTelemetry: task.requiredTelemetry.map((item) => ({ ...item })),
  };
}

export class ControlRoomRuntime {
  private readonly now: () => Date;
  private readonly liveTelegraphEnabled: boolean;
  private localHub = new TelemetryStateHub();
  private providerHub = new TelemetryStateHub();
  private authority: SpendAuthoritySession;
  private task: MachineTask;
  private localFault: ControlRoomFault | "none" = "none";
  private providerAvailable = true;
  private latestRecovery: ControlRoomState["latestRecovery"] = null;
  private events: ControlRoomEvent[] = [];
  private nextEventId = 1;

  readonly policy: SpendPolicy = {
    maxPerPurchaseUusdc: 10_000,
    maxAttemptsPerCapability: 2,
    maxSessionSpendUusdc: 20_000,
    authorized: true,
  };

  constructor(options: ControlRoomRuntimeOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.liveTelegraphEnabled = options.liveTelegraphEnabled ?? false;
    this.authority = new SpendAuthoritySession(this.policy);
    this.task = this.initialTask();
    this.initializeTelemetry();
    this.record(
      "runtime",
      "Control room ready. Local machine telemetry and independent remote Provider are online.",
    );
  }

  state(): ControlRoomState {
    this.refreshHealthyLocalTelemetry();

    const snapshot = this.localHub.snapshot(SENSOR);
    const reading = snapshot.reading;

    return {
      product: {
        name: "Latch",
        mission: "Mission 11",
        route: "Route 2 — Machines trade telemetry",
        liveTelegraphEnabled: this.liveTelegraphEnabled,
      },
      task: cloneTask(this.task),
      telemetry: {
        status: this.telemetryStatus(snapshot),
        fault: this.localFault,
        snapshot,
        integrityVerified:
          reading === null
            ? null
            : verifyTelemetrySignature(reading, LOCAL_SECRET),
      },
      provider: {
        available: this.providerAvailable,
        mode: "independent_remote_source",
      },
      spend: {
        policy: { ...this.policy },
        session: this.authority.snapshot(),
      },
      latestRecovery: this.latestRecovery,
      historicalLiveProof: {
        providerId: "7317701",
        amountUusdc: 10_000,
        receiptHash:
          "0xc4767a0ad9c19d0900a55b2eaff5f921616bec9f6647467837ef24b86cf56258",
        signalId:
          "0xf44ccf4f86719dbd2621d782581e7316be90c56e44b967694b04937f53ae057b",
        finalDecision: "CONTINUE",
      },
      events: [...this.events].reverse(),
    };
  }

  injectFault(fault: ControlRoomFault): ControlRoomState {
    const now = this.now();

    switch (fault) {
      case "disconnect":
        this.localHub.disconnect(SENSOR);
        this.localFault = fault;
        this.task = { ...this.task, state: "WAITING_FOR_TELEMETRY" };
        this.record("fault", "Local telemetry disconnected.");
        break;
      case "stale":
        this.ensureLocalOnline();
        this.localHub.injectStale(SENSOR, 600, now);
        this.localFault = fault;
        this.task = { ...this.task, state: "WAITING_FOR_TELEMETRY" };
        this.record("fault", "Injected a 10-minute-old signed local reading.");
        break;
      case "wrong_unit":
        this.ensureLocalOnline();
        this.localHub.injectWrongUnit(SENSOR, "F", now);
        this.localFault = fault;
        this.task = { ...this.task, state: "WAITING_FOR_TELEMETRY" };
        this.record("fault", "Injected a correctly signed reading with the wrong unit (F).");
        break;
      case "corrupt_integrity":
        this.ensureLocalOnline();
        this.localHub.corruptIntegrity(SENSOR);
        this.localFault = fault;
        this.task = { ...this.task, state: "WAITING_FOR_TELEMETRY" };
        this.record("fault", "Corrupted the local telemetry integrity signature.");
        break;
      case "provider_unavailable":
        this.providerAvailable = false;
        this.record("fault", "Independent remote Provider marked unavailable.");
        break;
      case "restore":
        this.localHub.restore(SENSOR, DEFAULT_VALUE, now);
        this.refreshProviderTelemetry();
        this.localFault = "none";
        this.providerAvailable = true;
        this.task = { ...this.task, state: "RUNNING" };
        this.record("restore", "Restored local telemetry and remote Provider availability.");
        break;
    }

    return this.state();
  }

  setSpendAuthorized(authorized: boolean): ControlRoomState {
    if (authorized) {
      this.authority.authorize();
      this.record("spend", "Recovery spending authorized.");
    } else {
      this.authority.revoke();
      this.record("spend", "Recovery spending revoked. Future purchases are blocked.");
    }

    return this.state();
  }

  resetSession(): ControlRoomState {
    this.authority = new SpendAuthoritySession(this.policy);
    this.task = this.initialTask();
    this.localHub = new TelemetryStateHub();
    this.providerHub = new TelemetryStateHub();
    this.localFault = "none";
    this.providerAvailable = true;
    this.latestRecovery = null;
    this.initializeTelemetry();
    this.record("reset", "Control-room session reset.");
    return this.state();
  }

  async recover(mode: RecoveryMode): Promise<ControlRoomState> {
    if (mode === "live" && !this.liveTelegraphEnabled) {
      throw new Error(
        "Live Telegraph recovery is disabled. Start the control room with LATCH_UI_LIVE_TELEGRAPH=1 to enable paid recovery.",
      );
    }

    if (mode === "live" && this.localFault === "corrupt_integrity") {
      throw new Error(
        "The live canonical Telegraph telemetry Intent does not expose the simulator integrity signature. Use simulation recovery for the corrupted-integrity scenario.",
      );
    }

    const snapshot = this.localHub.snapshot(SENSOR);
    const request = this.requestFor(mode);
    const acquire = this.acquirerFor(mode);

    this.record(
      "recovery",
      mode === "live"
        ? "Starting pinned live Telegraph recovery (maximum $0.01 per attempt)."
        : "Starting local cross-operator recovery simulation.",
    );

    const result = await recoverTaskTelemetryWithSpendAuthority({
      task: this.task,
      request,
      localReading: snapshot.reading,
      acquire,
      authority: this.authority,
      plannedPriceUusdc: PLANNED_PRICE_UUSDC,
      context: {
        now: this.now,
        verifyIntegrity:
          mode === "simulation"
            ? (reading) => this.verifyKnownIntegrity(reading)
            : undefined,
      },
    });

    this.task = result.task;
    this.latestRecovery = {
      at: this.now().toISOString(),
      mode,
      result,
    };

    const purchase = result.purchases.at(-1);
    this.record(
      "decision",
      [
        `Decision ${result.finalDecision.action}.`,
        `Attempts: ${result.attemptsUsed}.`,
        purchase
          ? `Telegraph spend: ${purchase.priceUusdc} uUSDC via ${purchase.paymentRail ?? "unknown rail"}.`
          : mode === "simulation" && result.acquisitionAttempted
            ? "Simulation recovery used no Telegraph receipt."
            : "No recovery purchase.",
      ].join(" "),
    );

    return this.state();
  }

  private initialTask(): MachineTask {
    return {
      id: "task-cold-chain-live-001",
      machineId: "cart-7",
      name: "Move frozen shipment to outbound dock",
      state: "RUNNING",
      requiredTelemetry: [
        {
          sensor: SENSOR,
          metric: METRIC,
        },
      ],
    };
  }

  private initializeTelemetry(): void {
    const now = this.now();

    this.localHub.registerSensor(
      {
        sensor: SENSOR,
        metric: METRIC,
        unit: UNIT,
        source: "machine:cart-7:cold-zone-b",
        signingSecret: LOCAL_SECRET,
        initialValue: DEFAULT_VALUE,
      },
      now,
    );

    this.providerHub.registerSensor(
      {
        sensor: SENSOR,
        metric: METRIC,
        unit: UNIT,
        source: "provider:remote-operator:cold-zone-b",
        signingSecret: PROVIDER_SECRET,
        initialValue: DEFAULT_VALUE,
      },
      now,
    );
  }

  private requestFor(mode: RecoveryMode): TelemetryRequest {
    return {
      sensor: SENSOR,
      metric: METRIC,
      acceptedUnits: [UNIT],
      maxAgeSeconds: 120,
      plausibleRange: {
        min: -35,
        max: 10,
      },
      requireIntegrity: mode === "simulation",
    };
  }

  private acquirerFor(mode: RecoveryMode): TelemetryAcquirer {
    if (mode === "simulation") {
      return async () => {
        if (!this.providerAvailable) {
          throw new Error("Remote Provider unavailable");
        }

        this.refreshProviderTelemetry();
        return {
          reading: this.providerHub.snapshot(SENSOR).reading,
        };
      };
    }

    if (!this.providerAvailable) {
      return async () => {
        throw new Error("Remote Provider unavailable");
      };
    }

    return createPinnedTelegraphEscrowAcquirer({
      signer: loadLocalTelegraphSigner(),
      minerId: "7317701",
      providerSlug: "latch-telemetry",
      maxPriceUusdc: PLANNED_PRICE_UUSDC,
    });
  }

  private ensureLocalOnline(): void {
    const snapshot = this.localHub.snapshot(SENSOR);

    if (!snapshot.online) {
      this.localHub.reconnect(SENSOR, this.now(), DEFAULT_VALUE);
    }
  }

  private refreshHealthyLocalTelemetry(): void {
    if (this.localFault !== "none") {
      return;
    }

    const snapshot = this.localHub.snapshot(SENSOR);

    if (!snapshot.online || snapshot.reading === null) {
      this.localHub.reconnect(SENSOR, this.now(), DEFAULT_VALUE);
      return;
    }

    const ageMs =
      this.now().getTime() - new Date(snapshot.reading.observedAt).getTime();

    if (ageMs > 15_000) {
      this.localHub.publish(SENSOR, snapshot.reading.value, this.now());
    }
  }

  private refreshProviderTelemetry(): void {
    const snapshot = this.providerHub.snapshot(SENSOR);

    if (!snapshot.online || snapshot.reading === null) {
      this.providerHub.reconnect(SENSOR, this.now(), DEFAULT_VALUE);
      return;
    }

    this.providerHub.publish(SENSOR, snapshot.reading.value, this.now());
  }

  private verifyKnownIntegrity(reading: TelemetryReading): boolean {
    return (
      verifyTelemetrySignature(reading, LOCAL_SECRET) ||
      verifyTelemetrySignature(reading, PROVIDER_SECRET)
    );
  }

  private telemetryStatus(snapshot: SensorSnapshot): string {
    if (!snapshot.online || snapshot.reading === null) {
      return "unavailable";
    }

    if (this.localFault === "stale") {
      return "stale";
    }

    if (this.localFault === "wrong_unit") {
      return "wrong_unit";
    }

    if (this.localFault === "corrupt_integrity") {
      return "integrity_failed";
    }

    return "healthy";
  }

  private record(kind: string, message: string): void {
    this.events.push({
      id: this.nextEventId++,
      at: this.now().toISOString(),
      kind,
      message,
    });

    if (this.events.length > 60) {
      this.events.splice(0, this.events.length - 60);
    }
  }
}

export function finalDecisionOf(
  state: ControlRoomState,
): EvidenceDecision | null {
  return state.latestRecovery?.result.finalDecision ?? null;
}

export function latestPurchaseOf(
  state: ControlRoomState,
): TelegraphPurchaseRecord | null {
  return state.latestRecovery?.result.purchases.at(-1) ?? null;
}
