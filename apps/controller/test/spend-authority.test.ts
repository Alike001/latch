import { describe, expect, it, vi } from "vitest";

import type {
  MachineTask,
  SpendPolicy,
  TelemetryRequest,
} from "../../../packages/core/src/index.js";
import {
  SpendAuthoritySession,
  recoverTaskTelemetryWithSpendAuthority,
} from "../src/spend-authority.js";

const task: MachineTask = {
  id: "task-stage8-cold-chain",
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
  requireIntegrity: false,
};

const policy: SpendPolicy = {
  maxPerPurchaseUusdc: 10_000,
  maxAttemptsPerCapability: 2,
  maxSessionSpendUusdc: 20_000,
  authorized: true,
};

const freshReading = {
  sensor: "cold-zone-b-temp",
  metric: "temperature",
  value: -18.4,
  unit: "C",
  observedAt: "2026-11-22T07:00:00.000Z",
};

function purchase(n: number) {
  return {
    intent: "SENSOR_TELEMETRY_VERIFY_GENERAL",
    providerId: "7317701",
    providerSlug: "latch-telemetry",
    priceUusdc: 10_000,
    latencyMs: 1_000 + n,
    signalId: `signal-${n}`,
    paymentRail: "escrow" as const,
    paymentReceipt: {
      amount_uusdc: "10000",
    },
    purchasedAt: "2026-11-22T07:00:01.000Z",
  };
}

describe("SpendAuthoritySession", () => {
  it("supports explicit revoke and re-authorize", () => {
    const authority = new SpendAuthoritySession(policy);

    expect(authority.preview(request, 10_000)).toEqual({
      allowed: true,
    });

    authority.revoke();

    expect(authority.preview(request, 10_000)).toEqual({
      allowed: false,
      reason: "spend_revoked",
    });

    authority.authorize();

    expect(authority.preview(request, 10_000)).toEqual({
      allowed: true,
    });
  });

  it("reserves budget before an attempt and releases money without refunding the attempt", () => {
    const authority = new SpendAuthoritySession(policy);
    const reservation = authority.reserve(request, 10_000);

    expect(authority.snapshot()).toEqual({
      authorized: true,
      spentUusdc: 0,
      reservedUusdc: 10_000,
      attemptsByCapability: {
        "cold-zone-b-temp::temperature": 1,
      },
    });

    authority.release(reservation);

    expect(authority.snapshot()).toEqual({
      authorized: true,
      spentUusdc: 0,
      reservedUusdc: 0,
      attemptsByCapability: {
        "cold-zone-b-temp::temperature": 1,
      },
    });
  });

  it("blocks a purchase that would exceed the session cap", () => {
    const authority = new SpendAuthoritySession({
      ...policy,
      maxSessionSpendUusdc: 5_000,
    });

    expect(authority.preview(request, 10_000)).toEqual({
      allowed: false,
      reason: "session_spend_limit_exceeded",
    });
  });
});

