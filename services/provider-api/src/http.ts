import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";

import {
  ProviderError,
  SENSOR_TELEMETRY_INTENT,
  type SensorTelemetryProvider,
} from "./provider.js";

interface ErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

function writeJson(
  response: ServerResponse,
  status: number,
  payload: unknown,
): void {
  const body = JSON.stringify(payload);

  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
  });
  response.end(body);
}

function singleQueryParam(
  url: URL,
  name: string,
): string | null {
  const values = url.searchParams.getAll(name);

  if (values.length !== 1) {
    return null;
  }

  const value = values[0]?.trim();
  return value ? value : null;
}

export function createProviderRequestHandler(
  provider: SensorTelemetryProvider,
): (request: IncomingMessage, response: ServerResponse) => void {
  return (request, response) => {
    if (request.method !== "GET") {
      response.setHeader("allow", "GET");
      writeJson(response, 405, {
        ok: false,
        error: {
          code: "method_not_allowed",
          message: "Only GET is supported",
        },
      } satisfies ErrorBody);
      return;
    }

    const url = new URL(
      request.url ?? "/",
      "http://latch-provider.local",
    );

    if (url.pathname === "/health") {
      writeJson(response, 200, {
        ok: true,
        service: "latch-provider-api",
        intent: SENSOR_TELEMETRY_INTENT,
      });
      return;
    }

    if (url.pathname !== "/telemetry") {
      writeJson(response, 404, {
        ok: false,
        error: {
          code: "route_not_found",
          message: "Route not found",
        },
      } satisfies ErrorBody);
      return;
    }

    const sensor = singleQueryParam(url, "sensor");
    const metric = singleQueryParam(url, "metric");

    if (!sensor || !metric) {
      writeJson(response, 400, {
        ok: false,
        error: {
          code: "invalid_request",
          message:
            "Exactly one non-empty sensor and metric query parameter are required",
        },
      } satisfies ErrorBody);
      return;
    }

    try {
      writeJson(response, 200, provider.query(sensor, metric));
    } catch (error) {
      if (error instanceof ProviderError) {
        writeJson(response, error.status, {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
          },
        } satisfies ErrorBody);
        return;
      }

      writeJson(response, 500, {
        ok: false,
        error: {
          code: "internal_error",
          message: "Provider could not complete the request",
        },
      } satisfies ErrorBody);
    }
  };
}

export interface RunningProviderServer {
  server: Server;
  origin: string;
  close(): Promise<void>;
}

export async function startProviderServer(
  provider: SensorTelemetryProvider,
  options: {
    host?: string;
    port?: number;
  } = {},
): Promise<RunningProviderServer> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 0;
  const server = createServer(createProviderRequestHandler(provider));

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Provider server did not expose an IP socket");
  }

  const portNumber = (address as AddressInfo).port;

  return {
    server,
    origin: `http://${host}:${portNumber}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      }),
  };
}
