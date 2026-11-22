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

Completed through Stage 6:
- ecosystem / mission / competitor research;
- Mission 11 Route 2 commitment and claim;
- Stage 1 contracts and deterministic fixtures;
- Stage 2 telemetry simulator/state hub;
- Stage 3 deterministic Evidence Gate;
- Stage 4 canonical SENSOR_TELEMETRY_VERIFY Provider API;
- Stage 5 public deployment, Telegraph registration and real paid request evidence;
- Stage 6 autonomous recovery controller with single-attempt acquisition orchestration.

Next:
**Stage 7 — paid Telegraph purchase integration.**

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


---

# Stage 2 milestone — telemetry simulator/state hub implemented

Date: 2026-11-21

Branch: `feat/stage2-telemetry-simulator`

Stage 2 implementation now includes:

- deterministic sensor registration;
- telemetry publication with monotonic sequence numbers;
- heartbeat + last-seen state;
- disconnect/reconnect controls;
- stale-reading injection;
- wrong-unit injection;
- corrupted-integrity injection;
- canonical restore path;
- deterministic HMAC-SHA256 simulator signatures;
- integrity verification helper;
- unit tests covering normal and fault paths.

Important design decision:

Stage 2 HMAC signing is a simulator integrity mechanism, not a claim about the final Provider cryptographic scheme. It exists so Stage 3 can prove that a valid signature does not imply fresh or semantically correct telemetry.

CI was also adjusted to avoid requiring an npm lockfile for setup-node caching.

Current GO/NO-GO:

**GO — VALIDATED**

GitHub Actions run `44922372245` passed on Node 24:

- dependency audit: 0 vulnerabilities;
- typecheck: passed;
- Vitest: 13/13 passed;
- fixture validation: 7/7 passed.

PR: `#1 feat: add Stage 2 telemetry simulator and state hub`

Exact next stage after merge:

**Stage 3 — deterministic Evidence Gate.**


---

# Stage 2 merge milestone

Date: 2026-11-21

PR: `#1 feat: add Stage 2 telemetry simulator and state hub`

Merge commit: `eb42ac7be080999b66c36306c43b396f87067d4e`

Status: **MERGED / COMPLETE**

Final validation before merge:

- Node: 24.22.3
- npm: 11.19.1
- dependency audit: **0 vulnerabilities**
- TypeScript typecheck: **passed**
- Vitest: **13/13 tests passed**
- fixture validation: **7/7 passed**

Stage 2 delivered:

- deterministic sensor registration;
- telemetry publication;
- sequence numbers;
- heartbeat + last-seen;
- disconnect/reconnect;
- stale-data injection;
- wrong-unit injection;
- integrity corruption;
- canonical restore;
- deterministic simulator signing/verification.

Exact stopping point now:

**Stage 3 — implement the deterministic Evidence Gate.**

Do not repeat Stage 2 work unless a regression or new requirement requires it.


---

# Stage 3 milestone — deterministic Evidence Gate implemented

Date: 2026-11-21

Branch: `feat/stage3-evidence-gate`

Stage 3 implementation now includes:

- explicit availability validation;
- sensor identity check;
- metric identity check;
- accepted-unit check;
- finite numeric value check;
- observation-time validity;
- future-timestamp rejection;
- freshness/max-age enforcement;
- plausible-range enforcement;
- policy-controlled integrity verification;
- deterministic actions: CONTINUE / REBUY / HOLD / explicit ESCALATE;
- malformed remote Provider payload rejection.

Important architectural boundary:

The Evidence Gate accepts untrusted Provider input and validates it. It does not select Providers, spend funds, or execute machine actions. Retry permission is supplied by the caller; Provider selection and spending remain Stage 6+ controller responsibilities.

Integrity rule:

When the request requires integrity, verification fails closed if the payload is non-canonical, the verifier is absent, or verification fails. When integrity is explicitly not required, signature state alone does not reject otherwise valid telemetry.

Current status:

**GO — VALIDATED**

GitHub Actions run `44923123801` passed:

- dependency audit: 0 vulnerabilities;
- typecheck: passed;
- Vitest: 25/25 passed;
- Evidence Gate tests: 12/12 passed;
- fixtures: 7/7 passed.

The CI wrappers were also updated to the current official `actions/checkout@v7` and `actions/setup-node@v7`.

Exact next stage after merge:

**Stage 4 — Provider API**, preceded by a fresh check of the live canonical SENSOR_TELEMETRY_VERIFY schema.


---

# Stage 3 merge milestone

Date: 2026-11-21

PR: `#2 feat: add Stage 3 deterministic Evidence Gate`

Merge commit: `3929bc069afb2182291bf7b2f7367bf04cbea4a1`

Status: **MERGED / COMPLETE**

Final validation:

- dependency audit: **0 vulnerabilities**
- TypeScript typecheck: **passed**
- Vitest: **25/25 tests passed**
- Evidence Gate tests: **12/12 passed**
- fixture validation: **7/7 passed**
- CI wrappers: `actions/checkout@v7`, `actions/setup-node@v7`

Stage 3 delivered:

- unknown/untrusted Provider payload validation;
- availability check;
- sensor and metric identity checks;
- accepted-unit check;
- finite numeric value check;
- timestamp validity and future rejection;
- freshness/max-age enforcement;
- plausible-range enforcement;
- policy-controlled integrity verification;
- deterministic CONTINUE / REBUY / HOLD / explicit ESCALATE outcomes;
- fail-closed behavior for malformed payloads and missing integrity verification.

Exact stopping point now:

**Stage 4 — Provider API.**

Before implementing or registering the Provider, re-check the exact live canonical `SENSOR_TELEMETRY_VERIFY` Intent schema, current Provider registration requirements, and any relevant scoring/evaluator path. Do not guess from old archived issue text.


---

