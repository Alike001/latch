# Latch — Telegraph Season II Continuity Handoff

## Purpose

This is the source-of-truth handoff for any future ChatGPT conversation, coding agent, or contributor.

Do not restart idea selection. Continue from the documented stopping point.

## Current state

- **Product:** Latch
- **Repo:** `Alike001/latch`
- **Mission:** 11 — Autonomous Systems
- **Route:** Route 2 — Machines trade telemetry
- **Status:** COMMIT
- **Implementation:** software-only
- **Target tracks:** Apps & Agents + Miners/Providers + Evaluators, only where each independently qualifies
- **Mission claim:** recorded under `@Alike001` in `telegraphprotocol/bounties#199`
- **Claim bot timestamp:** `2026-11-21T15:34:37Z`

## Builder rule

The project exists to solve a Telegraph problem, not to build a random hackathon app and bolt Telegraph onto it.

Process used:
1. study official Season II problems/rules;
2. inspect current competitors;
3. validate live Providers/Intents;
4. reject weak/crowded directions;
5. select an under-served mission-native route;
6. reverse-engineer strong OSS architecture patterns;
7. build around Telegraph;
8. preserve proof/failure evidence.

Do not restart broad ideation unless a hard blocker invalidates Mission 11 Route 2.

## Important Season II rules previously verified

- 100 points per track.
- 70/100 minimum overall.
- Apps need at least 24/35 technical quality.
- Apps need a working Telegraph purchase.
- Reproducibility and a real failure case matter.
- Growth/developer activation matter.
- Multi-track entries are allowed only when each contribution is genuinely distinct.
- Testnet/simulation is acceptable when honestly labelled.
- Do not present self-dealing as independent adoption.
- Main deadline previously verified: **December 1, 2026 23:59 UTC**.

Re-check live official rules before final submission.

## Why earlier ideas were rejected

### Stock token / asset-management
Paused because stock prices were regular-session closes, not fresh enough for 24/7 operation; liquidity schema was shallow; Robinhood chain was unsupported by a richer provider; no dedicated free-float capability.

### Product authenticity
Dropped after a known counterfeit Augmentin fixture was incorrectly returned as likely/authentic by top Providers.

### Mission 15 refunds
Viable but Receipts Desk already strongly owns the obvious travel-refund route.

### Mission 03/04 institutional/legal
Strong capabilities, but crowded by Counterparty Check / Praman Desk.

## Why Mission 11 Route 2 won

- Telegraph explicitly asks for machines trading telemetry.
- Swarm Budget is Route 1, not Route 2.
- No obvious public Route 2 telemetry-market app was found at the last check.
- Current telemetry supply is weak.
- The same real gap naturally supports demand (App), supply (Provider), and measurement (Evaluator).
- The problem was reproduced directly on Telegraph.

## Product thesis

**Latch is a software-only machine intelligence recovery layer.**

When an autonomous controller lacks a trusted operational reading from another system/operator, it purchases the missing telemetry through Telegraph, validates the evidence, then chooses:

- CONTINUE
- REBUY
- HOLD
- ESCALATE

Telegraph is the runtime market/purchase layer.

## First demo vertical

Cold-chain / warehouse autonomous operations.

A simulated machine transports a temperature-sensitive load. Required telemetry becomes stale or unavailable. The controller buys replacement telemetry through Telegraph and validates it.

Commercial framing must remain cross-operator / multi-vendor. Do not frame this as a company paying to access its own sensor.

## Safety boundary

No physical hardware is required.

Telegraph is NOT used for collision avoidance, emergency stop, or certified functional safety. Local safety remains authoritative. Latch is operational task-continuation intelligence.

## Live telemetry market snapshot

At epoch 31, SENSOR_TELEMETRY_VERIFY_GENERAL showed only one non-zero Provider score among the top set:

1. chainsight-oracle — 0.3101
2. txlens — 0
3. sens-quake — 0
4. telewire-sensor-telemetry-verify — 0
5. a1-preflight — 0
6. sens-meteo — 0
7. sens-air-om — 0
8. sens-aqicn — 0
9. referenceforge-numeric — 0
10. sen-coops — 0
11. sen-ndbc — 0
12. sen-sensorcommunity — 0
13. sen-thingspeak — 0
14. sen-usgs — 0
15. sens-community — 0

Many of these are public environmental-feed wrappers rather than genuine machine-owned operational telemetry.

## Ground-truth test

Direct USGS:
- station `01646500`
- POTOMAC RIVER NEAR WASH, DC LITTLE FALLS PUMP STA
- gage height
- **2.70 ft**
- `2026-11-21T05:50:00.000-05:00`

## Paid ChainSight test

A real paid SENSOR_TELEMETRY_VERIFY_GENERAL request was made for the same station/metric.

Top-ranked ChainSight returned:
- value: **10.2**
- sensor: missing/rejected
- metric: missing/rejected
- unit: missing/rejected
- observed_at: missing

Verdict: **FAIL**

This is core project evidence.

## sen-usgs specialist test

Provider:
- id `170064`
- slug `sen-usgs`
- status active
- min price 10000 uUSDC
- endpoint `/query`
- input schema requires `venue`, `sensor`, `max_age_s`
- default sensor format `01646500:00065`

Pinned Telegraph route `/engine/v1/ask/170064` returned **HTTP 503 before payment**, so no charge occurred.

This demonstrates canonical-flow/integration weakness even for an active specialist.

## Telegraph wallet/payment context

