# Telegraph Season II submission drafts

Deadline verified from the official rules: **2026-12-01 23:59 UTC**.

These are two distinct entries from one coherent system. Submit Apps & Agents
for Mission 11 and Miners / Providers for
`SENSOR_TELEMETRY_VERIFY_GENERAL`. Do not submit an Evaluator entry.

Replace bracketed placeholders before using the official form.

## Shared project details

- Project: **Latch — trusted signals before machines move**
- Team/contact: `[CONTACT]`
- GitHub account: `Alike001`
- Repository: `https://github.com/Alike001/latch`
- Reviewer app: `https://latch-control-room.onrender.com`
- Provider: `https://latch-telemetry-provider.onrender.com`
- Demo: `[DEMO_URL]`
- Recording script: `docs/DEMO_RECORDING_SCRIPT.md`
- Network: Ethereum Sepolia / Telegraph testnet
- Bounties repository star: verified for `Alike001` on 2026-11-25
- Showcase permission: `[PUBLIC_ASSET_PERMISSION]`
- Buyer introductions: `[BUYER_INTRODUCTION_PERMISSION]`

## Entry 1 — Apps & Agents

### Track and mission

- Track: Apps & Agents
- Mission: 11 — Autonomous Systems
- Route: Machines trade telemetry
- App: Latch autonomous telemetry recovery controller
- Intelligence purchased: `SENSOR_TELEMETRY_VERIFY_GENERAL`

### Short public summary

Latch is a software-only recovery layer for autonomous machines operating across
vendors or sites. When required local telemetry is missing or stale, the
controller checks its spending authority, buys replacement telemetry through
Telegraph, validates sensor identity, metric, unit, value, timestamp, freshness
and plausibility, then chooses `CONTINUE`, `REBUY`, `HOLD` or `ESCALATE`.

The working Sepolia testnet run started with unavailable local telemetry,
autonomously purchased `cold-zone-b-temp` temperature telemetry from pinned
Telegraph Engine provider `7317701` for `10000` uUSDC, recorded `42608` ms
latency and an escrow receipt, passed the Evidence Gate and returned the machine
task to `RUNNING` with decision `CONTINUE`. Failure paths are equally visible:
network failure ends at `HOLD`, Provider retries are bounded, revoked spending
prevents acquisition, and stale, wrong-unit or integrity-failed readings are
rejected.

The cold-chain machine and sensor are clearly labelled simulations. Telegraph
registration, routing, payment, signal and receipt evidence are real testnet
integrations. Latch is operational task-continuation intelligence, not emergency
stop, collision avoidance or certified functional safety.

Try the safe zero-wallet failure lab at
`https://latch-control-room.onrender.com/control-room`, or follow
`docs/SUBMISSION_RUNBOOK.md` locally.

### Five commercial answers

#### 1. Who is it for?

Autonomous fleet operators, warehouse and cold-chain integrators, and service
robots that cross operator or vendor boundaries and occasionally lack a trusted
operational reading. The need occurs whenever a task reaches infrastructure the
controller does not own or directly integrate.

#### 2. What does it improve?

Today an integrator either builds every bilateral sensor integration, pauses for
manual verification, or trusts a plausible response. Latch provides a uniform
paid recovery path with explicit cost, bounded retries and field-level evidence
checks. The demonstrated testnet purchase cost $0.01; the observed end-to-end
latency was 42.608 seconds. No production speed or customer-savings claim is
made.

#### 3. What does it do today?

It detects missing or invalid telemetry, enforces spend authorization and caps,
makes a pinned Telegraph escrow purchase, validates the canonical response and
changes the task decision. A real testnet run preserved the Intent, provider,
cost, latency, signal ID, escrow receipt and final `CONTINUE` outcome. The safe
reviewer deployment reproduces the policy and failure paths without spending.

#### 4. Why would someone adopt it?

It separates machine-control policy from vendor-specific intelligence supply,
lets operators buy only the missing reading and fails closed when evidence is
incomplete. Production adoption still needs real machine adapters, production
telemetry Providers, lower latency, service-level guarantees and an independent
security/safety review.

#### 5. How can someone try it?