# Stage 4 research + implementation milestone

Date: 2026-11-21

Branch: `feat/stage4-provider-api`

Current published canonical contract:

- family: `SENSOR_TELEMETRY_VERIFY`
- Intent: `SENSOR_TELEMETRY_VERIFY_GENERAL`
- class: judgment
- request params: `sensor`, `metric`
- answer fields: `sensor`, `metric`, `value`, `unit`, `observed_at`

This matches the live paid request shape already tested earlier on 2026-11-21.

Important verification limitation:

The assistant environment could not directly reach `devnode.telegraphprotocol.com` during Stage 4. Therefore Stage 5 must re-run the live node schema check from the user's environment before Miner registration. Do not claim the direct live node was re-fetched here.

Stage 4 Provider API implementation:

- GET `/telemetry?sensor=...&metric=...`;
- GET `/health`;
- explicit shareable-sensor policies;
- no arbitrary internal telemetry exposure;
- canonical answer fields;
- Provider-side freshness, unit, plausible-range and integrity checks;
- real non-200 failures for stale/offline/invalid telemetry;
- no fabricated fallback values;
- tests for success and failure paths.

Commit discipline added to `AGENTS.md`:

Prefer one clear commit per completed engineering unit. Avoid micro-commits and vague messages.

Current status:

**GO — VALIDATED**

GitHub Actions run `44924350241` passed:

- dependency audit: 0 vulnerabilities;
- typecheck: passed;
- Vitest: 37/37 passed;
- Provider API tests: 12/12 passed;
- fixtures: 7/7 passed.

PR: `#3 feat(provider): implement SENSOR_TELEMETRY_VERIFY Provider API`

Stage 4 uses one clear engineering commit, per repository commit discipline.

Exact next stage after merge:

**Stage 5 — Telegraph Provider validation/registration.**


---

# Stage 5 live schema verification + deployment preparation

Date: 2026-11-21

The user re-fetched the live node schema for `SENSOR_TELEMETRY_VERIFY_GENERAL`.

Live facts:

- class: judgment
- miner_count: 23
- request schema version: 3
- required params: `sensor`, `metric`
- response format version: 3
- response fields: `sensor`, `metric`, `value`, `unit`, `observed_at`
- family: `SENSOR_TELEMETRY_VERIFY`

This removes the Stage 4 direct-node verification limitation.

Stage 5 prepares:

- runnable public Provider process;
- continuously refreshed simulated cold-zone telemetry;
- Miner YAML with exact canonical schema;
- free Telegraph validator script;
- deployment to Render;
- identity candidates `id: 7317701`, `slug: latch-telemetry`.

Do not register until the public endpoint and free validator both pass.

Current status:

**DEPLOYMENT / VALIDATION IN PROGRESS**

Exact next checkpoint:

Public Render URL + Telegraph validator `valid: true`.

## Stage 5 validation correction

The first automated validator attempt used the documented `https://integrate.telegraphprotocol.com/api/validate` endpoint.

Actual result on 2026-11-21: the response was the Anjoman HTML application, not validator JSON, so no YAML pass/fail conclusion can be drawn from it.

Latch now uses an automated Stage 5 readiness check for YAML contract structure, live Intent schema, public Provider response/freshness, and miner identity availability.

Before on-chain registration, use the Anjoman Earn registration interface for the final sandbox validation.


---

# Stage 5 completion milestone — registered Provider + real paid Telegraph evidence

Date: 2026-11-21

Status: **GO — COMPLETE**

Public Provider:
- URL: `https://latch-telemetry-provider.onrender.com`
- miner id: `7317701`
- slug: `latch-telemetry`
- name: `Latch Telemetry Provider`
- canonical Intent: `SENSOR_TELEMETRY_VERIFY_GENERAL`

Live paid request:
- pinned Engine route: `/engine/v1/ask/7317701`
- sensor: `cold-zone-b-temp`
- metric: `temperature`
- HTTP status: **200**
- value: **-18.4**
- unit: **C**
- observed_at: `2026-11-21T19:53:26.338Z`
- format version: **3**
- input schema version: **3**
- field status: sensor / metric / value / unit / observed_at = **ok**
- cost: **$0.01**
- duration: **22506 ms**
- signal hash: `0x7b1f2d491b1938275dbc94524df0146687f43669ce34558364fbbba5eed928c0`

Payment evidence:
- wallet: `0xde67a35b322e5a31e8215b5245ca4e48d7977f71`
- pre-request spendable escrow: **940000 uUSDC**
- post-request spendable escrow: **930000 uUSDC**
- `charged_this_block`: **10000 uUSDC**
- `unbilled`: **10000 uUSDC** pending inclusion in the next active ledger root
- payment rail: Telegraph escrow / Ethereum Sepolia / EIP-191 personal_sign

This proves the real network path:

```text
caller
→ Telegraph paid Engine request
→ registered miner 7317701
→ Latch Provider /telemetry
→ canonical SENSOR_TELEMETRY_VERIFY_GENERAL response
→ $0.01 escrow charge
```

Important correction preserved from the captured paid payload:
the returned temperature was **-18.4 C**, not +18.4 C.

Local evidence helper:
- `~/Desktop/telegraph/paid-latch-telemetry.py`
- evidence directory: `~/Desktop/telegraph/evidence/latch-paid-validation`

Do not repeat the paid request merely to reproduce the screenshot; preserve the first successful evidence set.

Exact next stage:

**Stage 6 — implement the autonomous controller.**

Stage 6 should orchestrate task state + a single telemetry acquisition attempt + Evidence Gate evaluation. Do not add the final live payment integration or full retry/spend-authority system yet; those remain Stage 7 and Stage 8 respectively.


---

# Stage 6 completion milestone — autonomous recovery controller

Date: 2026-11-21

PR: `#5 feat(controller): add Stage 6 autonomous recovery orchestration`

