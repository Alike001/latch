import {
  MachineTaskSchema,
  SpendPolicySchema,
  TelemetryRequestSchema,
  evaluateTelemetry,
  type EvidenceDecision,
  type MachineTask,
  type SpendPolicy,
  type TelegraphPurchaseRecord,
  type TelemetryReading,
  type TelemetryRequest,
} from "../../../packages/core/src/index.js";
import type {
  ControllerClock,
  ControllerContext,
  TelemetryAcquirer,
} from "./index.js";

export type SpendBlockReason =
  | "spend_revoked"
  | "max_per_purchase_exceeded"
  | "attempt_limit_exhausted"
  | "session_spend_limit_exceeded";

export interface SpendAuthoritySnapshot {
  authorized: boolean;
  spentUusdc: number;
  reservedUusdc: number;
  attemptsByCapability: Record<string, number>;
}

export interface SpendDecision {
  allowed: boolean;
  reason?: SpendBlockReason;
}

interface Reservation {
  id: number;
  capability: string;
  amountUusdc: number;
  settled: boolean;
}

function capabilityKey(request: TelemetryRequest): string {
  return `${request.sensor}::${request.metric}`;
}

/**
 * Mutable session-scoped spend authority.
 *
 * Reservations are taken before an acquisition starts so concurrent recovery
 * attempts cannot both pass the same session cap. Failed acquisition attempts
 * release the reserved money but still consume an attempt.
 */
export class SpendAuthoritySession {
  readonly policy: SpendPolicy;

  private authorized: boolean;
  private spentUusdc = 0;
  private reservedUusdc = 0;
  private attemptsByCapability = new Map<string, number>();
  private nextReservationId = 1;

  constructor(policyInput: SpendPolicy) {
    this.policy = SpendPolicySchema.parse(policyInput);
    this.authorized = this.policy.authorized;
  }

  authorize(): void {
    this.authorized = true;
  }

  revoke(): void {
    this.authorized = false;
  }

  snapshot(): SpendAuthoritySnapshot {
    return {
      authorized: this.authorized,
      spentUusdc: this.spentUusdc,
      reservedUusdc: this.reservedUusdc,
      attemptsByCapability: Object.fromEntries(this.attemptsByCapability),
    };
  }

  preview(
    requestInput: TelemetryRequest,
    amountUusdc: number,
  ): SpendDecision {
    const request = TelemetryRequestSchema.parse(requestInput);

    if (!Number.isSafeInteger(amountUusdc) || amountUusdc < 0) {
      throw new Error("planned purchase amount must be a non-negative integer");
    }

    if (!this.authorized) {
      return { allowed: false, reason: "spend_revoked" };
    }

    if (amountUusdc > this.policy.maxPerPurchaseUusdc) {
      return { allowed: false, reason: "max_per_purchase_exceeded" };
    }

    const key = capabilityKey(request);
    const attempts = this.attemptsByCapability.get(key) ?? 0;

    if (attempts >= this.policy.maxAttemptsPerCapability) {
      return { allowed: false, reason: "attempt_limit_exhausted" };
    }

    if (
      this.spentUusdc +
        this.reservedUusdc +
        amountUusdc >
      this.policy.maxSessionSpendUusdc
    ) {
      return { allowed: false, reason: "session_spend_limit_exceeded" };
    }

    return { allowed: true };
  }

  reserve(
    requestInput: TelemetryRequest,
    amountUusdc: number,
  ): Reservation {
    const request = TelemetryRequestSchema.parse(requestInput);
    const decision = this.preview(request, amountUusdc);

    if (!decision.allowed) {
      throw new Error(decision.reason ?? "spend_not_allowed");
    }

    const key = capabilityKey(request);
    this.attemptsByCapability.set(
      key,
      (this.attemptsByCapability.get(key) ?? 0) + 1,
    );
    this.reservedUusdc += amountUusdc;

    return {
      id: this.nextReservationId++,
      capability: key,
      amountUusdc,
      settled: false,
    };
  }