Open the reviewer control room or clone the public repository and run
`npm install`, `npm run verify:independent`, then `npm run start:web`. The
independent-testing guide covers missing, stale, wrong-unit, corrupt-integrity,
Provider-outage and revoked-spend scenarios. `Alike001` maintains the project.

### How to run and evidence

- Runbook: `docs/SUBMISSION_RUNBOOK.md`
- Independent testing: `docs/INDEPENDENT_TESTING.md`
- Paid success evidence:
  `evidence/stage7-paid-recovery-summary.json`
- Phase 2 checkpoint: `evidence/phase2-submission-lock.json`
- Telegraph signal:
  `https://devnode.telegraphprotocol.com/engine/v1/signal/0xf44ccf4f86719dbd2621d782581e7316be90c56e44b967694b04937f53ae057b`
- Receipt hash:
  `0xc4767a0ad9c19d0900a55b2eaff5f921616bec9f6647467837ef24b86cf56258`
- Mission claim/update thread:
  `https://github.com/telegraphprotocol/bounties/issues/199#issuecomment-7134267618`

### Accurate limitations

- Testnet, not production or paid customer usage.
- No independent adoption is claimed until a third-party report exists.
- Machine and sensor are simulated.
- The canonical paid response did not expose the simulator signature, so the
  paid run records `integrity_not_required` rather than claiming cryptographic
  verification it could not perform.
- The observed 42.608-second latency is evidence from one successful paid run,
  not a service-level benchmark.

## Entry 2 — Miners / Providers

### Track and Intent

- Track: Miners / Providers
- Intent: `SENSOR_TELEMETRY_VERIFY_GENERAL`
- On-chain registration: `6159`
- Engine provider ID: `7317701`
- Slug: `latch-telemetry`
- Minimum price: `10000` uUSDC

### Short public summary

Latch Telemetry Provider supplies canonical machine telemetry for Telegraph's
telemetry Intent and refuses unsupported or untrustworthy requests instead of
guessing. Its current public capability is the explicitly simulated
`cold-zone-b-temp` / `temperature` sensor. Successful answers include sensor,
metric, finite value, unit and observation time, plus source, sequence and
integrity metadata from the Provider API.

Registration `6159` is active with no rejection or retry. The direct Provider
is publicly callable, and the pinned Telegraph Engine route returns a valid
payment challenge. Latch's autonomous Apps entry consumed this exact Provider
in a real $0.01 testnet purchase and used the answer to continue a machine task.
That consumption is same-project integration evidence, not independent
adoption.

### Callable examples

```bash
curl -sS https://latch-telemetry-provider.onrender.com/health
curl -sS 'https://latch-telemetry-provider.onrender.com/telemetry?sensor=cold-zone-b-temp&metric=temperature'
curl -i -sS 'https://latch-telemetry-provider.onrender.com/telemetry?sensor=unknown-sensor&metric=temperature'
curl -i -sS 'https://latch-telemetry-provider.onrender.com/telemetry?sensor=cold-zone-b-temp&metric=humidity'
```

Expected refusal behavior:

- unknown sensor: HTTP `404`, `sensor_not_shareable`;
- unsupported metric: HTTP `422`, `metric_not_supported`;
- automated tests additionally prove stale, malformed and integrity-failed
  telemetry is not returned as a paid-looking success.

### Evidence

- Live Miner: `https://devnode.telegraphprotocol.com/api/miners/6159`
- Public Provider: `https://latch-telemetry-provider.onrender.com`
- Miner YAML: `miner/latch-telemetry.yaml`
- Provider tests: `services/provider-api/test/provider-api.test.ts`
- Paid consumption evidence:
  `evidence/stage7-paid-recovery-summary.json`
- Phase 2 live checkpoint: `evidence/phase2-submission-lock.json`
- Reviewer runbook: `docs/SUBMISSION_RUNBOOK.md`

### Accurate limitations

- The current public source is a simulated cold-chain sensor, not physical
  production telemetry.
- The Provider serves one sensor/metric capability today.
- Same-project Apps consumption is disclosed and not presented as independent
  demand.
- No production SLA, customer revenue or independent adoption is claimed.

## Demo script — approximately 3 minutes 30 seconds

### 0:00–0:25 — Problem and boundary