Merge commit: `9a05e0d71af74d208666050a4f6abeae7c48c1ad`

Status: **MERGED / COMPLETE**

Stage 6 delivered:
- validates that the machine task declares the requested telemetry capability;
- evaluates local telemetry first and avoids a purchase when evidence already passes;
- performs exactly one injected acquisition attempt when local telemetry is missing/invalid;
- validates acquired evidence through the existing deterministic Evidence Gate;
- maps decisions to `RUNNING`, `HOLD`, or `ESCALATED`;
- preserves optional Telegraph purchase metadata for the next integration stage;
- fails closed when the acquisition adapter throws.

Validation:
- Node: **24.22.3**
- npm: **11.19.1**
- dependency audit: **0 vulnerabilities**
- typecheck: **passed**
- Vitest: **43/43 tests passed**
- controller tests: **6/6 passed**
- Evidence Gate tests: **12/12 passed**
- Provider API tests: **12/12 passed**
- telemetry simulator tests: **10/10 passed**
- contract tests: **3/3 passed**
- deterministic fixtures: **7/7 passed**

Scope boundary preserved:
- no live Telegraph signing/payment code was added in Stage 6;
- no retry loop, session budget, or authorization/revocation logic was added;
- Stage 7 owns the real paid acquisition adapter;
- Stage 8 owns retry and spend authority.

Exact next stage:

**Stage 7 — connect the controller acquisition adapter to the real Telegraph paid Engine path while keeping wallet secrets out of the repository.**


---

# Stage 7 checkpoint — dedicated Telegraph agent wallet initialized

Date: 2026-11-22

Status: **IN PROGRESS**

Goal:
connect the Stage 6 controller acquisition adapter to a real paid Telegraph purchase while keeping wallet secrets out of the repository.

Official Telegraph CLI:
- package: `@telegraphprotocol/telegraph-protocol-mcp`
- payment mode: `escrow`
- node: `https://devnode.telegraphprotocol.com`
- live Intent count observed during setup: **136**

Transient setup issue:
- first CLI attempt returned `fetch failed`;
- direct curl to `/engine/v1/intents` succeeded with **136** intents;
- Node.js `fetch` to the same endpoint also succeeded with **136** intents;
- rerunning setup then worked normally.

Dedicated agent wallet:
- address: `0x95dC03c1F3937341aEa4943fC5376085fDffBEba`
- network: Ethereum Sepolia / `eip155:11155111`
- wallet file: `~/.telegraph/wallet.json`
- **Never commit, paste, log, or expose the private key from that file.**
- Telegraph test USDC token: `0xcc194e1a843B658526D0D5C431f670028582Ae17`
- Telegraph escrow contract: `0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b`

Current wallet state at this checkpoint:
- Sepolia ETH: **0.001**
- wallet test USDC: **0**
- Telegraph escrow spendable USDC: **0**
- deposited USDC: **0**
- unbilled USDC: **0**
- pending withdrawal: **0**

Security / architecture decision:
- keep this dedicated agent wallet separate from the browser MetaMask wallet used for the manual Stage 5 proof;
- do not import the browser-wallet private key into Latch;
- Stage 7 should use the dedicated Telegraph wallet and official escrow payment semantics;
- keep the private key local under `~/.telegraph/wallet.json` with no repo secret material.

Important payment behavior confirmed from the current official Telegraph MCP implementation:
- escrow payments sign the node challenge with EIP-191 `personal_sign`;
- escrow mode does not fall back to wallet x402 payment;
- failed escrow asks are not billed;
- the private key remains local and is not part of agent config.

Exact stopping point:
**The dedicated Stage 7 wallet exists and has gas, but no Telegraph test USDC yet.**

Exact next step:
**Fund wallet `0x95dC03c1F3937341aEa4943fC5376085fDffBEba` with a small amount of Telegraph test USDC, verify with `telegraph-protocol-mcp status`, then deposit only the amount needed for Stage 7 into escrow.**


---

# Stage 7 funded-escrow checkpoint

Date: 2026-11-22

Status: **GO — READY FOR PAID ADAPTER INTEGRATION**

Dedicated agent wallet:
- address: `0x95dC03c1F3937341aEa4943fC5376085fDffBEba`
- wallet test USDC: **0.9**
- wallet Sepolia ETH: approximately **0.001**
- Telegraph escrow spendable USDC: **0.1**
- Telegraph escrow balance USDC: **0.1**
- deposited USDC: **0.1**
- unbilled USDC: **0**
- pending withdrawal USDC: **0**

Funding operation:
- amount moved to escrow: **0.1 test USDC**
- approval transaction: `0x801c60e8775263f6a0419e4de281da0d09d3a005ede0632ce35d6e00d032c650`
- deposit transaction: `0x1a9389d00bffa07ae4316d05aa8bcde1ad94eca1ebd85200eaeb8541a7f586ee`

The official CLI confirmed:
```text
Deposited. Escrow now 0.1 USDC spendable.
```

Security boundary remains unchanged:
- never commit or print `~/.telegraph/wallet.json`;
- never expose the wallet private key in logs, tests, docs, screenshots, or agent prompts;
- use the local wallet only at runtime for EIP-191 escrow challenge signing.

Exact next step:
**Implement the Stage 7 pinned Telegraph acquisition adapter for miner `7317701`, validate it in CI with mocked payment challenges, then execute one live autonomous controller recovery against the funded escrow.**


---

# Stage 7 code milestone — pinned paid acquisition adapter merged

Date: 2026-11-22

PR: `#6 feat(controller): add pinned Telegraph escrow acquisition`

Merge commit: `f455c7c034bd6ae644a8c979cc00a08fa04c61b4`

Status: **CODE COMPLETE / LIVE PROOF PENDING**

