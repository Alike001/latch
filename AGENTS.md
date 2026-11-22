# AGENTS.md — Latch / Telegraph Season II

## Read this first

Before changing product scope, architecture, mission, or implementation, read:

1. `AGENTS.md`
2. `docs/HANDOFF.md`
3. `docs/DECISIONS.md`
4. `docs/ARCHITECTURE.md`
5. `docs/STAGE1_STATUS.md`

`docs/HANDOFF.md` is the authoritative continuity record.

## Locked direction

- **Product:** Latch
- **Mission:** Telegraph / Anjoman Season II Mission 11 — Autonomous Systems
- **Route:** Route 2 — Machines trade telemetry
- **Status:** COMMIT
- **Implementation:** software-only
- **Potential tracks:** Apps & Agents + Miners/Providers + Evaluators

Core product statement:

> Latch lets an autonomous controller buy missing operational telemetry through Telegraph, verify whether that intelligence is trustworthy, and then CONTINUE, REBUY, HOLD, or ESCALATE.

Telegraph must be essential to the runtime intelligence purchase.

## Do not drift

Do NOT:
- turn Latch into a generic IoT dashboard;
- restart random hackathon idea discovery;
- switch away from Mission 11 Route 2 without documented evidence;
- clone Swarm Budget / Route 1;
- add physical-hardware requirements;
- claim Telegraph replaces emergency stop, collision avoidance, or certified machine safety;
- build a generic chatbot;
- import ROS, Gazebo, Ditto, ThingsBoard, etc. wholesale without clear need;
- treat HTTP 200 as proof telemetry is trustworthy;
- fabricate telemetry;
- hide Provider failures;
- create three unrelated submissions just to enter three tracks;
- fake independent adoption;
- build evaluator components the live scoring path does not need;
- overwrite prior evidence.

Any major scope change must document:
1. what new evidence invalidated the existing plan;
2. why the new direction aligns better with Telegraph;
3. which previous research/evidence remains reusable;
4. why expected judging performance improves.

## Why this product exists

Live validation exposed a real Telegraph telemetry problem.

Independent USGS truth:
- station: `01646500`
- metric: gage height
- value: **2.70 ft**
- observed: `2026-11-21T05:50:00-05:00`

Paid top-ranked telemetry Provider response:
- value: **10.2**
- usable sensor identity: missing/rejected
- usable unit: missing/rejected
- observed timestamp: missing

A specialist Provider, `sen-usgs` miner `170064`, was active/scored but its pinned Engine Ask returned HTTP 503 before payment.

Latch addresses:
1. **Demand** — a machine genuinely needs missing telemetry.
2. **Supply** — Providers must return complete/fresh/source-bound data or fail safely.
3. **Measurement** — evaluation must distinguish plausible-looking telemetry from correct telemetry.

## Product boundary

First demo vertical: simulated cold-chain / warehouse operations.

The actual reusable problem is cross-operator / multi-vendor machine intelligence: a controller operates where it does not own or directly integrate every telemetry source, so it buys missing intelligence on demand.

No physical robot/sensor is required.

## Runtime flow

```text
Machine task
→ telemetry unavailable/stale
→ check spending authority
→ paid Telegraph request
→ Provider response
→ Evidence Gate
→ CONTINUE / REBUY / HOLD / ESCALATE
→ preserve cost, latency, receipt and decision evidence
```

## Evidence Gate

Validate at minimum:
- sensor identity;
- metric;
- accepted unit;
- parseable value;
- timestamp exists;
- timestamp is not in the future;
- reading age is within policy;
- value is plausible;
- required integrity/provenance evidence passes.

Failure means REJECT. Re-buy only if policy allows; otherwise HOLD/ESCALATE.

## Three-track strategy

### Apps & Agents
A controller must make a genuine autonomous Telegraph purchase and use the result for a meaningful machine task decision.

### Miner / Provider
Build a high-quality implementation for the exact live canonical SENSOR_TELEMETRY_VERIFY Intent. Re-check the live node schema before registration. Refuse stale, unsupported, malformed, or unverifiable inputs instead of guessing.

### Evaluator
Do not build evaluator work just for points. Inspect the live scoring path first. Target real failures such as wrong sensor/value/unit, stale or missing timestamp, wrong device, and integrity failure.

Each track must independently qualify.

## Reverse-engineering policy

Approved architectural references:
- Open-RMF / Free Fleet
- Eclipse Ditto
- Eclipse Mosquitto / MQTT
- ThingsBoard

Borrow patterns, not entire platforms. Telegraph's mission remains the source of truth.

## Build order

1. contracts/interfaces + deterministic fixtures
2. telemetry simulator/state hub
3. Evidence Gate runtime
4. Provider API
5. Telegraph Provider validation/registration
6. autonomous controller
7. paid Telegraph purchase
8. retry + spending authority
9. operations UI
10. evaluator contribution
11. independent developer test
12. demo/docs/submission evidence

Do not build the fancy UI before the purchase + validation loop works.

## Current status

Mission 11 claim is already recorded under `@Alike001` in `telegraphprotocol/bounties#199`.

Current stage: **Stage 7 code complete — pinned Telegraph escrow acquisition adapter merged and CI-validated; one live autonomous paid run remains**.

Exact next task: **From a local checkout of `main`, run `LATCH_LIVE_PAID=1 npm run stage7:live` exactly once, capture the output and post-call escrow status, then mark Stage 7 complete.**

## Agent working style

- Read repo context before proposing changes.
- Do not ask the user to repeat documented history.
- Re-check only time-sensitive facts when needed.
- Preserve evidence.
- Work incrementally.
- Give the user one terminal task at a time when terminal work is required.
- Never silently change the product thesis.
- Prefer one clear commit per completed engineering unit; do not create micro-commits for every file edit.
- Commit messages must state the completed outcome clearly (for example: `feat(provider): implement SENSOR_TELEMETRY_VERIFY Provider API`).
- Use intermediate commits only for real checkpoints, and keep the final PR history concise.
