const NODE =
  process.env.TELEGRAPH_NODE ??
  "https://devnode.telegraphprotocol.com";

const INTENT = "SENSOR_TELEMETRY_VERIFY_GENERAL";

async function fetchJson(path: string): Promise<any> {
  const response = await fetch(`${NODE}${path}`, {
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });

  const text = await response.text();

  let body: any;

  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(
      `${path} returned HTTP ${response.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`,
    );
  }

  return body;
}

async function main() {
  const [intent, scorer, pool] = await Promise.all([
    fetchJson(`/engine/v1/intents/${INTENT}`),
    fetchJson(`/api/wasm?resolve=${INTENT}`),
    fetchJson(`/api/evalpool/status?intent_id=${INTENT}`),
  ]);

  const result = {
    checked_at: new Date().toISOString(),
    node: NODE,
    intent: {
      name: INTENT,
      class: intent.class,
      canonical: intent.canonical ?? null,
      served_by: intent.served_by ?? intent.response?.served_by ?? null,
    },
    scorer: scorer.resolve ?? scorer,
    evalpool: {
      by_state: pool.by_state ?? null,
      submitters: pool.submitters ?? null,
      eligible_submitters: pool.eligible_submitters ?? null,
      min_submitters: pool.min_submitters ?? null,
      snapshot: pool.snapshot ?? null,
      active_snapshot: pool.active_snapshot ?? null,
      current_epoch: pool.current_epoch ?? null,
    },
  };

  console.log(JSON.stringify(result, null, 2));

  if (result.intent.class !== "judgment") {
    throw new Error(
      `Unexpected intent class ${String(result.intent.class)}; stop before building a judgment adapter`,
    );
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "stage10_status_failed",
      message: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
