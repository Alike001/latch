import { z } from "zod";

export const MachineStateSchema = z.enum([
  "RUNNING",
  "WAITING_FOR_TELEMETRY",
  "HOLD",
  "ESCALATED",
  "IDLE",
  "CHARGING"
]);

export const MachineTaskSchema = z.object({
  id: z.string().min(1),
  machineId: z.string().min(1),
  name: z.string().min(1),
  state: MachineStateSchema,
  requiredTelemetry: z.array(z.object({
    sensor: z.string().min(1),
    metric: z.string().min(1),
  })),
});

export const SpendPolicySchema = z.object({
  maxPerPurchaseUusdc: z.number().int().nonnegative(),
  maxAttemptsPerCapability: z.number().int().positive(),
  maxSessionSpendUusdc: z.number().int().nonnegative(),
  authorized: z.boolean(),
});

export type MachineTask = z.infer<typeof MachineTaskSchema>;
export type SpendPolicy = z.infer<typeof SpendPolicySchema>;