describe("Stage 8 bounded recovery", () => {
  it("continues on valid local telemetry without spending authority", async () => {
    const authority = new SpendAuthoritySession({
      ...policy,
      authorized: false,
    });
    const acquire = vi.fn();

    const result = await recoverTaskTelemetryWithSpendAuthority({
      task,
      request,
      localReading: freshReading,
      acquire,
      authority,
      plannedPriceUusdc: 10_000,
      context: {
        now: "2026-11-22T07:00:30.000Z",
      },
    });

    expect(result.finalDecision.action).toBe("CONTINUE");
    expect(result.task.state).toBe("RUNNING");
    expect(result.acquisitionAttempted).toBe(false);
    expect(acquire).not.toHaveBeenCalled();
  });

  it("implements the required Revoke Spend failure scenario", async () => {
    const authority = new SpendAuthoritySession(policy);
    authority.revoke();
    const acquire = vi.fn();

    const result = await recoverTaskTelemetryWithSpendAuthority({
      task,
      request,
      localReading: null,
      acquire,
      authority,
      plannedPriceUusdc: 10_000,
      context: {
        now: "2026-11-22T07:00:30.000Z",
      },
    });

    expect(result.finalDecision.action).toBe("HOLD");
    expect(result.task.state).toBe("HOLD");
    expect(result.spendBlock).toEqual({
      allowed: false,
      reason: "spend_revoked",
    });
    expect(result.attemptsUsed).toBe(0);
    expect(acquire).not.toHaveBeenCalled();
  });

  it("retries once after invalid Provider evidence and continues on the second valid purchase", async () => {
    const authority = new SpendAuthoritySession(policy);
    const acquire = vi
      .fn()
      .mockResolvedValueOnce({
        reading: {
          ...freshReading,
          unit: "F",
        },
        purchase: purchase(1),
      })
      .mockResolvedValueOnce({
        reading: freshReading,
        purchase: purchase(2),
      });

    const result = await recoverTaskTelemetryWithSpendAuthority({
      task,
      request,
      localReading: null,
      acquire,
      authority,
      plannedPriceUusdc: 10_000,
      context: {
        now: "2026-11-22T07:00:30.000Z",
      },
    });

    expect(acquire).toHaveBeenCalledTimes(2);
    expect(result.attemptsUsed).toBe(2);
    expect(result.purchases).toHaveLength(2);
    expect(result.providerDecisions.map((x) => x.action)).toEqual([
      "REBUY",
      "CONTINUE",
    ]);
    expect(result.finalDecision.action).toBe("CONTINUE");
    expect(result.task.state).toBe("RUNNING");
    expect(result.spendState.spentUusdc).toBe(20_000);
  });

  it("holds after the maximum two attempts are exhausted", async () => {
    const authority = new SpendAuthoritySession(policy);
    const acquire = vi.fn().mockResolvedValue({
      reading: {
        ...freshReading,
        value: 99,
      },
      purchase: purchase(1),
    });

    const result = await recoverTaskTelemetryWithSpendAuthority({
      task,
      request,
      localReading: null,
      acquire,
      authority,
      plannedPriceUusdc: 10_000,
      context: {
        now: "2026-11-22T07:00:30.000Z",
      },
    });

    expect(acquire).toHaveBeenCalledTimes(2);
    expect(result.attemptsUsed).toBe(2);
    expect(result.finalDecision.action).toBe("HOLD");
    expect(result.task.state).toBe("HOLD");
    expect(result.spendBlock).toEqual({
      allowed: false,
      reason: "attempt_limit_exhausted",
    });
    expect(result.spendState.spentUusdc).toBe(20_000);
  });

  it("counts network failures as attempts but releases reserved session budget", async () => {
    const authority = new SpendAuthoritySession(policy);
    const acquire = vi
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce({
        reading: freshReading,
        purchase: purchase(2),
      });

    const result = await recoverTaskTelemetryWithSpendAuthority({
      task,
      request,
      localReading: null,
      acquire,
      authority,
      plannedPriceUusdc: 10_000,
      context: {
        now: "2026-11-22T07:00:30.000Z",
      },
    });

    expect(acquire).toHaveBeenCalledTimes(2);
    expect(result.acquisitionErrors).toEqual(["fetch failed"]);
    expect(result.attemptsUsed).toBe(2);
    expect(result.spendState.reservedUusdc).toBe(0);
    expect(result.spendState.spentUusdc).toBe(10_000);
    expect(result.finalDecision.action).toBe("CONTINUE");
  });

  it("blocks before calling the acquirer when the per-purchase ceiling is too low", async () => {
    const authority = new SpendAuthoritySession({
      ...policy,
      maxPerPurchaseUusdc: 5_000,
    });
    const acquire = vi.fn();

    const result = await recoverTaskTelemetryWithSpendAuthority({
      task,
      request,
      localReading: null,
      acquire,
      authority,
      plannedPriceUusdc: 10_000,
      context: {
        now: "2026-11-22T07:00:30.000Z",
      },
    });

    expect(result.spendBlock).toEqual({
      allowed: false,
      reason: "max_per_purchase_exceeded",
    });
    expect(result.task.state).toBe("HOLD");
    expect(acquire).not.toHaveBeenCalled();
  });

  it("can escalate instead of hold when spending is blocked", async () => {
    const authority = new SpendAuthoritySession({
      ...policy,
      authorized: false,
    });

    const result = await recoverTaskTelemetryWithSpendAuthority({
      task,
      request,
      localReading: null,
      acquire: vi.fn(),
      authority,
      plannedPriceUusdc: 10_000,
      context: {
        now: "2026-11-22T07:00:30.000Z",
        onProviderRejected: "ESCALATE",
      },
    });

    expect(result.finalDecision.action).toBe("ESCALATE");
    expect(result.task.state).toBe("ESCALATED");
  });
});