Stage 7 implementation now includes:
- direct pinned Engine route to miner `7317701`;
- hard payment ceiling of `10000 uUSDC` ($0.01);
- Ethereum Sepolia Telegraph escrow only;
- no automatic multi-miner routing;
- no fallback to direct wallet x402 settlement;
- official local Telegraph wallet loading from `~/.telegraph/wallet.json`;
- signer abstraction that never returns or logs the private key;
- EIP-191 escrow challenge signing;
- payment receipt preservation in the Telegraph purchase record;
- canonical Telegraph response mapping into the Evidence Gate;
- explicit live opt-in guard: `LATCH_LIVE_PAID=1`;
- `.telegraph/` added to `.gitignore`.

Security boundary:
- private key remains local only;
- do not paste or commit `~/.telegraph/wallet.json`;
- live runner is pinned to the registered Latch Provider and cannot authorize above $0.01.

Validation:
- dependency audit: **0 vulnerabilities**
- typecheck: **passed**
- Vitest: **49/49 tests passed**
- Stage 7 escrow adapter tests: **6/6 passed**
- controller tests: **6/6 passed**
- Evidence Gate tests: **12/12 passed**
- Provider API tests: **12/12 passed**
- telemetry simulator tests: **10/10 passed**
- contract tests: **3/3 passed**
- fixtures: **7/7 passed**

One initial CI run failed only because the live runner used top-level await under the current module mode. It was fixed by wrapping the runner in an async `main()`; the next CI run passed fully.

Funded live-wallet state immediately before the pending live run:
- agent wallet: `0x95dC03c1F3937341aEa4943fC5376085fDffBEba`
- wallet test USDC: **0.9**
- wallet Sepolia ETH: approximately **0.001**
- Telegraph escrow spendable: **0.1 USDC**
- unbilled: **0**

Exact next step:
**Run one live autonomous recovery from a local checkout of current `main`:**

```bash
LATCH_LIVE_PAID=1 npm run stage7:live
```

Expected behavior:
```text
local telemetry unavailable
→ controller invokes paid acquisition adapter
→ Telegraph returns 402 escrow challenge
→ local agent wallet signs EIP-191 challenge
→ $0.01 paid request to miner 7317701
→ canonical telemetry response
→ Evidence Gate
→ CONTINUE
```

After the run:
1. preserve the first successful live output;
2. run the official Telegraph CLI `status`;
3. confirm escrow decreased by approximately $0.01 (or appears as unbilled until the next ledger root);
4. record the result here;
5. do not repeat the paid call merely to recreate evidence.

Do not mark Stage 7 complete until that real autonomous run succeeds.


---

# Stage 7 first live autonomous attempt — network failure, safe HOLD

Date: 2026-11-22

Status: **LIVE PROOF NOT YET COMPLETE**

Command:
```bash
LATCH_LIVE_PAID=1 npm run stage7:live
```

Observed controller result:
- event: `stage7_live_paid_recovery`
- payer: `0x95dC03c1F3937341aEa4943fC5376085fDffBEba`
- task: `task-cold-chain-live-001`
- local telemetry: unavailable
- local decision: `REBUY`
- acquisition attempted: **true**
- acquisition error: **fetch failed**
- Provider decision: `HOLD`
- final decision: `HOLD`
- final task state: `HOLD`

This is correct fail-closed behavior: the controller did not fabricate telemetry and did not continue the machine task after a network acquisition failure.

Important:
- Do **not** rerun the paid command until escrow status is checked.
- At this checkpoint it is not yet known whether the failing fetch occurred before the 402 challenge, during the paid request, or after payment authorization.
- Check the official Telegraph wallet/escrow status first to determine whether the spendable balance changed or an unbilled charge appeared.

Exact next step:
**Run `npx -y @telegraphprotocol/telegraph-protocol-mcp status` and compare escrow spendable/unbilled values against the pre-run state of 0.1 / 0.**


---

# Stage 7 first live attempt — escrow verification

Date: 2026-11-22

Post-failure Telegraph status:
- wallet USDC: **0.9**
- wallet Sepolia ETH: approximately **0.001**
- escrow spendable USDC: **0.1**
- escrow balance USDC: **0.1**
- deposited USDC: **0.1**
- unbilled USDC: **0**
- spent today USD: **0**

Conclusion:
**No Telegraph payment was charged by the failed autonomous attempt.**

The `fetch failed` occurred before a billable paid request completed. It is safe to debug the network/request path without treating this as a duplicate-payment scenario.

Exact next step:
**Probe the pinned miner route with an unpaid Node fetch and confirm that it returns the expected HTTP 402 payment challenge before retrying the live paid runner.**


---

# Stage 7 pinned-route recovery probe

Date: 2026-11-22

After the first live autonomous attempt failed with `fetch failed`, an unpaid Node.js probe was run directly against:

`https://devnode.telegraphprotocol.com/engine/v1/ask/7317701`

Request:
- Intent: `SENSOR_TELEMETRY_VERIFY_GENERAL`
- sensor: `cold-zone-b-temp`
- metric: `temperature`
- max_budget_usdc: `10000`

Result:
- HTTP **402 Payment Required**
- Base Sepolia exact payment offered at **$0.01**
- Solana exact payment offered at **$0.01**
- Ethereum Sepolia Telegraph escrow offered at **$0.01**
- escrow network: `eip155:11155111`
- escrow payTo: `0x72a70e949362670bf8bcead24efc5b8f950aa08b`
- resource: `/v1/ask/7317701`
- signing: `personal_sign (EIP-191)`

Conclusion:
The pinned Telegraph route is reachable again from Node.js and is returning the expected escrow challenge. Since the previous failed live attempt was confirmed unbilled, one controlled retry of the autonomous Stage 7 runner is safe.

