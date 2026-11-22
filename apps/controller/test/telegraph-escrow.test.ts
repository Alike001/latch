import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TelemetryRequest } from "../../../packages/core/src/index.js";
import {
  createPinnedTelegraphEscrowAcquirer,
  loadLocalTelegraphSigner,
} from "../src/telegraph-escrow.js";

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

const template =
  "Telegraph Escrow Payment\n\nWallet: {from}\nPay To: 0x72a70e949362670bf8bcead24efc5b8f950aa08b\nNetwork: eip155:11155111\nAmount: 10000 uUSDC\nResource: /v1/ask/7317701\nNonce: {nonce}\nValid After: {validAfter}\nValid Before: {validBefore}";

function challenge(
  amount = "10000",
  network = "eip155:11155111",
) {
  return {
    accepts: [
      {
        scheme: "escrow",
        network,
        amount,
        payTo: "0x72a70e949362670bf8bcead24efc5b8f950aa08b",
        extra: {
          message: template,
          resource: "/v1/ask/7317701",
        },
      },
    ],
  };
}

function encoded(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}

function paidResponse() {
  return {
    miner_id: "7317701",
    miner_name: "Latch Telemetry Provider",
    result: {
      sensor: "cold-zone-b-temp",
      metric: "temperature",
      value: -18.4,
      unit: "C",
      observed_at: "2026-11-22T05:00:00.000Z",
    },
    cost_usd: 0.01,
    duration_ms: 1234,
    timestamp: "2026-11-22T05:00:01.000Z",
    intent: "SENSOR_TELEMETRY_VERIFY_GENERAL",
    signal_hash:
      "0x7b1f2d491b1938275dbc94524df0146687f43669ce34558364fbbba5eed928c0",
  };
}

