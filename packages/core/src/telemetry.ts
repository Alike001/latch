import { z } from "zod";

export const TelemetryReadingSchema = z.object({
  sensor: z.string().min(1),
  metric: z.string().min(1),
  value: z.number().finite(),
  unit: z.string().min(1),
  observedAt: z.string().datetime({ offset: true }),
  sequence: z.number().int().nonnegative().optional(),
  source: z.string().min(1).optional(),
  signature: z.string().min(1).optional(),
});

export type TelemetryReading = z.infer<typeof TelemetryReadingSchema>;

export const TelemetryRequestSchema = z.object({
  sensor: z.string().min(1),
  metric: z.string().min(1),
  acceptedUnits: z.array(z.string().min(1)).min(1),
  maxAgeSeconds: z.number().int().positive(),
  plausibleRange: z.object({
    min: z.number().finite(),
    max: z.number().finite(),
  }).refine((r) => r.min <= r.max, "min must be <= max"),
  requireIntegrity: z.boolean().default(false),
});

export type TelemetryRequest = z.infer<typeof TelemetryRequestSchema>;

export const EvidenceCheckSchema = z.object({
  key: z.enum([
    "availability",
    "sensor",
    "metric",
    "unit",
    "value",
    "freshness",
    "future_timestamp",
    "plausibility",
    "integrity"
  ]),
  ok: z.boolean(),
  reason: z.string().optional(),
});

export type EvidenceCheck = z.infer<typeof EvidenceCheckSchema>;

export const EvidenceDecisionSchema = z.object({
  accepted: z.boolean(),
  checks: z.array(EvidenceCheckSchema),
  action: z.enum(["CONTINUE", "REBUY", "HOLD", "ESCALATE"]),
});

export type EvidenceDecision = z.infer<typeof EvidenceDecisionSchema>;