Exact next step:
```bash
LATCH_LIVE_PAID=1 npm run stage7:live
```
Run once only, preserve the output, then immediately re-check Telegraph escrow status.


---

# Stage 7 live autonomous paid recovery — SUCCESS

Date: 2026-11-22

Status: **LIVE PURCHASE SUCCEEDED / ESCROW POST-CHECK PENDING**

Command:
```bash
LATCH_LIVE_PAID=1 npm run stage7:live
```

Payer:
`0x95dC03c1F3937341aEa4943fC5376085fDffBEba`

Controller result:
- task id: `task-cold-chain-live-001`
- machine id: `cart-7`
- local telemetry: unavailable
- local decision: `REBUY`
- acquisition attempted: **true**
- final task state: **RUNNING**
- Provider decision: **CONTINUE**
- final decision: **CONTINUE**

Paid Telegraph purchase:
- Intent: `SENSOR_TELEMETRY_VERIFY_GENERAL`
- provider id: `7317701`
- provider slug: `latch-telemetry`
- price: **10000 uUSDC = $0.01**
- payment rail: **escrow**
- latency: **42608 ms**
- signal id: `0xf44ccf4f86719dbd2621d782581e7316be90c56e44b967694b04937f53ae057b`
- purchased at: `2026-11-22T06:31:39.909Z`

Payment receipt:
- receipt hash: `0xc4767a0ad9c19d0900a55b2eaff5f921616bec9f6647467837ef24b86cf56258`
- rail: `escrow`
- payer: `0x95dc03c1f3937341aea4943fc5376085fdffbeba`
- receipt miner field: `6159`
- Intent: `SENSOR_TELEMETRY_VERIFY_GENERAL`
- amount: `10000 uUSDC`
- epoch id: **36**
- settlement: `epoch`
- chain: `telegraph`
- receipt timestamp: `1795329106`

Evidence Gate accepted all checked properties:
- availability: pass
- sensor identity: pass
- metric identity: pass
- unit: pass
- value: pass
- future timestamp: pass
- freshness: pass
- plausibility: pass
- integrity policy: pass with `integrity_not_required`

This proves the real autonomous runtime path:

```text
machine task
→ local telemetry unavailable
→ controller chooses REBUY
→ pinned Telegraph request to miner 7317701
→ escrow challenge signed by dedicated agent wallet
→ $0.01 paid purchase
→ canonical Provider response
→ Evidence Gate passes
→ CONTINUE
→ task state RUNNING
```

Important:
- Preserve both the Engine provider id `7317701` and the receipt's separate `miner: 6159` field exactly as returned.
- Do not repeat this paid run merely to reproduce evidence.

Exact next step:
**Run `npx -y @telegraphprotocol/telegraph-protocol-mcp status` and confirm the post-call escrow debit/unbilled state. After that, Stage 7 can be marked COMPLETE.**


---

# Stage 7 completion milestone — autonomous paid Telegraph recovery

Date: 2026-11-22

Status: **GO — COMPLETE**

The successful autonomous Stage 7 run was verified against the Telegraph ledger after execution.

Post-call Telegraph wallet/escrow state:
- agent wallet: `0x95dC03c1F3937341aEa4943fC5376085fDffBEba`
- wallet test USDC: **0.9**
- wallet Sepolia ETH: approximately **0.001**
- escrow spendable USDC: **0.09**
- escrow balance USDC: **0.1**
- deposited USDC: **0.1**
- unbilled USDC: **0.01**
- pending withdrawal USDC: **0**
- CLI spent_today_usd: **0** at this instant because the charge is still pending ledger settlement

Pre-call spendable escrow was **0.10 USDC**.
Post-call spendable escrow is **0.09 USDC**.
Therefore the successful autonomous run reserved exactly **0.01 USDC**.

Combined Stage 7 proof:
- local telemetry unavailable;
- controller selected `REBUY`;
- controller invoked the pinned Telegraph acquisition adapter;
- dedicated local Telegraph wallet signed the EIP-191 escrow challenge;
- miner `7317701` returned canonical telemetry;
- Telegraph purchase cost: **10000 uUSDC = $0.01**;
- payment rail: **escrow**;
- receipt hash: `0xc4767a0ad9c19d0900a55b2eaff5f921616bec9f6647467837ef24b86cf56258`;
- signal id: `0xf44ccf4f86719dbd2621d782581e7316be90c56e44b967694b04937f53ae057b`;
- latency: **42608 ms**;
- Evidence Gate accepted availability, sensor, metric, unit, value, timestamp, freshness and plausibility;
- integrity policy passed as `integrity_not_required`;
- final controller action: **CONTINUE**;
- final task state: **RUNNING**.

Stage 7 code:
- PR: `#6 feat(controller): add pinned Telegraph escrow acquisition`
- merge commit: `f455c7c034bd6ae644a8c979cc00a08fa04c61b4`
- validation: **49/49 tests passed**
- dependency audit: **0 vulnerabilities**
- typecheck: **passed**
- fixtures: **7/7 passed**

A first live attempt failed with `fetch failed` and correctly ended in `HOLD`. It was confirmed **unbilled** before any retry. A subsequent unpaid probe returned the expected 402 challenge, and the controlled retry produced the successful paid recovery above.

This means Stage 7 demonstrates both:
1. safe fail-closed behavior on acquisition/network failure; and
2. successful autonomous paid recovery when Telegraph is reachable.

Exact next stage:

**Stage 8 — retry + spending authority.**

Required Stage 8 policy:
- explicit authorization / revocation state;
- max purchase: **$0.01** test USDC per attempt;
- max attempts per capability: **2**;
- configurable session spend cap;
- no purchase after revocation;
- no purchase after attempt exhaustion;
- no purchase that would exceed session cap;
- fail closed to HOLD or explicit ESCALATE;
- preserve attempts, spend, receipt and final decision evidence.

