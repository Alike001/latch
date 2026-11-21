# Stage 4 Status — Provider API

## Goal

Implement the callable telemetry Provider service that Latch can later register with Telegraph for the canonical `SENSOR_TELEMETRY_VERIFY_GENERAL` Intent.

Stage 4 is the API implementation only.

**Registration, Miner YAML finalization, on-chain registration and paid Telegraph validation remain Stage 5.**

## Current canonical contract checked on 2026-11-21

Current Telegraph/Anjoman material publishes:

- family: `SENSOR_TELEMETRY_VERIFY`
- class: judgment
- canonical Intent: `SENSOR_TELEMETRY_VERIFY_GENERAL`
- request params: `sensor`, `metric`
- answer fields:
  - `sensor`
  - `metric`
  - `value`
  - `unit`
  - `observed_at`

This matches the paid live routed request already executed for Latch on 2026-11-21, which used `sensor` + `metric`.

The assistant environment could not directly reach `devnode.telegraphprotocol.com` during this stage, so this stage does **not** claim a fresh direct devnode fetch. Before Stage 5 registration, re-run the node schema check from the user's environment.

References:

- https://anjoman.ai/docs/using/intent-schema
- https://anjoman.ai/docs/miners/yaml-config
- https://anjoman.ai/docs/miners/miner-registration
- https://github.com/telegraphprotocol/bounties/blob/main/catalog/intents.json
- https://github.com/telegraphprotocol/bounties/issues/199

## API

### GET /telemetry

Query:

```text
sensor=<sensor-id>&metric=<metric-name>
```

Successful response includes the canonical answer fields:

```json
{
  "sensor": "cold-zone-b-temp",
  "metric": "temperature",
  "value": -18.4,
  "unit": "C",
  "observed_at": "2026-11-21T14:00:00.000Z"
}
```

Latch also returns public-safe operational metadata such as source, sequence, integrity state and served time. Stage 5 Miner YAML will map the canonical fields explicitly.

### GET /health

Health only. It is not an Intent result.

## Provider-side safety / quality policy

A sensor is externally queryable only when it has an explicit `SensorServingPolicy`.

This is the Route 2 privacy boundary: the Provider does not expose arbitrary internal telemetry merely because the simulator/state hub knows it.

Before returning HTTP 200, the Provider checks:

- sensor is explicitly shareable;
- requested metric matches the policy;
- sensor is online;
- reading is canonical;
- sensor/metric identity match;
- unit matches;
- value is inside the configured plausible range;
- observation timestamp is not in the future;
- reading is fresh enough for the Provider policy;
- integrity passes when required.

Failures return non-200 responses and no fabricated fallback value.

This matters because Telegraph's current Miner guidance warns that APIs which encode failures inside HTTP 200 can cause failed answers to be treated as successful calls/signals. Latch uses real HTTP errors.

## HTTP failure examples

- 400 `invalid_request`
- 404 `sensor_not_shareable`
- 405 `method_not_allowed`
- 409 `telemetry_stale`
- 409 `telemetry_unit_mismatch`
- 409 `telemetry_out_of_range`
- 409 `telemetry_integrity_failed`
- 422 `metric_not_supported`
- 503 `telemetry_unavailable`
- 503 `integrity_verifier_unavailable`

## Test matrix

Stage 4 tests cover:

1. canonical successful response;
2. health endpoint;
3. missing/duplicate request params;
4. private sensor not exposed;
5. unsupported metric;
6. disconnected sensor;
7. stale telemetry;
8. wrong unit;
9. implausible value;
10. corrupted integrity;
11. missing integrity verifier;
12. non-GET request.

## Exact next stage

**Stage 5 — Telegraph Provider validation and registration**

Before registration:

1. fetch the exact live node schema again from the user's environment;
2. create the Miner YAML using exact canonical intent names;
3. include endpoint `description`, `intents`, and typed `params`;
4. add explicit `intent_mapping` for the canonical output fields where supported;
5. run local/free checks and registration dry-run;
6. do not rely on the currently broken `POST /dashboard/validate` endpoint;
7. only register after endpoint tests are green;
8. capture registration ID and later paid request evidence.


## Validation status

**PASS**

GitHub Actions run `44924350241`:

- dependency audit: **0 vulnerabilities**
- TypeScript typecheck: **passed**
- Vitest: **37/37 tests passed** across 4 test files
- Stage 4 Provider API tests: **12/12 passed**
- fixture validation: **7/7 passed**

PR: `#3 feat(provider): implement SENSOR_TELEMETRY_VERIFY Provider API`

Stage 4 is ready to merge.
