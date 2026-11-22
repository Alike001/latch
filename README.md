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

## Continuity

**AI agents and future chats must read `AGENTS.md` first, then `docs/HANDOFF.md` before changing scope or implementation.**

The project is already committed to Mission 11 Route 2. Do not restart idea selection unless a documented hard blocker invalidates the current plan.

## Current stage

Mission 11 claim: **recorded** under `@Alike001`.

Current build stage: **Stage 6 complete — the autonomous recovery controller is merged and validated; Latch Provider remains live as miner `7317701` with real paid evidence**.

Paid proof: `SENSOR_TELEMETRY_VERIFY_GENERAL` → `cold-zone-b-temp` / `temperature` returned **-18.4 C** with all canonical fields accepted at a cost of **$0.01**.

Next: **Stage 8 — bounded retry + spending authority with explicit authorization/revocation and session spend caps**.
