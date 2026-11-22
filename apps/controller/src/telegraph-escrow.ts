import { randomBytes } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { privateKeyToAccount } from "viem/accounts";

import {
  TelegraphPurchaseRecordSchema,
  type TelemetryRequest,
} from "../../../packages/core/src/index.js";
import type {
  TelemetryAcquirer,
  TelemetryAcquisitionResult,
} from "./index.js";

const DEFAULT_NODE = "https://devnode.telegraphprotocol.com";
const DEFAULT_MINER_ID = "7317701";
const DEFAULT_PROVIDER_SLUG = "latch-telemetry";
const INTENT = "SENSOR_TELEMETRY_VERIFY_GENERAL";
const NETWORK = "eip155:11155111";
const DEFAULT_MAX_PRICE_UUSDC = 10_000;

type FetchLike = typeof fetch;

interface TelegraphEscrowRequirement {
  scheme: string;
  network: string;
  amount?: string;
  price?: string;
  payTo: string;
  extra?: {
    message?: string;
    resource?: string;
  };
}

interface PaymentRequiredDocument {
  accepts?: TelegraphEscrowRequirement[];
  error?: string;
  reason?: string;
}

export interface TelegraphMessageSigner {
  address: `0x${string}`;
  signMessage(message: string): Promise<`0x${string}`>;
}

export interface PinnedTelegraphEscrowOptions {
  signer: TelegraphMessageSigner;
  nodeUrl?: string;
  minerId?: string;
  providerSlug?: string;
  maxPriceUusdc?: number;
  fetchImpl?: FetchLike;
  now?: () => Date;
  nonce?: () => `0x${string}`;
}

export interface LocalTelegraphWalletOptions {
  home?: string;
}

function decodeBase64Json(value: string): unknown {
  return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
}

