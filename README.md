# Latch

**Trusted signals before machines move.**

Latch is a software-only machine intelligence recovery layer being built for **Telegraph / Anjoman Season II — Mission 11: Autonomous Systems, Route 2 (Machines trade telemetry)**.

When an autonomous controller lacks a trusted operational reading, Latch buys the missing telemetry through Telegraph, validates the returned evidence, and then decides whether the machine should **CONTINUE, REBUY, HOLD, or ESCALATE**.

## Why Latch exists

While validating Telegraph's live telemetry market, we independently checked USGS station `01646500`.

Ground truth at the test time:

- Metric: gage height
- Value: **2.70 ft**
- Observed: `2026-11-21T05:50:00-05:00`

A paid request to the top-ranked telemetry Provider returned **10.2** and did not provide usable sensor identity, unit, or observation timestamp. A specialist USGS Provider (`sen-usgs`, miner `170064`) was active/scored but returned HTTP 503 through a pinned Engine Ask before payment.

Latch is built around the principle that **HTTP 200 is not permission for a machine to act**.

## Product flow

```text
Machine task
→ required telemetry unavailable/stale
→ check spending authority
→ paid Telegraph request
→ Provider response
→ Evidence Gate
→ CONTINUE / REBUY / HOLD / ESCALATE
→ preserve cost, latency, receipt and decision evidence
```

## Tracks

Latch is designed as one coherent system with potentially distinct qualifying contributions for:

- Apps & Agents
- Miners / Providers
- Evaluators

Each track must independently meet Telegraph's requirements. We will not add components merely to claim a track.

## Safety boundary

Latch does **not** replace collision avoidance, emergency stop, certified functional safety, or other local machine-safety systems. Telegraph intelligence is used for operational task continuation and recovery.

## Try Latch safely

Independent developers can run the complete failure lab without a wallet,
private key, API key, or testnet funds:

```bash
npm install
npm run verify:independent
npm run start:web
```

Open `http://127.0.0.1:4173/control-room`. The default mode cannot spend real
or testnet funds and never fabricates a Telegraph receipt. Follow the
[independent testing guide](docs/INDEPENDENT_TESTING.md) to reproduce missing,
stale, wrong-unit, corrupted-integrity, Provider-outage, and revoked-spend
scenarios, then submit an **Independent test report** through GitHub Issues.

## Continuity

**AI agents and future chats must read `AGENTS.md` first, then `docs/HANDOFF.md` before changing scope or implementation.**

The project is already committed to Mission 11 Route 2. Do not restart idea selection unless a documented hard blocker invalidates the current plan.

## Current stage

Mission 11 claim: **recorded** under `@Alike001`.

Current build stage: **Stage 10 evaluator adapter trained and validated — the
official model gate passed at 0.8889 pairwise accuracy, the safetensors delta
passed Telegraph's parser and shared-foundation runtime, and Latch's Evaluation
Pool material is active with 3/3 eligible submitters**.

Paid proof: `SENSOR_TELEMETRY_VERIFY_GENERAL` → `cold-zone-b-temp` / `temperature` returned **-18.4 C** with all canonical fields accepted at a cost of **$0.01**.

Next: **Inspect the live adapter competition/registration route and immutable
package-hosting requirements. The live telemetry scorer still uses the generic
judgment fallback; registration and canonical promotion are not yet claimed.**
