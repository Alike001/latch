import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  ControlRoomRuntime,
  type ControlRoomFault,
  type RecoveryMode,
} from "./runtime.js";

const PUBLIC_DIR = join(process.cwd(), "apps", "web", "public");

function asset(name: string): string {
  return readFileSync(join(PUBLIC_DIR, name), "utf8");
}

const INDEX_HTML = asset("index.html");
const APP_JS = asset("app.js");
const STYLES = asset("styles.css");

function json(response: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body, null, 2);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
  });
  response.end(payload);
}

function text(
  response: ServerResponse,
  status: number,
  body: string,
  contentType: string,
): void {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

async function readJson(request: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export interface ControlRoomServerOptions {
  host?: string;
  port?: number;
  liveTelegraphEnabled?: boolean;
  runtime?: ControlRoomRuntime;
}

export async function startControlRoomServer(
  options: ControlRoomServerOptions = {},
) {
  const runtime =
    options.runtime ??
    new ControlRoomRuntime({
      liveTelegraphEnabled: options.liveTelegraphEnabled ?? false,
    });

  const server = createServer(async (request, response) => {
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    );

    try {
      if (request.method === "GET" && url.pathname === "/") {
        return text(response, 200, INDEX_HTML, "text/html; charset=utf-8");
      }

      if (request.method === "GET" && url.pathname === "/app.js") {
        return text(response, 200, APP_JS, "text/javascript; charset=utf-8");
      }

      if (request.method === "GET" && url.pathname === "/styles.css") {
        return text(response, 200, STYLES, "text/css; charset=utf-8");
      }

      if (request.method === "GET" && url.pathname === "/health") {
        return json(response, 200, {
          ok: true,
          service: "latch-control-room",
        });
      }

      if (request.method === "GET" && url.pathname === "/api/state") {
        return json(response, 200, runtime.state());
      }

      if (request.method === "POST" && url.pathname === "/api/fault") {
        const body = await readJson(request);
        const fault = body.fault as ControlRoomFault;

        if (
          ![
            "disconnect",
            "stale",
            "wrong_unit",
            "corrupt_integrity",
            "provider_unavailable",
            "restore",
          ].includes(fault)
        ) {
          return json(response, 400, { error: "unknown_fault" });
        }

        return json(response, 200, runtime.injectFault(fault));
      }

      if (request.method === "POST" && url.pathname === "/api/spend") {
        const body = await readJson(request);

        if (typeof body.authorized !== "boolean") {
          return json(response, 400, { error: "authorized_must_be_boolean" });
        }

        return json(
          response,
          200,
          runtime.setSpendAuthorized(body.authorized),
        );
      }

      if (request.method === "POST" && url.pathname === "/api/recover") {
        const body = await readJson(request);
        const mode = body.mode as RecoveryMode;

        if (mode !== "simulation" && mode !== "live") {
          return json(response, 400, { error: "mode_must_be_simulation_or_live" });
        }

        return json(response, 200, await runtime.recover(mode));
      }

      if (request.method === "POST" && url.pathname === "/api/reset") {
        return json(response, 200, runtime.resetSession());
      }

      return json(response, 404, { error: "not_found" });
    } catch (error) {
      return json(response, 500, {
        error: "control_room_error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 4173;

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("control room server did not expose a TCP address");
  }

  return {
    host,
    port: address.port,
    runtime,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function main(): Promise<void> {
  const running = await startControlRoomServer({
    host: process.env.HOST ?? "127.0.0.1",
    port: Number(process.env.PORT ?? "4173"),
    liveTelegraphEnabled: process.env.LATCH_UI_LIVE_TELEGRAPH === "1",
  });

  console.log(
    JSON.stringify({
      event: "control_room_started",
      url: `http://${running.host}:${running.port}`,
      liveTelegraphEnabled:
        process.env.LATCH_UI_LIVE_TELEGRAPH === "1",
    }),
  );

  async function shutdown(signal: string) {
    console.log(JSON.stringify({ event: "control_room_stopping", signal }));
    await running.close();
    process.exit(0);
  }

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

if (process.argv[1]?.endsWith("server.ts")) {
  void main().catch((error) => {
    console.error(
      JSON.stringify({
        event: "control_room_failed",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exit(1);
  });
}
