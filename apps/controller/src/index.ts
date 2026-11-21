import {
  MachineTaskSchema,
  TelemetryRequestSchema,
  evaluateTelemetry,
  type EvidenceDecision,
  type MachineTask,
  type TelegraphPurchaseRecord,
  type TelemetryReading,
  type TelemetryRequest,
} from "../../../packages/core/src/index.js";

export interface TelemetryAcquisitionResult {
  reading: unknown;
  purchase?: TelegraphPurchaseRecord;
}

export type TelemetryAcquirer = (
  request: TelemetryRequest,
) => Promise<TelemetryAcquisitionResult>;

export type ControllerClock =
  | Date
  | string
  | (() => Date | string);

export interface ControllerContext {
  now: ControllerClock;
  onProviderRejected?: "HOLD" | "ESCALATE";
  verifyIntegrity?: (reading: TelemetryReading) => boolean;
}

export interface ControllerRunInput {
  task: MachineTask;
  request: TelemetryRequest;
  localReading: unknown;
  acquire: TelemetryAcquirer;
  context: ControllerContext;
}

export interface ControllerRunResult {
  task: MachineTask;
  localDecision: EvidenceDecision;
  acquisitionAttempted: boolean;
  acquisitionError?: string;
  purchase?: TelegraphPurchaseRecord;
  providerDecision?: EvidenceDecision;
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

/**
 * Stage 6 controller orchestration.
 *
 * The controller first evaluates the machine's local telemetry. When that
 * evidence is missing or invalid, it performs exactly one acquisition through
 * an injected adapter, validates the returned evidence, and updates machine
 * task state from the Evidence Gate decision.
 *
 * This stage intentionally does not implement Telegraph payment signing,
 * retries, session budgets, or authorization/revocation. The acquisition
 * adapter becomes the live Telegraph boundary in Stage 7; retry and spend
 * authority remain Stage 8 responsibilities.
 */
export async function recoverTaskTelemetry(
  input: ControllerRunInput,
): Promise<ControllerRunResult> {
  const task = MachineTaskSchema.parse(input.task);
  const request = TelemetryRequestSchema.parse(input.request);

  if (!requiredCapability(task, request)) {
    throw new Error(
      `Task ${task.id} does not require telemetry ${request.sensor}/${request.metric}`,
    );
  }

  const localDecision = evaluateTelemetry(request, input.localReading, {
    now: nowValue(input.context.now),
    canRetry: true,
    verifyIntegrity: input.context.verifyIntegrity,
  });

  if (localDecision.accepted) {
    const runningTask = MachineTaskSchema.parse({
      ...task,
      state: "RUNNING",
    });

    return {
      task: runningTask,
      localDecision,
      acquisitionAttempted: false,
      finalDecision: localDecision,
    };
  }

  const waitingTask = MachineTaskSchema.parse({
    ...task,
    state: "WAITING_FOR_TELEMETRY",
  });

  let acquisition: TelemetryAcquisitionResult;

  try {
    acquisition = await input.acquire(request);
  } catch (error) {
    const providerDecision = evaluateTelemetry(request, null, {
      now: nowValue(input.context.now),
      canRetry: false,
      onExhausted: input.context.onProviderRejected,
      verifyIntegrity: input.context.verifyIntegrity,
    });

    return {
      task: MachineTaskSchema.parse({
        ...waitingTask,
        state: stateForDecision(providerDecision.action),
      }),
      localDecision,
      acquisitionAttempted: true,
      acquisitionError:
        error instanceof Error ? error.message : String(error),
      providerDecision,
      finalDecision: providerDecision,
    };
  }

  const providerDecision = evaluateTelemetry(
    request,
    acquisition.reading,
    {
      now: nowValue(input.context.now),
      canRetry: false,
      onExhausted: input.context.onProviderRejected,
      verifyIntegrity: input.context.verifyIntegrity,
    },
  );

  return {
    task: MachineTaskSchema.parse({
      ...waitingTask,
      state: stateForDecision(providerDecision.action),
    }),
    localDecision,
    acquisitionAttempted: true,
    ...(acquisition.purchase ? { purchase: acquisition.purchase } : {}),
    providerDecision,
    finalDecision: providerDecision,
  };
}
