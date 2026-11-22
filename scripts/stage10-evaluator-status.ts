import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const NODE =
  process.env.TELEGRAPH_NODE ??
  "https://devnode.telegraphprotocol.com";

const INTENT = "SENSOR_TELEMETRY_VERIFY_GENERAL";

function parseJson(path: string, raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      `${path} returned a non-JSON response: ${raw.slice(0, 500)}`,
    );
  }
}

async function fetchWithNode(path: string): Promise<any> {
  const response = await fetch(`${NODE}${path}`, {
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      `HTTP_RESPONSE:${path} returned HTTP ${response.status}: ${raw.slice(0, 500)}`,
    );
  }

  return parseJson(path, raw);
}

async function fetchWithCurl(path: string): Promise<any> {
  const url = `${NODE}${path}`;

  const { stdout, stderr } = await execFileAsync(
    "curl",
    [
      "-sS",
      "--retry",
      "2",
      "--retry-all-errors",
      "--connect-timeout",
      "10",
      "--max-time",
      "30",
      "-H",
      "Accept: application/json",
      url,
    ],
    {
      timeout: 35_000,
      maxBuffer: 4 * 1024 * 1024,
    },
  );

  if (stderr.trim()) {
    process.stderr.write(
      JSON.stringify({
        event: "stage10_status_curl_notice",
        path,
        message: stderr.trim(),
      }) + "\n",
    );
  }

  return parseJson(path, stdout);
}

async function fetchJson(path: string): Promise<any> {
  try {
    return await fetchWithNode(path);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    if (message.startsWith("HTTP_RESPONSE:")) {
      throw new Error(message.slice("HTTP_RESPONSE:".length));
    }

    process.stderr.write(
      JSON.stringify({
        event: "stage10_status_transport_fallback",
        path,
        primary: "node_fetch",
        fallback: "curl",
        reason: message,
      }) + "\n",
    );

    try {
      return await fetchWithCurl(path);
    } catch (curlError) {
      const curlMessage =
        curlError instanceof Error
          ? curlError.message
          : String(curlError);

      throw new Error(
        `${path} failed with both Node fetch and curl. node=${message}; curl=${curlMessage}`,
      );
    }
  }
}

async function main() {
  const intent = await fetchJson(
    `/engine/v1/intents/${INTENT}`,
  );
  const scorer = await fetchJson(
    `/api/wasm?resolve=${INTENT}`,
  );
  const pool = await fetchJson(
    `/api/evalpool/status?intent_id=${INTENT}`,
  );

  const result = {
    checked_at: new Date().toISOString(),
    node: NODE,
    intent: {
      name: INTENT,
      class: intent.class,
      canonical: intent.canonical ?? null,
      served_by:
        intent.served_by ??
        intent.response?.served_by ??
        null,
    },
    scorer: scorer.resolve ?? scorer,
    evalpool: {
      by_state: pool.by_state ?? null,
      submitters: pool.submitters ?? null,
      eligible_submitters:
        pool.eligible_submitters ?? null,
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
      message:
        error instanceof Error
          ? error.message
          : String(error),
    }),
  );
  process.exit(1);
});
