import { z } from "zod";

export const TelegraphPurchaseRecordSchema = z.object({
  intent: z.string().min(1),
  providerId: z.string().min(1).optional(),
  providerSlug: z.string().min(1).optional(),
  priceUusdc: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  requestId: z.string().min(1).optional(),
  signalId: z.string().min(1).optional(),
  transactionHash: z.string().min(1).optional(),
  paymentRail: z.enum(["escrow", "x402"]).optional(),
  paymentReceipt: z.unknown().optional(),
  purchasedAt: z.string().datetime({ offset: true }),
  rawResponsePath: z.string().min(1).optional(),
});

export type TelegraphPurchaseRecord = z.infer<typeof TelegraphPurchaseRecordSchema>;