describe("Stage 7 Telegraph escrow adapter", () => {
  it("pays one pinned miner through escrow and preserves receipt evidence", async () => {
    const signMessage = vi.fn().mockResolvedValue("0xsigned");
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "payment required" }), {
          status: 402,
          headers: {
            "payment-required": encoded(challenge()),
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(paidResponse()), {
          status: 200,
          headers: {
            "x-payment-response": encoded({
              amount_uusdc: "10000",
              rail: "escrow",
            }),
          },
        }),
      );

    const acquire = createPinnedTelegraphEscrowAcquirer({
      signer: {
        address: "0x95dC03c1F3937341aEa4943fC5376085fDffBEba",
        signMessage,
      },
      fetchImpl: fetchImpl as typeof fetch,
      now: () => new Date("2026-11-22T05:00:00.000Z"),
      nonce: () =>
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });

    const result = await acquire(request);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "https://devnode.telegraphprotocol.com/engine/v1/ask/7317701",
    );

    const firstInit = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(firstInit.body))).toEqual({
      intent: "SENSOR_TELEMETRY_VERIFY_GENERAL",
      params: {
        sensor: "cold-zone-b-temp",
        metric: "temperature",
      },
      max_budget_usdc: 10000,
    });

    expect(signMessage).toHaveBeenCalledTimes(1);
    expect(signMessage.mock.calls[0]?.[0]).toContain(
      "Wallet: 0x95dc03c1f3937341aea4943fc5376085fdffbeba",
    );

    const paidInit = fetchImpl.mock.calls[1]?.[1] as RequestInit;
    const headers = paidInit.headers as Record<string, string>;
    const envelope = JSON.parse(
      Buffer.from(headers["X-PAYMENT"], "base64").toString("utf8"),
    );

    expect(envelope).toMatchObject({
      x402Version: 2,
      scheme: "escrow",
      network: "eip155:11155111",
      payload: {
        signature: "0xsigned",
        authorization: {
          from: "0x95dC03c1F3937341aEa4943fC5376085fDffBEba",
          to: "0x72a70e949362670bf8bcead24efc5b8f950aa08b",
          value: "10000",
        },
      },
    });

    expect(result.reading).toEqual({
      sensor: "cold-zone-b-temp",
      metric: "temperature",
      value: -18.4,
      unit: "C",
      observedAt: "2026-11-22T05:00:00.000Z",
      source: "telegraph:7317701",
    });

    expect(result.purchase).toMatchObject({
      intent: "SENSOR_TELEMETRY_VERIFY_GENERAL",
      providerId: "7317701",
      providerSlug: "latch-telemetry",
      priceUusdc: 10000,
      latencyMs: 1234,
      paymentRail: "escrow",
      paymentReceipt: {
        amount_uusdc: "10000",
        rail: "escrow",
      },
    });
  });

  it("refuses a challenge above the $0.01 Stage 7 ceiling before signing", async () => {
    const signMessage = vi.fn();
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "payment required" }), {
        status: 402,
        headers: {
          "payment-required": encoded(challenge("20000")),
        },
      }),
    );

    const acquire = createPinnedTelegraphEscrowAcquirer({
      signer: {
        address: "0x95dC03c1F3937341aEa4943fC5376085fDffBEba",
        signMessage,
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(acquire(request)).rejects.toThrow(
      "above the 10000 uUSDC Latch ceiling",
    );
    expect(signMessage).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("refuses a non-Sepolia escrow challenge", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "payment required" }), {
        status: 402,
        headers: {
          "payment-required": encoded(
            challenge("10000", "eip155:84532"),
          ),
        },
      }),
    );

    const acquire = createPinnedTelegraphEscrowAcquirer({
      signer: {
        address: "0x95dC03c1F3937341aEa4943fC5376085fDffBEba",
        signMessage: vi.fn(),
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(acquire(request)).rejects.toThrow(
      "required Ethereum Sepolia escrow payment",
    );
  });

  it("fails closed when the paid request is rejected", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "payment required" }), {
          status: 402,
          headers: {
            "payment-required": encoded(challenge()),
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "payment refused",
            reason: "insufficient escrow",
          }),
          { status: 402 },
        ),
      );

    const acquire = createPinnedTelegraphEscrowAcquirer({
      signer: {
        address: "0x95dC03c1F3937341aEa4943fC5376085fDffBEba",
        signMessage: vi.fn().mockResolvedValue("0xsigned"),
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(acquire(request)).rejects.toThrow(
      "Telegraph paid ask failed with HTTP 402: insufficient escrow",
    );
  });
});

describe("local Telegraph wallet loader", () => {
  const created: string[] = [];

  afterEach(() => {
    for (const path of created.splice(0)) {
      rmSync(path, { recursive: true, force: true });
    }
  });

  it("loads a 0600 wallet without exposing the key in the signer object", async () => {
    const root = mkdtempSync(join(tmpdir(), "latch-telegraph-"));
    created.push(root);
    const home = join(root, ".telegraph");
    mkdirSync(home, { mode: 0o700 });
    writeFileSync(
      join(home, "wallet.json"),
      JSON.stringify({
        privateKey:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
      }),
      { mode: 0o600 },
    );

    const signer = loadLocalTelegraphSigner({ home });

    expect(signer.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect("privateKey" in signer).toBe(false);
    expect(await signer.signMessage("Latch test")).toMatch(/^0x[0-9a-f]+$/);
  });

  it("fails closed when POSIX wallet permissions are too broad", () => {
    if (process.platform === "win32") {
      return;
    }

    const root = mkdtempSync(join(tmpdir(), "latch-telegraph-"));
    created.push(root);
    const home = join(root, ".telegraph");
    mkdirSync(home, { mode: 0o700 });
    writeFileSync(
      join(home, "wallet.json"),
      JSON.stringify({
        privateKey:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
      }),
      { mode: 0o644 },
    );

    expect(() => loadLocalTelegraphSigner({ home })).toThrow(
      "wallet file permissions are too broad",
    );
  });
});
