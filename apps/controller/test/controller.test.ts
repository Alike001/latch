import { describe, expect, it, vi } from "vitest";

import type {
  MachineTask,
  TelemetryRequest,
} from "../../../packages/core/src/index.js";
import { recoverTaskTelemetry } from "../src/index.js";

const task: MachineTask = {
  id: "task-cold-chain-001",
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

const freshReading = {
  sensor: "cold-zone-b-temp",
  metric: "temperature",
  value: -18.4,
  unit: "C",
  observedAt: "2026-11-21T19:53:26.338Z",
};

describe("recoverTaskTelemetry", () => {
  it("continues without buying when local telemetry already passes the Evidence Gate", async () => {
    const acquire = vi.fn();

    const result = await recoverTaskTelemetry({
      task,
      request,
      localReading: freshReading,
      acquire,
      context: {
        now: "2026-11-21T19:54:00Z",
      },
    });

    expect(result.task.state).toBe("RUNNING");
    expect(result.localDecision.action).toBe("CONTINUE");
    expect(result.finalDecision.action).toBe("CONTINUE");
    expect(result.acquisitionAttempted).toBe(false);
    expect(acquire).not.toHaveBeenCalled();
  });

  it("acquires once when local telemetry is unavailable and continues on trusted Provider evidence", async () => {
    const acquire = vi.fn().mockResolvedValue({
      reading: freshReading,
      purchase: {
        intent: "SENSOR_TELEMETRY_VERIFY_GENERAL",
        providerId: "7317701",
        providerSlug: "latch-telemetry",
        priceUusdc: 10000,
        latencyMs: 22506,
        signalId:
          "0x7b1f2d491b1938275dbc94524df0146687f43669ce34558364fbbba5eed928c0",
        purchasedAt: "2026-11-21T19:53:28.788Z",
      },
    });

    const result = await recoverTaskTelemetry({
      task,
      request,
      localReading: null,
      acquire,
      context: {
        now: "2026-11-21T19:54:00Z",
      },
    });

    expect(result.localDecision.action).toBe("REBUY");
    expect(result.acquisitionAttempted).toBe(true);
    expect(acquire).toHaveBeenCalledTimes(1);
    expect(acquire).toHaveBeenCalledWith(request);
    expect(result.providerDecision?.accepted).toBe(true);
    expect(result.finalDecision.action).toBe("CONTINUE");
    expect(result.task.state).toBe("RUNNING");
    expect(result.purchase).toMatchObject({
      providerId: "7317701",
      priceUusdc: 10000,
    });
  });

  it("holds after the single Stage 6 acquisition when Provider evidence is invalid", async () => {
    const acquire = vi.fn().mockResolvedValue({
      reading: {
        ...freshReading,
        unit: "F",
      },
    });

    const result = await recoverTaskTelemetry({
      task,
      request,
      localReading: null,
      acquire,
      context: {
        now: "2026-11-21T19:54:00Z",
      },
    });

    expect(acquire).toHaveBeenCalledTimes(1);
    expect(result.providerDecision?.accepted).toBe(false);
    expect(result.finalDecision.action).toBe("HOLD");
    expect(result.task.state).toBe("HOLD");
    expect(
      result.providerDecision?.checks.find((check) => check.key === "unit"),
    ).toMatchObject({
      ok: false,
      reason: "unit_not_accepted",
    });
  });

  it("holds safely when the acquisition adapter fails", async () => {
    const acquire = vi
      .fn()
      .mockRejectedValue(new Error("Telegraph Provider unavailable"));

    const result = await recoverTaskTelemetry({
      task,
      request,
      localReading: null,
      acquire,
      context: {
        now: "2026-11-21T19:54:00Z",
      },
    });

    expect(result.acquisitionAttempted).toBe(true);
    expect(result.acquisitionError).toBe(
      "Telegraph Provider unavailable",
    );
    expect(result.providerDecision).toEqual({
      accepted: false,
      action: "HOLD",
      checks: [
        {
          key: "availability",
          ok: false,
          reason: "telemetry_unavailable",
        },
      ],
    });
    expect(result.task.state).toBe("HOLD");
  });

  it("supports explicit escalation when Provider evidence fails", async () => {
    const acquire = vi.fn().mockResolvedValue({
      reading: {
        ...freshReading,
        value: 99,
      },
    });

    const result = await recoverTaskTelemetry({
      task,
      request,
      localReading: null,
      acquire,
      context: {
        now: "2026-11-21T19:54:00Z",
        onProviderRejected: "ESCALATE",
      },
    });

    expect(result.finalDecision.action).toBe("ESCALATE");
    expect(result.task.state).toBe("ESCALATED");
  });

  it("refuses to acquire telemetry that the task did not declare as required", async () => {
    const acquire = vi.fn();

    await expect(
      recoverTaskTelemetry({
        task,
        request: {
          ...request,
          sensor: "cold-zone-c-temp",
        },
        localReading: null,
        acquire,
        context: {
          now: "2026-11-21T19:54:00Z",
        },
      }),
    ).rejects.toThrow(
      "Task task-cold-chain-001 does not require telemetry cold-zone-c-temp/temperature",
    );

    expect(acquire).not.toHaveBeenCalled();
  });
});