  release(reservation: Reservation): void {
    if (reservation.settled) {
      return;
    }

    reservation.settled = true;
    this.reservedUusdc = Math.max(
      0,
      this.reservedUusdc - reservation.amountUusdc,
    );
  }

  settle(
    reservation: Reservation,
    actualUusdc: number,
  ): void {
    if (reservation.settled) {
      throw new Error("spend reservation already settled");
    }

    if (!Number.isSafeInteger(actualUusdc) || actualUusdc < 0) {
      throw new Error("actual purchase amount must be a non-negative integer");
    }

    reservation.settled = true;
    this.reservedUusdc = Math.max(
      0,
      this.reservedUusdc - reservation.amountUusdc,
    );
    this.spentUusdc += actualUusdc;
  }
}

export interface BoundedRecoveryInput {
  task: MachineTask;
  request: TelemetryRequest;
  localReading: unknown;
  acquire: TelemetryAcquirer;
  authority: SpendAuthoritySession;
  plannedPriceUusdc: number;
  context: ControllerContext;
}

export interface BoundedRecoveryResult {
  task: MachineTask;
  localDecision: EvidenceDecision;
  acquisitionAttempted: boolean;
  attemptsUsed: number;
  acquisitionErrors: string[];
  purchases: TelegraphPurchaseRecord[];
  providerDecisions: EvidenceDecision[];
  spendState: SpendAuthoritySnapshot;
  spendBlock?: SpendDecision;
  finalDecision: EvidenceDecision;
}

function nowValue(clock: ControllerClock): Date | string {
  return typeof clock === "function" ? clock() : clock;
}

function requiredCapability(
  task: MachineTask,
  request: TelemetryRequest,
): boolean {
  return task.requiredTelemetry.some(
    (capability) =>
      capability.sensor === request.sensor &&
      capability.metric === request.metric,
  );
}

function stateForDecision(
  action: EvidenceDecision["action"],
): MachineTask["state"] {
  if (action === "CONTINUE") {
    return "RUNNING";
  }

  if (action === "ESCALATE") {
    return "ESCALATED";
  }

  return "HOLD";
}

function exhaustedDecision(
  request: TelemetryRequest,
  reading: unknown,
  context: ControllerContext,
): EvidenceDecision {
  return evaluateTelemetry(request, reading, {
    now: nowValue(context.now),
    canRetry: false,
    onExhausted: context.onProviderRejected,
    verifyIntegrity: context.verifyIntegrity,
  });
}

/**
 * Stage 8 bounded recovery.
 *
 * Local evidence is always evaluated first. Spending authority only gates
 * remote acquisition. When recovery is allowed, Latch retries until evidence
 * passes or policy blocks another purchase.
 */