Required demo failure scenario:
**Revoke Spend** → controller must refuse to purchase and HOLD/ESCALATE safely.


---

# Stage 8 completion milestone — bounded retry + spending authority

Date: 2026-11-22

PR: `#7 feat(controller): add bounded retry and spend authority`

Merge commit: `212c7f8f7a9ae56b866ef9ed71ab2bd77114125b`

Status: **MERGED / COMPLETE**

Stage 8 delivered:
- explicit spend authorization and revocation;
- max per-purchase ceiling;
- max attempts per telemetry capability;
- configurable session spend cap;
- pre-call spend reservation so concurrent recoveries cannot both exceed the same remaining session budget;
- failed network/Provider attempts release reserved money but still consume an attempt;
- delivered purchases settle actual recorded spend into session state;
- bounded retry on network failure or rejected Provider evidence;
- deterministic HOLD or explicit ESCALATE when policy blocks another purchase;
- valid local telemetry continues without requiring spend authorization.

Required demo scenario implemented:
**Revoke Spend**
- telemetry unavailable;
- spend authority revoked;
- controller does not call Telegraph;
- no payment occurs;
- final state HOLD (or ESCALATED when configured).

Validation:
- dependency audit: **0 vulnerabilities**
- typecheck: **passed**
- Vitest: **59/59 tests passed**
- Stage 8 spend-authority tests: **10/10 passed**
- Stage 7 escrow adapter tests: **6/6 passed**
- Stage 6 controller tests: **6/6 passed**
- Evidence Gate tests: **12/12 passed**
- Provider API tests: **12/12 passed**
- telemetry simulator tests: **10/10 passed**
- contract tests: **3/3 passed**
- fixtures: **7/7 passed**

Default demo policy remains:
- max purchase: **10000 uUSDC = $0.01**
- max attempts per capability: **2**
- session cap: configurable
- explicit authorization/revocation state

Build order status:
1. contracts/interfaces + fixtures — COMPLETE
2. telemetry simulator/state hub — COMPLETE
3. Evidence Gate — COMPLETE
4. Provider API — COMPLETE
5. Provider validation/registration — COMPLETE
6. autonomous controller — COMPLETE
7. paid Telegraph purchase — COMPLETE
8. retry + spending authority — COMPLETE
9. operations UI — NEXT
10. evaluator contribution
11. independent developer test
12. demo/docs/submission evidence

Exact next stage:
**Stage 9 — operations UI.**

The UI must expose existing runtime truth rather than invent new logic:
- machine task/state;
- telemetry healthy/stale/unavailable state;
- Telegraph Intent / Provider / price / latency / receipt;
- Evidence Gate checks;
- attempts and session spend;
- authorization state;
- final CONTINUE / REBUY / HOLD / ESCALATE decision;
- failure controls for disconnect telemetry, stale telemetry, wrong unit, corrupted integrity, revoke spend, and Provider unavailable.


---

# Stage 9 code milestone — operations control room

Date: 2026-11-22

PR: `#8 feat(web): build Stage 9 operations control room`

Merge commit: `cfe75860f554d4592b9d9dcf61c1b66b800fcda5`

Status: **CODE COMPLETE / BROWSER ACCEPTANCE PENDING**

Stage 9 implementation:
- functional operations control room served by the repository itself;
- no separate business-logic copy: UI calls the existing simulator, Evidence Gate, Stage 8 spend authority and Stage 7 live Telegraph adapter;
- machine task/state display;
- local telemetry status and integrity state;
- independent remote Provider status;
- spend authorization, attempt limit and session spend display;
- Evidence Gate check-by-check result display;
- real Telegraph Provider / price / latency / receipt shown only when a real purchase exists;
- Stage 7 historical live proof shown separately from current-session purchases;
- event log;
- responsive desktop/mobile layout.

Failure Lab controls mutate actual runtime state:
- disconnect telemetry;
- stale telemetry;
- wrong unit;
- corrupt integrity;
- Provider unavailable;
- restore healthy state;
- Revoke Spend / Authorize Spend.

Cross-operator design preserved:
- local machine telemetry and remote Provider telemetry are independent sources;
- a local sensor failure does not imply the remote Provider failed;
- this remains the Mission 11 Route 2 telemetry-market problem, not a company paying to read its own sensor.

Payment honesty:
- default `npm run start:web` is safe simulation mode and cannot spend Telegraph funds;
- simulation recovery never fabricates a Telegraph receipt;
- optional live mode requires explicit `LATCH_UI_LIVE_TELEGRAPH=1`;
- live mode reuses pinned miner `7317701`, Sepolia escrow, local Telegraph wallet, and the $0.01 per-attempt ceiling.

Validation:
- dependency audit: **0 vulnerabilities**
- typecheck: **passed**
- Vitest: **67/67 tests passed**
- Stage 9 control-room tests: **8/8 passed**
- Stage 8 spend-authority tests: **10/10 passed**
- Stage 7 escrow adapter tests: **6/6 passed**
- Stage 6 controller tests: **6/6 passed**
- Evidence Gate tests: **12/12 passed**
- Provider API tests: **12/12 passed**
- telemetry simulator tests: **10/10 passed**
- contract tests: **3/3 passed**
- fixtures: **7/7 passed**

Browser acceptance still required before declaring Stage 9 fully complete:
1. pull current `main`;
2. run `npm run start:web`;
3. open `http://127.0.0.1:4173`;
4. verify desktop layout and readable state hierarchy;
5. inject each failure control and confirm displayed state matches runtime behavior;
6. verify Revoke Spend prevents recovery purchases;
7. keep live Telegraph mode disabled during this acceptance pass.

Do not proceed to Stage 10 evaluator work until the control room passes this browser acceptance checkpoint.


---

# Stage 9B product UI milestone — landing page + polished control room

Date: 2026-11-22

