import { describe, expect, it, vi } from "vitest";

import { ControlRoomRuntime } from "../src/runtime.js";
import { startControlRoomServer } from "../src/server.js";

function fixedNow() {
  return new Date("2026-11-22T08:00:00.000Z");
}

describe("Stage 9 control-room runtime", () => {
  it("starts with healthy local telemetry and authorized spend", () => {
    const runtime = new ControlRoomRuntime({ now: fixedNow });
    const state = runtime.state();

    expect(state.task.state).toBe("RUNNING");
    expect(state.telemetry.status).toBe("healthy");
    expect(state.telemetry.integrityVerified).toBe(true);
    expect(state.spend.session.authorized).toBe(true);
  });

  it("disconnects local telemetry and recovers from an independent remote source", async () => {
    const runtime = new ControlRoomRuntime({ now: fixedNow });
    runtime.injectFault("disconnect");

    const state = await runtime.recover("simulation");

    expect(state.latestRecovery?.result.localDecision.action).toBe("REBUY");
    expect(state.latestRecovery?.result.finalDecision.action).toBe("CONTINUE");
    expect(state.task.state).toBe("RUNNING");
    expect(state.latestRecovery?.result.attemptsUsed).toBe(1);
    expect(state.latestRecovery?.result.purchases).toHaveLength(0);
    expect(state.spend.session.spentUusdc).toBe(10_000);
  });

  it("recovers from stale, wrong-unit, and corrupted-integrity local evidence", async () => {
    for (const fault of ["stale", "wrong_unit", "corrupt_integrity"] as const) {
      const runtime = new ControlRoomRuntime({ now: fixedNow });
      runtime.injectFault(fault);

      const state = await runtime.recover("simulation");

      expect(state.latestRecovery?.result.localDecision.accepted).toBe(false);
      expect(state.latestRecovery?.result.finalDecision.action).toBe("CONTINUE");
      expect(state.task.state).toBe("RUNNING");
    }
  });

  it("implements Revoke Spend with no acquisition attempt", async () => {
    const runtime = new ControlRoomRuntime({ now: fixedNow });
    runtime.injectFault("disconnect");
    runtime.setSpendAuthorized(false);

    const state = await runtime.recover("simulation");

    expect(state.latestRecovery?.result.acquisitionAttempted).toBe(false);
    expect(state.latestRecovery?.result.finalDecision.action).toBe("HOLD");
    expect(state.latestRecovery?.result.spendBlock).toEqual({
      allowed: false,
      reason: "spend_revoked",
    });
    expect(state.spend.session.spentUusdc).toBe(0);
  });

  it("retries a Provider outage twice, spends nothing, and holds", async () => {
    const runtime = new ControlRoomRuntime({ now: fixedNow });
    runtime.injectFault("disconnect");
    runtime.injectFault("provider_unavailable");

    const state = await runtime.recover("simulation");

    expect(state.latestRecovery?.result.attemptsUsed).toBe(2);
    expect(state.latestRecovery?.result.acquisitionErrors).toEqual([
      "Remote Provider unavailable",
      "Remote Provider unavailable",
    ]);
    expect(state.latestRecovery?.result.finalDecision.action).toBe("HOLD");
    expect(state.spend.session.spentUusdc).toBe(0);
    expect(state.spend.session.reservedUusdc).toBe(0);
  });

  it("refuses live payment when the server was not explicitly enabled", async () => {
    const runtime = new ControlRoomRuntime({
      now: fixedNow,
      liveTelegraphEnabled: false,
    });

    await expect(runtime.recover("live")).rejects.toThrow(
      "Live Telegraph recovery is disabled",
    );
  });
});

describe("Stage 9 control-room HTTP surface", () => {
  it("serves the UI and mutates real runtime state through API controls", async () => {
    const runtime = new ControlRoomRuntime({ now: fixedNow });
    const running = await startControlRoomServer({
      host: "127.0.0.1",
      port: 0,
      runtime,
    });

    try {
      const base = `http://127.0.0.1:${running.port}`;
      const page = await fetch(base + "/");
      expect(page.status).toBe(200);
      expect(await page.text()).toContain("Operational recovery, with evidence.");

      const fault = await fetch(base + "/api/fault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fault: "disconnect" }),
      });
      const state = await fault.json();

      expect(fault.status).toBe(200);
      expect(state.telemetry.status).toBe("unavailable");
      expect(state.task.state).toBe("WAITING_FOR_TELEMETRY");
    } finally {
      await running.close();
    }
  });

  it("rejects unknown failure controls instead of mutating state", async () => {
    const running = await startControlRoomServer({
      host: "127.0.0.1",
      port: 0,
      runtime: new ControlRoomRuntime({ now: fixedNow }),
    });

    try {
      const response = await fetch(
        `http://127.0.0.1:${running.port}/api/fault`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fault: "invented_fault" }),
        },
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "unknown_fault" });
    } finally {
      await running.close();
    }
  });
});