Show the landing page. Say: “Latch is a Mission 11 Route 2 recovery layer. It
buys missing operational telemetry; it does not replace local emergency or
collision safety. The machine shown here is simulated.”

### 0:25–1:05 — Working app with a new safe input

Open the control room and use the on-screen 90-second guide. Reset the session,
choose **Disconnect telemetry**, then choose **Run safe recovery**. Follow the
five-stage rail from Detect through Decide: point out `REBUY`, authorized bounded
acquisition, the Evidence Gate result and final `CONTINUE`. State that this safe
reviewer run spends zero and creates no Telegraph receipt.

### 1:05–1:45 — Real Telegraph integration evidence

Open **Inspect preserved live proof** in the control room, then open
`evidence/stage7-paid-recovery-summary.json` for the complete record. Show Miner
registration `6159`, Engine provider `7317701`, `10000` uUSDC cost, `42608` ms
latency, signal ID, escrow receipt, accepted Evidence Gate and final `CONTINUE`.
Explain that the real purchase was preserved rather than repeated for the video.

### 1:45–2:20 — Break it

Reset, disconnect telemetry, revoke spending and run recovery. Show that no
acquisition occurs and the task ends at `HOLD`. If time permits, show Provider
unavailable exhausting two attempts and ending at `HOLD`.

### 2:20–2:55 — Provider track

Open the live registration `6159`, Provider `/health`, and one direct canonical
telemetry response. Then request an unknown sensor and show the `404`
`sensor_not_shareable` refusal. State that the paid Apps run consumed this same
registered Provider through Telegraph.

### 2:55–3:30 — Reproduce and limitations

Show `docs/SUBMISSION_RUNBOOK.md` and the one-command verification. Close with
the honest boundaries: Sepolia/testnet, simulated machine/sensor, one Provider
capability, no production customer or independent adoption claim yet.

## Third public progress update draft

Post only after reviewing the links and deciding the public/showcase wording:

> `/progress Update 3 — Latch Apps and Miner tracks are locked; Evaluator is a
> documented no-go for this submission.`
>
> Latch now has a reviewer-safe control room, a reproducible runbook and a live
> active telemetry Provider. The preserved Sepolia run shows missing local
> telemetry → spend check → $0.01 Telegraph escrow purchase from provider
> `7317701` → Evidence Gate → `CONTINUE`. The same runtime fails closed for
> revoked spending, exhausted Provider retries, stale data, wrong units and
> failed integrity.
>
> Apps reviewer: https://latch-control-room.onrender.com/control-room
> Provider: https://latch-telemetry-provider.onrender.com
> Repository: https://github.com/Alike001/latch
> Signal: https://devnode.telegraphprotocol.com/engine/v1/signal/0xf44ccf4f86719dbd2621d782581e7316be90c56e44b967694b04937f53ae057b
>
> Live registration `6159` is active with no rejection or retry. Unknown sensors
> return `404 sensor_not_shareable`; unsupported metrics return
> `422 metric_not_supported`. TypeScript, 77 tests and seven fixtures pass.
>
> Evaluator registration `243` passed transport/runtime but ordered only 9/15
> public pairs correctly, below the 70% floor. It was rejected and deregistered.
> We will not re-register the same package or re-upload the 40 pool rows. This
> is an honest model-generalization failure, and Latch does not claim an
> Evaluator entry.
>
> Boundaries: testnet; simulated machine and sensor; same-project Provider
> consumption; no production customer or independent adoption claim. We invite
> an independent developer to follow `docs/INDEPENDENT_TESTING.md` and file the
> repository's Independent Test Report issue.

## Remaining submission checklist

- [x] Apps purchase and receipt evidence
- [x] Active registered Provider and live refusal behavior
- [x] Required bounties repository star for `Alike001`
- [x] Beginner-friendly runbook and safe public deployment
- [x] Accurate testnet/simulation/adoption limitations
- [x] Commit and push the final public-safe documentation after authorization
- [x] Review and post the third progress update after authorization
- [ ] Obtain one genuine independent test report; do not fabricate it
- [ ] Record and publish the 2–5 minute demo
- [ ] Fill contact and permission fields
- [ ] Submit Apps & Agents entry through the official H2 website
- [ ] Submit Miners / Providers entry through the official H2 website