PR: `#9 feat(web): add product landing page and polish control room`

Merge commit: `ba0ae9a4ade998038edd92c284515b35e8d41417`

Status: **CODE COMPLETE / BROWSER ACCEPTANCE PENDING**

What changed:
- `/` is now a real product landing page;
- `/control-room` is the functional operations surface;
- landing page explains the real Telegraph telemetry failure that produced Latch;
- landing page presents the single coherent three-track strategy:
  - Apps & Agents — autonomous recovery buyer;
  - Miners / Providers — canonical telemetry supply;
  - Evaluators — measurement of identity/value/unit/time/freshness/integrity;
- landing page includes verified Stage 7 proof without inventing new claims;
- control-room hierarchy is tighter and less presentation-heavy;
- machine state, telemetry, Evidence Gate, Telegraph evidence, spend authority and failure controls are prioritized;
- simulation accounting corrected: simulation still exercises authorization/attempt policy but records **0 real USDC spend** and never fabricates a Telegraph receipt;
- live Telegraph mode remains explicit opt-in and unchanged.

Validation:
- dependency audit: **0 vulnerabilities**
- typecheck: **passed**
- Vitest: **67/67 tests passed**
- control-room HTTP/runtime tests: **8/8 passed**
- deterministic fixtures: **7/7 passed**

Browser acceptance checklist:
1. pull current `main`;
2. run `npm run start:web`;
3. review landing page at `http://127.0.0.1:4173/`;
4. open control room at `http://127.0.0.1:4173/control-room`;
5. verify desktop layout and hierarchy;
6. verify mobile/responsive behavior if possible;
7. run the failure scenarios in safe simulation mode;
8. confirm Revoke Spend blocks recovery;
9. confirm simulation recovery shows no real Telegraph receipt and no real session USDC spend;
10. do not enable live mode during this acceptance pass.

Do not begin Stage 10 evaluator work until this browser acceptance is accepted.


---

# Stage 9 presentation decision — UI frozen, core functionality prioritized

Date: 2026-11-22

Status: **ACCEPTED FOR NOW / UI POLISH FROZEN**

Browser review confirmed:
- landing page is usable as the public product surface;
- control room is usable as the operational demo surface;
- information hierarchy is materially improved from the first shell;
- current UI is sufficient for the hackathon while core functionality remains unfinished.

Product decision:
**Do not spend more time on visual polish now.**

Return to the locked build order and prioritize:
1. Stage 10 evaluator contribution;
2. deeper feature and end-to-end testing;
3. Stage 11 independent developer test;
4. Stage 12 demo/docs/submission evidence;
5. only then revisit non-blocking UI/UX polish.

This does not change the product thesis, mission, route, or three-track strategy.

Exact next task:
**Inspect Telegraph's current live evaluator/scoring path and implement only an evaluator contribution that genuinely participates in scoring for SENSOR_TELEMETRY_VERIFY_GENERAL or the relevant live telemetry path.**


---

# Stage 10 evaluator foundation milestone

Date: 2026-11-22

PR: `#10 feat(evaluator): add telemetry preference corpus and live tooling`

Merge commit: `f86511f387b60d99ac0a3623d1c1df8bcfffd329`

Status: **FOUNDATION MERGED / LIVE NETWORK CHECK NEXT**

Official live classification verified from Telegraph public catalogue:
- family: `SENSOR_TELEMETRY_VERIFY`
- intent: `SENSOR_TELEMETRY_VERIFY_GENERAL`
- class: **judgment**
- canonical answer fields: `sensor`, `metric`, `value`, `unit`, `observed_at`
- evaluator route: **question pairs + adapter on family prefix**
- do not build a deterministic comparator for this family

Stage 10 merged artifacts:
- **40 public preference pairs**
- five operational machine scenarios
- eight failure classes:
  - wrong sensor
  - wrong metric
  - wrong unit
  - non-numeric value
  - implausible value
  - stale timestamp
  - future timestamp
  - missing timestamp
- deterministic reference rubric used only for corpus QA
- live Intent/scorer/Evaluation Pool status script
- guarded EIP-191 Evaluation Pool uploader
- official V2 ModernBERT/LoRA adapter training instructions
- documentation of the integrity/schema limitation

Important integrity limitation:
The live family description mentions cryptographic payload integrity and calibration bounds, but the current canonical answer shape exposes only sensor/metric/value/unit/observed_at. Latch must not claim an evaluator can cryptographically verify evidence that is absent from the scored answer.

Official V2 adapter direction:
- LoRA safetensors delta on the shared ModernBERT-base Foundation Model
- register on the `SENSOR_TELEMETRY_VERIFY` family prefix
- comparator / rank_answer / Q32.32 / full-model WASM formats are not accepted
- promotion depends on the network's hidden evaluation competition

Validation:
- **71/71 tests passed**
- evaluator corpus tests: **4/4 passed**
- typecheck: **passed**
- dependency audit: **0 vulnerabilities**
- deterministic fixtures: **7/7 passed**

Evaluation Pool diversity rule:
A judgment pool is only used once it has enough independent contributors. Latch must not fake contributor diversity with multiple addresses controlled by the same builder.

Exact next command:
```bash
npm run stage10:status
```

Capture:
- live Intent class
- resolved scoring family/module
- routed state
- Evaluation Pool submitter counts
- eligible submitter count
- active snapshot/current epoch

Do not upload material or start expensive adapter training until this live state is captured.


---

# Stage 10 live scorer/pool checkpoint + corpus correction

Date: 2026-11-22

Live status command:
`npm run stage10:status`

Transport:
- Node fetch failed on the local machine because of the known Node/OpenSSL issue;
- curl fallback succeeded;
- read-only status completed successfully.

Live Intent:
- `SENSOR_TELEMETRY_VERIFY_GENERAL`
- class: **judgment**
- served by family: `SENSOR_TELEMETRY_VERIFY`

