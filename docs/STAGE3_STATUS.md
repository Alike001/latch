# Stage 3 Status — Deterministic Evidence Gate

## Goal

Prevent an autonomous machine from acting on a Telegraph Provider response merely because the request succeeded.

The Evidence Gate answers one question:

> Is this telemetry trustworthy enough for this specific machine request?

It does not spend funds, select Providers, or execute the machine task. Those remain controller responsibilities.

## Implemented

`evaluateTelemetry(request, reading, context)` validates untrusted Provider input against the request policy.

Checks:

1. availability;
2. sensor identity;
3. metric identity;
4. accepted unit;
5. finite numeric value;
6. timestamp validity / future timestamp;
7. freshness;
8. plausible range;
9. integrity when required.

## Why input is `unknown`

Provider payloads cross a trust boundary.

Latch must not assume a remote response already satisfies its internal TypeScript types.

The Gate therefore accepts an unknown payload and explicitly validates the fields before acceptance.

Malformed or incomplete data fails closed.

## Decision semantics

### CONTINUE

Returned only when every required evidence check passes.

### REBUY

Returned for failed evidence when the caller says another Provider attempt is allowed.

The Evidence Gate does not choose the next Provider and does not spend money.

### HOLD

Default terminal action when evidence fails and no retry remains.

### ESCALATE

Returned only when the caller explicitly configures operator escalation after retry exhaustion.

This avoids turning every telemetry failure into unnecessary human intervention.

## Integrity boundary

Integrity is controlled by the request policy.

When `requireIntegrity: true`:

- a canonical reading is required;
- an integrity verifier must be provided;
- verification must succeed.

When `requireIntegrity: false`:

- integrity does not block otherwise valid telemetry.

Stage 2 HMAC remains a deterministic simulator mechanism, not a production cryptographic claim.

## Failure cases covered

Tests prove:

- valid fresh signed telemetry → CONTINUE;
- stale but correctly signed telemetry → reject freshness;
- wrong-unit but correctly signed telemetry → reject unit;
- corrupted signature → reject integrity;
- wrong sensor identity → reject identity;
- future timestamp → reject;
- implausible value → reject;
- no telemetry → availability failure, no fabricated fallback;
- required integrity with no verifier → fail closed;
- malformed Provider payload → reject;
- exhausted retry with explicit operator policy → ESCALATE;
- integrity-disabled policy behaves as configured.

## Validation status

**PASS**

GitHub Actions run `44923123801` passed with the current official GitHub Actions v7 wrappers:

- dependency audit: **0 vulnerabilities**;
- TypeScript typecheck: **passed**;
- Vitest: **25/25 tests passed** across 3 test files;
- Stage 3 Evidence Gate tests: **12/12 passed**;
- fixture validation: **7/7 passed**.

## Next stage after merge

**Stage 4 — Provider API**

Before implementing or registering the Provider, re-check the exact live canonical `SENSOR_TELEMETRY_VERIFY` Intent schema and current node requirements.
