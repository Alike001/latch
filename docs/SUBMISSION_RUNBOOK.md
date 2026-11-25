# Latch submission verification runbook

This runbook verifies the two qualifying Latch tracks without spending funds or
recreating historical evidence.

## Scope and safety boundary

Latch is a software-only Mission 11 Route 2 system. The cold-chain machine and
sensor are explicitly simulated. Telegraph registration, routing, escrow
payment and receipt evidence are real testnet integrations. Latch provides
operational task-continuation intelligence; it is not an emergency-stop,
collision-avoidance or certified machine-safety system.

## 1. Verify the repository

Use Node.js 20 or newer from the repository root:

```bash
npm install
npm run verify:independent
```

The command must pass TypeScript checking, all tests and all deterministic
fixtures. The Phase 2 checkpoint at commit
`5c0eae991523b772521e7ffaf124e4f437170687` passed 77 tests and seven fixtures.

Do not use `npm run validate:miner` as an availability check after registration:
that pre-registration script intentionally rejects the already-claimed
`7317701` / `latch-telemetry` identity as a collision.

## 2. Verify Apps & Agents safely

Start the local control room without live Telegraph spending:

```bash
npm run start:web
```

Open `http://127.0.0.1:4173/control-room` and follow
the on-screen 90-second guide. The five-stage rail makes Detect, Authorize,
Acquire, Verify and Decide visible as separate states. Use
`docs/INDEPENDENT_TESTING.md` for the complete matrix and confirm these paths:

- missing telemetry → `REBUY` → accepted remote evidence → `CONTINUE`;
- stale, wrong-unit or corrupt-integrity local evidence is rejected;
- unavailable Provider exhausts two attempts and ends at `HOLD`;
- revoked spend makes no acquisition attempt and ends at `HOLD`.

Simulation sessions spend zero and produce no Telegraph receipt. The preserved
public-safe proof is `evidence/stage7-paid-recovery-summary.json`; do not repeat
the purchase for a screenshot. It records:

- canonical Intent `SENSOR_TELEMETRY_VERIFY_GENERAL`;
- pinned Engine provider `7317701`;
- `10000` uUSDC cost;
- `42608` ms latency;
- escrow receipt hash and signal ID;
- failed local evidence → paid purchase → Evidence Gate → `CONTINUE`.

## 3. Verify Miner / Provider live state

Read the registration and public service without payment:

```bash
curl -sS https://devnode.telegraphprotocol.com/api/miners/6159
curl -sS https://latch-telemetry-provider.onrender.com/health
curl -sS 'https://latch-telemetry-provider.onrender.com/telemetry?sensor=cold-zone-b-temp&metric=temperature'
```

Expected state:

- registration `6159` is `active`, with no rejection or retry;
- Provider health is `ok: true`;
- telemetry includes sensor, metric, numeric value, unit and fresh
  `observed_at`;
- the payload is labelled `simulator:cold-zone-b`.

An unpaid POST to `/engine/v1/ask/7317701` must return HTTP `402` with a payment
challenge. Stop there; a `402` proves the pinned paid route is reachable without
creating another charge.

The Provider refuses unsupported requests instead of guessing:

- unknown sensor → HTTP `404`, `sensor_not_shareable`;
- unsupported metric → HTTP `422`, `metric_not_supported`.

The automated suite additionally covers stale telemetry, malformed payloads,
failed integrity and missing integrity verification.

## 4. Evidence boundaries

Use `evidence/README.md` as the evidence index. Preserve original receipts and
logs; do not edit them for presentation. Never expose local wallet files or
private keys.

Evaluator registrations `235` and `243` are not qualifying submissions.
Registration `243` was rejected at 9/15 public pairs and later deregistered.
Do not claim an Evaluator track unless a future adapter clears every gate in the
completion plan.

The Stage 11 browser scenario matrix and desktop/mobile visual evidence are in
`evidence/stage11-ui/verification.md`.

The exact 3-minute-20-second browser walkthrough, narration and recording-safety
checklist are in `docs/DEMO_RECORDING_SCRIPT.md`.
