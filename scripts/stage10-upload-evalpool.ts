import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { loadLocalTelegraphSigner } from "../apps/controller/src/telegraph-escrow.js";

const NODE =
  process.env.TELEGRAPH_NODE ??
  "https://devnode.telegraphprotocol.com";
const INTENT = "SENSOR_TELEMETRY_VERIFY_GENERAL";
const CHAIN_ID = "11155111";
const FILE = join(
  process.cwd(),
  "evaluator",
  "sensor-telemetry",
  "pairs.jsonl",
);

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function main() {
  if (process.env.LATCH_EVALPOOL_UPLOAD !== "1") {
    throw new Error(
      "Refusing to change the live Telegraph Evaluation Pool. Re-run with LATCH_EVALPOOL_UPLOAD=1 after reviewing pairs.jsonl and stage10:status.",
    );
  }

  const body = readFileSync(FILE);
  const signer = loadLocalTelegraphSigner();
  const nonce = randomBytes(16).toString("hex");
  const bodyHash = sha256(body);

  const message = [
    "Telegraph eval-pool submission v1",
    `intent_id: ${INTENT}`,
    `body_sha256: ${bodyHash}`,
    `nonce: ${nonce}`,
    `chain_id: ${CHAIN_ID}`,
  ].join("\n");

  const signature = await signer.signMessage(message);
  const url = new URL("/api/evalpool/submissions", NODE);
  url.searchParams.set("intent_id", INTENT);
  url.searchParams.set("submitter", signer.address);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-ndjson",
      "X-Evalpool-Signature": signature,
      "X-Evalpool-Nonce": nonce,
    },
    body,
    signal: AbortSignal.timeout(120_000),
  });

  const text = await response.text();

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  console.log(
    JSON.stringify(
      {
        event: "stage10_evalpool_upload",
        http_status: response.status,
        submitter: signer.address,
        intent: INTENT,
        body_sha256: bodyHash,
        response: parsed,
      },
      null,
      2,
    ),
  );

  if (!response.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "stage10_evalpool_upload_failed",
      message: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