export async function recoverTaskTelemetryWithSpendAuthority(
  input: BoundedRecoveryInput,
): Promise<BoundedRecoveryResult> {
  const task = MachineTaskSchema.parse(input.task);
  const request = TelemetryRequestSchema.parse(input.request);

  if (!requiredCapability(task, request)) {
    throw new Error(
      `Task ${task.id} does not require telemetry ${request.sensor}/${request.metric}`,
    );
  }

  const initialSpend = input.authority.preview(
    request,
    input.plannedPriceUusdc,
  );

  const localDecision = evaluateTelemetry(request, input.localReading, {
    now: nowValue(input.context.now),
    canRetry: initialSpend.allowed,
    onExhausted: input.context.onProviderRejected,
    verifyIntegrity: input.context.verifyIntegrity,
  });

  if (localDecision.accepted) {
    return {
      task: MachineTaskSchema.parse({
        ...task,
        state: "RUNNING",
      }),
      localDecision,
      acquisitionAttempted: false,
      attemptsUsed: 0,
      acquisitionErrors: [],
      purchases: [],
      providerDecisions: [],
      spendState: input.authority.snapshot(),
      finalDecision: localDecision,
    };
  }

  if (!initialSpend.allowed) {
    return {
      task: MachineTaskSchema.parse({
        ...task,
        state: stateForDecision(localDecision.action),
      }),
      localDecision,
      acquisitionAttempted: false,
      attemptsUsed: 0,
      acquisitionErrors: [],
      purchases: [],
      providerDecisions: [],
      spendState: input.authority.snapshot(),
      spendBlock: initialSpend,
      finalDecision: localDecision,
    };
  }

  const purchases: TelegraphPurchaseRecord[] = [];
  const providerDecisions: EvidenceDecision[] = [];
  const acquisitionErrors: string[] = [];
  let attemptsUsed = 0;
  let lastDecision = localDecision;

  while (true) {
    const spend = input.authority.preview(
      request,
      input.plannedPriceUusdc,
    );

    if (!spend.allowed) {
      const finalDecision = exhaustedDecision(
        request,
        null,
        input.context,
      );

      return {
        task: MachineTaskSchema.parse({
          ...task,
          state: stateForDecision(finalDecision.action),
        }),
        localDecision,
        acquisitionAttempted: attemptsUsed > 0,
        attemptsUsed,
        acquisitionErrors,
        purchases,
        providerDecisions,
        spendState: input.authority.snapshot(),
        spendBlock: spend,
        finalDecision,
      };
    }

    const reservation = input.authority.reserve(
      request,
      input.plannedPriceUusdc,
    );
    attemptsUsed += 1;

    let acquisition: Awaited<ReturnType<TelemetryAcquirer>>;

    try {
      acquisition = await input.acquire(request);
    } catch (error) {
      input.authority.release(reservation);
      acquisitionErrors.push(
        error instanceof Error ? error.message : String(error),
      );

      const canRetry = input.authority.preview(
        request,
        input.plannedPriceUusdc,
      );

      const providerDecision = evaluateTelemetry(request, null, {
        now: nowValue(input.context.now),
        canRetry: canRetry.allowed,
        onExhausted: input.context.onProviderRejected,
        verifyIntegrity: input.context.verifyIntegrity,
      });

      providerDecisions.push(providerDecision);
      lastDecision = providerDecision;

      if (providerDecision.action === "REBUY") {
        continue;
      }

      return {
        task: MachineTaskSchema.parse({
          ...task,
          state: stateForDecision(providerDecision.action),
        }),
        localDecision,
        acquisitionAttempted: true,
        attemptsUsed,
        acquisitionErrors,
        purchases,
        providerDecisions,
        spendState: input.authority.snapshot(),
        ...(canRetry.allowed ? {} : { spendBlock: canRetry }),
        finalDecision: providerDecision,
      };
    }

    const actualSpend =
      acquisition.purchase?.priceUusdc ??
      input.plannedPriceUusdc;

    input.authority.settle(reservation, actualSpend);

    if (acquisition.purchase) {
      purchases.push(acquisition.purchase);
    }

    const canRetry = input.authority.preview(
      request,
      input.plannedPriceUusdc,
    );

    const providerDecision = evaluateTelemetry(
      request,
      acquisition.reading,
      {
        now: nowValue(input.context.now),
        canRetry: canRetry.allowed,
        onExhausted: input.context.onProviderRejected,
        verifyIntegrity: input.context.verifyIntegrity,
      },
    );

    providerDecisions.push(providerDecision);
    lastDecision = providerDecision;

    if (providerDecision.accepted) {
      return {
        task: MachineTaskSchema.parse({
          ...task,
          state: "RUNNING",
        }),
        localDecision,
        acquisitionAttempted: true,
        attemptsUsed,
        acquisitionErrors,
        purchases,
        providerDecisions,
        spendState: input.authority.snapshot(),
        finalDecision: providerDecision,
      };
    }

    if (providerDecision.action === "REBUY") {
      continue;
    }

    return {
      task: MachineTaskSchema.parse({
        ...task,
        state: stateForDecision(lastDecision.action),
      }),
      localDecision,
      acquisitionAttempted: true,
      attemptsUsed,
      acquisitionErrors,
      purchases,
      providerDecisions,
      spendState: input.authority.snapshot(),
      ...(canRetry.allowed ? {} : { spendBlock: canRetry }),
      finalDecision: lastDecision,
    };
  }
}