Live scorer:
- class: **judgment**
- served_by: `GENERIC`
- inherited: **true**
- scorer: `judgment`
- routed: **true**
- generic_fallback: **true**

Conclusion:
**No telemetry-specific scorer is active on this path; the Intent currently uses the generic judgment fallback.**
A specialist telemetry adapter would therefore fill a real scoring gap.

Live Evaluation Pool:
- eligible rows: **314**
- quarantine rows: **390**
- rejected rows: **1**
- submitters: **2**
- eligible submitters: **2**
- live devnode `min_submitters`: **3**
- snapshot rows: **314**
- snapshot submitters: **2**
- qualification rows: **165**
- ranking rows: **149**
- ranking split: **5000 bps**
- quality rules: `evalpool-quality-v1`
- snapshot published: `2026-11-17T11:48:07.052641Z`
- activation epoch: **1**
- current epoch: **38**

Documentation discrepancy:
The public Telegraph evaluation-data guide currently says judgment questions are used after at least 5 contributors, while this live devnode reports `min_submitters: 3`. Preserve both facts. For decisions against this devnode, use its live status value rather than silently rewriting the documentation.

Critical corpus correction caught before upload:
Telegraph allows one normalized question per row. The first Stage 10 corpus had 40 preference rows but only 5 distinct prompts because each scenario reused its prompt across eight fault variants. No live upload occurred.

Corrected upload gate:
- 40 preference rows;
- **40 distinct normalized questions**;
- five operational domains;
- eight failure classes;
- no upload until CI proves the distinct-prompt invariant.

If the Latch wallet is not already one of the two submitters, admitted material could make it the third live-devnode contributor. Do not claim that threshold is met until a post-upload status proves it.


---

# Stage 10 live Evaluation Pool upload — SUCCESS

Date: 2026-11-22

Upload command:
`LATCH_EVALPOOL_UPLOAD=1 npm run stage10:upload-material`

Pre-upload corpus gate:
- rows: **40**
- distinct normalized prompts: **40**
- failure classes: **8**

Upload result:
- HTTP status: **200**
- intent: `SENSOR_TELEMETRY_VERIFY_GENERAL`
- submitter: `0x95dC03c1F3937341aEa4943fC5376085fDffBEba`
- body SHA256: `adfffb5732a49730ed292bcac1ca235a5a9ba72e63078bc9c38ddf385971b677`
- signed: **true**
- received: **40**
- accepted: **40**
- duplicate: **0**
- rejected: **0**
- curated: **40**
- resulting state counts immediately after upload:
  - admitted: **40**
  - eligible: **314**
  - quarantine: **390**
  - rejected: **1**

Post-upload live status:
- current epoch: **39**
- submitters: **3**
- eligible submitters: **2**
- live devnode min_submitters: **3**
- active snapshot rows: **314**
- active snapshot submitters: **2**
- active snapshot corpus version: `7d5057566b24b2e5eec0e8915e1af37391e5e433d6703aa46b211eadab18a6c7`
- scorer remains **GENERIC judgment fallback**

Interpretation:
The Latch wallet is now the third distinct submitter, but its 40 rows are only `admitted`, not yet `eligible`. Telegraph freezes pool state at epoch rollover. Until a later snapshot contains the Latch contribution, the active snapshot correctly remains at two submitters and the generic fallback remains in place.

Do not claim the contributor threshold has activated yet.

Stage 10 material contribution status:
**LIVE UPLOAD COMPLETE / SNAPSHOT ACTIVATION PENDING**

Next evaluator step:
Proceed with the official `SENSOR_TELEMETRY_VERIFY` ModernBERT/LoRA adapter preparation and local data check while continuing to use `npm run stage10:status` as the network gate before any adapter registration or promotion claim.


---

# Stage 10 official dataset gate — first run and hardening

Date: 2026-11-22

Official Telegraph evaluator kit was successfully downloaded and verified after local network/TLS retries:
- archive integrity: **ARCHIVE OK**
- Python venv created
- NumPy installed
- `float_runtime.train_adapter --check-data` executed against the Latch corpus

First official gate result:
**FAIL (40 pairs)**

Passing diagnostics:
- unique negatives: **100.0%**
- held-out leak: **0.0%**
- surface probe: **65.0%** (no failure marker)

Failing diagnostics:
- largest single negative: **2.5% > 2%**
- pick-shorter shortcut: **66.2% > 65%**
- mean lengths: chosen **119**, rejected **117** characters

Interpretation:
The 2% rule is mathematically impossible for a 40-pair corpus even with all negatives unique because a single appearance is 1/40 = 2.5%. The corpus therefore needs >50 rows. The length result also shows a minor answer-length shortcut.

Hardening decision:
- expand training corpus from **40 → 64 pairs**;
- expand machine domains from **5 → 8**;
- keep eight telemetry failure classes;
- make every rejected answer unique;
- balance shorter/longer rejected variants;
- represent missing timestamp as `observed_at: null` so structure is preserved while freshness remains unverifiable;
- add local CI gates matching the official 2% negative-reuse and 65% length-shortcut limits.

Reproducibility:
The exact 40-row corpus already uploaded to Telegraph remains archived at:
`evaluator/sensor-telemetry/history/evalpool-upload-2026-11-22.jsonl`

Its live-upload SHA256 remains:
`adfffb5732a49730ed292bcac1ca235a5a9ba72e63078bc9c38ddf385971b677`

The expanded 64-pair corpus is for adapter training and must not be automatically re-uploaded to the live Evaluation Pool.

Uploader safety:
`stage10:upload-material` now requires an explicit `LATCH_EVALPOOL_FILE` in addition to `LATCH_EVALPOOL_UPLOAD=1`, preventing accidental re-upload of the evolving training corpus.
