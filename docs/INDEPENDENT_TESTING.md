# Independently test Latch

This guide lets a developer who is not part of the Latch project reproduce the
safe autonomous-recovery workflow, exercise reasonable failure cases, and
report what actually happened.

The default test mode cannot spend Telegraph funds. It needs no wallet, API
key, private key, or testnet token.

## What this test establishes

The test checks that Latch:

- distinguishes healthy, stale, malformed, and unavailable local telemetry;
- recovers through a logically independent remote telemetry source;
- validates recovered evidence before changing the machine decision;
- bounds retry attempts;
- honors spending revocation;
- fails closed to `HOLD` when recovery is unavailable or unauthorized;
- never presents a simulation as a paid Telegraph request.

It does not establish production customer usage or certified machine safety.
The cold-chain machinery and safe recovery source are simulated and labelled as
such.

## Prerequisites

- Git
- Node.js 20 or newer
- npm
- A modern browser

## Install and verify

```bash
git clone https://github.com/Alike001/latch.git
cd latch
npm install
npm run verify:independent
```

The verification command must finish with:

- TypeScript typecheck passing;
- all Vitest tests passing;
- all deterministic fixtures passing.

Record the commit you tested:

```bash
git rev-parse HEAD
```

## Start the public-safe control room

```bash
npm run start:web
```

Do not set `LATCH_UI_LIVE_TELEGRAPH`. Open:

- landing page: `http://127.0.0.1:4173/`
- control room: `http://127.0.0.1:4173/control-room`

The initial state should show:

- machine task: running;
- local telemetry: healthy;
- remote Provider: available;
- spending: authorized;
- real session spend: zero.

The historical Telegraph receipt is preserved proof from an earlier paid
testnet recovery. It is not a receipt created by this simulation session.

## Failure scenarios

Use **Reset session** before each scenario. Run recovery in simulation mode
only.

| Scenario | Actions | Expected result |
| --- | --- | --- |
| Missing telemetry | Disconnect telemetry, then recover | Local decision `REBUY`; one recovery attempt; final decision `CONTINUE`; zero real spend; no new Telegraph receipt |
| Stale telemetry | Inject stale telemetry, then recover | Local evidence rejected; final decision `CONTINUE` after valid remote evidence; zero real spend |
| Wrong unit | Inject wrong unit, then recover | Local evidence rejected for unit mismatch; final decision `CONTINUE` after valid remote evidence; zero real spend |
| Corrupt integrity | Corrupt integrity, then recover | Local evidence rejected; final decision `CONTINUE` after integrity-valid remote evidence; zero real spend |
| Provider outage | Disconnect telemetry, mark Provider unavailable, then recover | Two bounded attempts; final decision `HOLD`; zero real spend; no reserved spend left behind |
| Revoked spending | Disconnect telemetry, revoke spending, then recover | No acquisition attempt; spend block reason `spend_revoked`; final decision `HOLD`; zero real spend |
| Restoration | Restore healthy state | Local telemetry and Provider available; task returns to `RUNNING` |

A surprising result is valuable. Capture it rather than forcing the expected
outcome.

## Optional HTTP reproduction

The browser controls call the same runtime endpoints shown below.

```bash
curl -s http://127.0.0.1:4173/health
curl -s http://127.0.0.1:4173/api/state
curl -s -X POST http://127.0.0.1:4173/api/reset
curl -s -X POST http://127.0.0.1:4173/api/fault \
  -H 'Content-Type: application/json' \
  -d '{"fault":"disconnect"}'
curl -s -X POST http://127.0.0.1:4173/api/recover \
  -H 'Content-Type: application/json' \
  -d '{"mode":"simulation"}'
```

Supported fault values are:

- `disconnect`
- `stale`
- `wrong_unit`
- `corrupt_integrity`
- `provider_unavailable`
- `restore`

Spending can be revoked with:

```bash
curl -s -X POST http://127.0.0.1:4173/api/spend \
  -H 'Content-Type: application/json' \
  -d '{"authorized":false}'
```

## Report the result

Open an **Independent test report** issue in this repository. Include:

- your relationship to the project, if any;
- tested commit;
- operating system, Node.js version, and browser;
- verification-command result;
- pass/fail result for every scenario attempted;
- unexpected behavior and reproduction steps;
- public-safe screenshots or logs where useful.

Never include wallet secrets, private keys, API keys, customer data, or
protected evaluation material. Independent criticism and failed reproductions
are useful project evidence and should not be softened or hidden.

## Known boundaries

- This safe workflow is an honestly labelled cold-chain simulation.
- Local and remote telemetry are separate runtime sources, but both run inside
  the local test process.
- Live Telegraph recovery is disabled unless the operator explicitly opts in.
- The canonical paid telemetry answer shape does not currently expose the
  simulator's integrity signature, so the paid path must not claim to verify
  cryptographic evidence it did not receive.
- Telegraph intelligence supports operational task continuation; emergency
  stop, collision avoidance, and certified functional safety remain local.

## Troubleshooting

- If Node.js is too old, install Node.js 20 or newer and retry.
- If port `4173` is occupied, stop the other process or start Latch with a
  different port, for example `PORT=4174 npm run start:web`.
- If installation fails, include the complete npm error and environment in the
  report, after removing any sensitive values.
- Stop the control room with `Ctrl+C`.
