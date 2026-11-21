# Stage 5 Status — Telegraph Provider Validation / Registration

## Goal

Make Latch's Stage 4 Provider publicly reachable, validate the exact Miner YAML against Telegraph, and only then register it.

## Live Intent schema re-checked by the user on 2026-11-21

The live node returned:

- `intent_name`: `SENSOR_TELEMETRY_VERIFY_GENERAL`
- `class`: `judgment`
- `miner_count`: `23`
- request schema version: `3`
- request params:
  - `sensor` — string, required
  - `metric` — string, required
- response format version: `3`
- response fields:
  - `sensor` — string
  - `metric` — string
  - `value` — number, scored, 6 decimals
  - `unit` — string
  - `observed_at` — datetime
- family / served_by: `SENSOR_TELEMETRY_VERIFY`

This is the schema Stage 5 must use.

## Public runtime

The hosted Provider runs the Stage 4 API against the Stage 2 simulator.

Public success capability:

- sensor: `cold-zone-b-temp`
- metric: `temperature`
- unit: `C`
- source: `simulator:cold-zone-b`
- simulated/testnet behavior: **yes**

The simulator publishes a fresh signed reading every 15 seconds.

The Provider still applies the Stage 4 policy gates before returning HTTP 200.

## Miner identity candidate

- id: `7317701`
- slug: `latch-telemetry`

These are candidates until Telegraph's validator confirms they are free.

Do not register if validation reports a collision.

## Miner YAML

File:

`miner/latch-telemetry.yaml`

It declares:

- exact canonical Intent only;
- exact `sensor` + `metric` GET query params;
- canonical response fields;
- explicit `intent_mapping`;
- no authentication;
- no response cache;
- conservative circuit-breaker settings.

## Free validation

Current Telegraph documentation exposes:

`POST https://integrate.telegraphprotocol.com/api/validate`

Run:

`npm run validate:miner`

This sends the raw YAML to Telegraph's validator and fails if:

- YAML is invalid;
- identity conflicts;
- Intent is not canonical;
- endpoint sandbox test fails;
- validator reports `valid: false`.

## Registration boundary

Do not spend gas until all of these are true:

1. Render endpoint is publicly healthy.
2. Direct `/telemetry` call returns a canonical fresh reading.
3. Telegraph free validation reports `valid: true`.
4. Endpoint result is successful in the validator.
5. The user confirms the registering wallet has Sepolia ETH and required MACHINA bond.

Actual registration is a wallet-bound on-chain action. Preserve the registration ID and transaction hash once performed.

## Next after registration

- confirm the registration is active via `/api/miners/{registrationId}`;
- confirm `latch-telemetry` appears in the live miner list;
- execute a pinned paid Telegraph request;
- record request/payment evidence, cost and latency;
- compare routed vs direct Provider output.

Only then mark Stage 5 complete.

## Public HTTP validator note

During PR #4, the documented HTTP validator URL returned the Anjoman HTML application shell rather than validator JSON.

Telegraph documentation is currently inconsistent: the Validation API page describes the HTTP endpoint as working, while the newer YAML Configuration page warns that the public HTTP form is unavailable and recommends the Anjoman web interface.

Stage 5 therefore uses an automated readiness workflow that checks:

- YAML structure against the current documented contract used by Latch;
- the live canonical Intent schema from the devnode;
- public Provider health and canonical response;
- freshness of the actual public reading;
- miner ID and slug availability on the live node.

The final registration gate remains the Anjoman Earn web interface, which sandbox-tests the YAML/endpoint before sending the wallet transaction.