Test wallet:
`0xde67a35b322e5a31e8215b5245ca4e48d7977f71`

Network:
Ethereum Sepolia / chain 11155111

Test USDC:
`0xcc194e1a843B658526D0D5C431f670028582Ae17`

Diamond used during setup:
`0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b`

Approval tx:
`0x24eb7b4b704a3b08e9883ab3eb029a6508babe3f52c5e1000986ebab873e3ea0`

Deposit tx:
`0xae3fecd6aa4447b4a88c2cc6e867b0827eccbb33d38d21e5b8621352e807d77d`

Typical payment challenge: EIP-191 personal_sign, 10000 uUSDC = $0.01.

Do not assume current escrow balance; re-query before relying on it.

## Existing local validation helpers

User machine folder: `~/Desktop/telegraph`

Known helpers:
- `paid-aapl-curl.py`
- `paid-product-auth-curl.py`
- `paid-product-auth-chainsight.py`
- `paid-sensor-telemetry.py`
- `paid-sensor-usgs.py`

Local helper UI used:
`http://127.0.0.1:8790`

Preserve prior evidence.

## Three-track design

### Apps & Agents
A controller detects missing telemetry, checks spend authority, buys intelligence through Telegraph, validates it, makes a deterministic task decision, and records provider/cost/latency/receipt/action.

### Provider
Implement the exact live canonical telemetry Intent. Preserve identity, metric, value, unit, timestamp/freshness and relevant integrity/provenance. Refuse unsupported/stale requests instead of fabricating.

### Evaluator
Inspect the live scoring path before building. Useful failure coverage includes wrong sensor, metric, value, unit, conversion, missing/stale/future timestamp, wrong device, bad integrity and fabricated fallback.

## Evidence Gate

A response must satisfy:
- sensor identity;
- metric;
- unit;
- parseable value;
- observation timestamp;
- not future-dated;
- within max age;
- plausible range;
- required integrity/provenance.

HTTP 200 alone is not authorization to act.

## Spend policy

Initial policy:
- max purchase: $0.01 test USDC
- max attempts per capability: 2
- configurable session cap
- explicit authorization/revocation state

Required failure scenario: Revoke Spend.

## Reverse engineering

Approved references:
- Open-RMF / Free Fleet — machine identity, controller/adapter, task/recovery patterns
- Eclipse Ditto — digital twin identity/state/policies
- Mosquitto/MQTT — pub/sub telemetry semantics
- ThingsBoard — telemetry → rule → action

Do not import entire platforms unless justified.

## Competition

### Swarm Budget — neromtoobad
Strong Mission 11 Route 1 app with simulated farm machines, budgets, re-buy and failure controls. Do not clone. Latch differentiates via Route 2 and the telemetry supply/evaluation market.

### Praman Desk — VishAlgoDev
Strong spend/circuit-breaker/compliance work, but not Latch's telemetry-market route.

### OathCast — fexx301
Weather Provider work, not Latch's core route.

Re-check Mission 11 comments if significant time passes.

## UI direction

Operations control room, not generic AI dashboard.

Machine cards should show task/state. During recovery show Telegraph Intent, Provider, price, latency, receipt, telemetry fields, Evidence Gate checks and final decision.

Required failure controls should eventually include:
- disconnect telemetry;
- stale telemetry;
- wrong unit;
- corrupted integrity;
- revoke spend;
- Provider unavailable.

## 30-second demo target

0–5s task running  
5–8s telemetry unavailable  
8–12s detect + budget check  
12–20s Telegraph purchase  
20–25s result + receipt  
25–28s Evidence Gate  
28–30s continue

Then stale telemetry → reject → hold.

## Build order

1. contracts/interfaces + deterministic fixtures
2. telemetry simulator/state hub
3. Evidence Gate
4. Provider API
5. Provider validation/registration
6. controller
7. paid purchase
8. retry/spend authority
9. operations UI
10. evaluator contribution
11. independent developer test
12. demo/docs/submission

## Exact stopping point

Completed:
- ecosystem and mission research
- competitor research
- paid Provider validation
- idea selection
- three-track strategy
- software-only/safety decision
- reverse-engineering research
- pre-build attack
- COMMIT
- Mission 11 claim
- repository creation
- Stage 1 repository foundation in progress

Next:
**Validate Stage 1, then implement Stage 2 telemetry simulator/state hub.**

## Continuity rule

After every major milestone update this document with:
- date
- commit/PR
- deployment URL
- tests/counts
- Provider IDs
- paid evidence
- evaluator status
- GO/NO-GO gates
- blockers
- exact next step

A future agent must read this file before coding.


---

# Repository milestone — Latch Stage 1 foundation pushed

Date: 2026-11-21

Repository: `Alike001/latch`

Main foundation commit: `9bc7cb1dca2037b7bd8f4ac4e2f727a63a139dc8`

CI workflow commit: `78336a8efdde045f752cdcb2ea13fd30f41eb322`

Repository now contains:
- `AGENTS.md`
- this continuity handoff
- decision and architecture docs
- TypeScript contracts
- deterministic telemetry fixtures
- contract tests
- evidence-vault guidance
- Stage 1 placeholders for simulator, Provider, controller and UI
- GitHub Actions CI for typecheck, tests and fixture validation

Validation status:
**CI configured; do not mark Stage 1 PASS until a GitHub Actions run reports success.**

Exact next build step after Stage 1 validation:
**Stage 2 — software-only telemetry simulator/state hub.**