async function readJson(response: Response): Promise<any> {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function paymentDocument(
  response: Response,
  body: unknown,
): PaymentRequiredDocument {
  const header = response.headers.get("payment-required");

  if (header) {
    const decoded = decodeBase64Json(header);

    if (typeof decoded === "object" && decoded !== null) {
      return decoded as PaymentRequiredDocument;
    }
  }

  if (typeof body === "object" && body !== null) {
    return body as PaymentRequiredDocument;
  }

  throw new Error("Telegraph returned an unreadable payment challenge");
}

function amountUusdc(requirement: TelegraphEscrowRequirement): number {
  if (requirement.amount !== undefined) {
    const amount = Number(requirement.amount);

    if (Number.isSafeInteger(amount) && amount >= 0) {
      return amount;
    }
  }

  if (requirement.price) {
    const price = Number(requirement.price.replace(/^\$/, ""));

    if (Number.isFinite(price) && price >= 0) {
      return Math.round(price * 1_000_000);
    }
  }

  throw new Error("Telegraph escrow challenge did not contain a valid amount");
}

function paymentReceipt(response: Response): unknown {
  const encoded =
    response.headers.get("x-payment-response") ??
    response.headers.get("payment-response");

  if (!encoded) {
    return undefined;
  }

  try {
    return decodeBase64Json(encoded);
  } catch {
    return encoded;
  }
}

function isoTimestamp(value: unknown, fallback: Date): string {
  const parsed =
    typeof value === "string" ? new Date(value) : fallback;

  if (Number.isNaN(parsed.getTime())) {
    return fallback.toISOString();
  }

  return parsed.toISOString();
}

function telemetryResult(body: any): TelemetryAcquisitionResult["reading"] {
  const result = body?.result;

  if (typeof result !== "object" || result === null) {
    throw new Error("Telegraph response did not contain telemetry result fields");
  }

  return {
    sensor: result.sensor,
    metric: result.metric,
    value: result.value,
    unit: result.unit,
    observedAt: result.observed_at,
    source: `telegraph:${body?.miner_id ?? "unknown"}`,
  };
}

function authorizationMessage(
  template: string,
  authorization: {
    from: string;
    nonce: string;
    validAfter: string;
    validBefore: string;
  },
): string {
  return template
    .replaceAll("{from}", authorization.from.toLowerCase())
    .replaceAll("{nonce}", authorization.nonce)
    .replaceAll("{validAfter}", authorization.validAfter)
    .replaceAll("{validBefore}", authorization.validBefore);
}

/**
 * Creates the Stage 7 live Telegraph acquisition adapter.
 *
 * This adapter is deliberately pinned to one miner and one $0.01 ceiling.
 * It never auto-routes across multiple miners and never falls back to wallet
 * x402 settlement. The local signer proves intent for the Telegraph escrow
 * challenge with EIP-191; the private key is never returned or logged.
 */
export function createPinnedTelegraphEscrowAcquirer(
  options: PinnedTelegraphEscrowOptions,
): TelemetryAcquirer {
  const nodeUrl = (options.nodeUrl ?? DEFAULT_NODE).replace(/\/+$/, "");
  const minerId = options.minerId ?? DEFAULT_MINER_ID;
  const providerSlug = options.providerSlug ?? DEFAULT_PROVIDER_SLUG;
  const maxPriceUusdc =
    options.maxPriceUusdc ?? DEFAULT_MAX_PRICE_UUSDC;
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());
  const nonce =
    options.nonce ??
    (() => `0x${randomBytes(32).toString("hex")}` as `0x${string}`);

  if (!Number.isSafeInteger(maxPriceUusdc) || maxPriceUusdc <= 0) {
    throw new Error("maxPriceUusdc must be a positive integer");
  }

  return async (request: TelemetryRequest) => {
    const url = `${nodeUrl}/engine/v1/ask/${encodeURIComponent(minerId)}`;
    const body = {
      intent: INTENT,
      params: {
        sensor: request.sensor,
        metric: request.metric,
      },
      max_budget_usdc: maxPriceUusdc,
    };

    const send = (headers: Record<string, string> = {}) =>
      fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });

    const first = await send();
    const firstBody = await readJson(first);

    if (first.status !== 402) {
      throw new Error(
        `Expected Telegraph escrow challenge, got HTTP ${first.status}`,
      );
    }

    const required = paymentDocument(first, firstBody);
    const escrow = required.accepts?.find(
      (candidate) =>
        candidate.scheme === "escrow" &&
        candidate.network === NETWORK,
    );

    if (!escrow) {
      throw new Error(
        "Telegraph did not offer the required Ethereum Sepolia escrow payment",
      );
    }

    const priceUusdc = amountUusdc(escrow);

    if (priceUusdc > maxPriceUusdc) {
      throw new Error(
        `Telegraph ask requires ${priceUusdc} uUSDC, above the ${maxPriceUusdc} uUSDC Latch ceiling`,
      );
    }

    const template = escrow.extra?.message;

    if (!template) {
      throw new Error("Telegraph escrow challenge has no message to sign");
    }

    const challengeTime = Math.floor(now().getTime() / 1000);
    const authorization = {
      from: options.signer.address,
      to: escrow.payTo,
      value: String(priceUusdc),
      validAfter: String(challengeTime - 10),
      validBefore: String(challengeTime + 60),
      nonce: nonce(),
    };

    const message = authorizationMessage(template, authorization);
    const signature = await options.signer.signMessage(message);
    const envelope = {
      x402Version: 2,
      scheme: "escrow",
      network: NETWORK,
      payload: {
        signature,
        authorization,
      },
    };

    const paid = await send({
      "X-PAYMENT": Buffer.from(JSON.stringify(envelope)).toString("base64"),
    });
    const paidBody = await readJson(paid);

    if (!paid.ok) {
      const reason =
        typeof paidBody === "object" && paidBody !== null
          ? paidBody.reason ?? paidBody.error ?? paidBody.message
          : paidBody;

      throw new Error(
        `Telegraph paid ask failed with HTTP ${paid.status}${reason ? `: ${String(reason)}` : ""}`,
      );
    }

    const purchasedAt = isoTimestamp(paidBody?.timestamp, now());
    const billedUusdc =
      Number.isFinite(Number(paidBody?.cost_usd))
        ? Math.round(Number(paidBody.cost_usd) * 1_000_000)
        : priceUusdc;

    const purchase = TelegraphPurchaseRecordSchema.parse({
      intent: String(paidBody?.intent ?? INTENT),
      providerId: String(paidBody?.miner_id ?? minerId),
      providerSlug,
      priceUusdc: billedUusdc,
      latencyMs: Number.isFinite(Number(paidBody?.duration_ms))
        ? Math.max(0, Math.round(Number(paidBody.duration_ms)))
        : 0,
      signalId:
        typeof paidBody?.signal_hash === "string"
          ? paidBody.signal_hash
          : undefined,
      paymentRail: "escrow",
      paymentReceipt: paymentReceipt(paid),
      purchasedAt,
    });

    return {
      reading: telemetryResult(paidBody),
      purchase,
    };
  };
}

/**
 * Loads the official Telegraph CLI wallet without exposing its private key.
 *
 * The wallet lives outside the repository by default at
 * ~/.telegraph/wallet.json. On POSIX systems this loader fails closed if the
 * file is readable by group/other users.
 */
export function loadLocalTelegraphSigner(
  options: LocalTelegraphWalletOptions = {},
): TelegraphMessageSigner {
  const home = options.home ?? join(homedir(), ".telegraph");
  const file = join(home, "wallet.json");

  if (process.platform !== "win32") {
    const permissions = statSync(file).mode & 0o777;

    if ((permissions & 0o077) !== 0) {
      throw new Error(
        `Telegraph wallet file permissions are too broad: ${permissions.toString(8)} (expected 600)`,
      );
    }
  }

  const document = JSON.parse(readFileSync(file, "utf8"));
  const key = String(document?.privateKey ?? "").trim();

  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error("Telegraph wallet file does not contain a valid private key");
  }

  const account = privateKeyToAccount(key as `0x${string}`);

  return {
    address: account.address,
    signMessage: (message) => account.signMessage({ message }),
  };
}
