import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadLocalTelegraphSigner } from "../apps/controller/src/telegraph-escrow.js";

const NODE =
  process.env.TELEGRAPH_NODE ??
  "https://devnode.telegraphprotocol.com";
const INTENT = "SENSOR_TELEMETRY_VERIFY_GENERAL";
const CHAIN_ID = "11155111";

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function main() {
  if (process.env.LATCH_EVALPOOL_UPLOAD !== "1") {
    throw new Error(
      "Refusing to change the live Telegraph Evaluation Pool. Set LATCH_EVALPOOL_UPLOAD=1 only after reviewing the exact upload file.",
    );
  }

  const selected = process.env.LATCH_EVALPOOL_FILE;

  if (!selected) {
    throw new Error(
      "LATCH_EVALPOOL_FILE is required. The current pairs.jsonl is a training corpus and must not be blindly re-uploaded. Select an explicit, reviewed JSONL file.",
    );
  }

  const file = resolve(process.cwd(), selected);
  const body = readFileSync(file);
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
        file,
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
