# Stage 2 Status — Telemetry Simulator / State Hub

## Goal

Build the software-only telemetry layer that gives Latch deterministic machine/sensor state before any Telegraph purchase or UI work.

## Implemented on this branch

- deterministic sensor registration;
- fresh telemetry publication;
- monotonic sequence numbers;
- heartbeat and last-seen tracking;
- disconnect / reconnect control;
- stale-data injection;
- wrong-unit injection;
- integrity corruption injection;
- canonical restore path;
- deterministic HMAC-SHA256 simulator signatures;
- signature verification helper;
- sorted sensor snapshots;
- tests for normal and fault paths.

## Integrity model

Stage 2 uses HMAC-SHA256 only as a deterministic simulator integrity mechanism.

It is **not** being presented as the final Provider cryptographic design.

The important invariant for later stages is that Latch can distinguish:

- valid and fresh telemetry;
- validly signed but stale telemetry;
- validly signed but semantically wrong telemetry;
- corrupted integrity;
- unavailable telemetry.

That separation is required for the Stage 3 Evidence Gate.

## Fault semantics

### Disconnect

The sensor becomes offline and the hub returns no current reading. Latch must never invent a fallback value.

### Stale

A newly delivered reading carries an old observation timestamp but a valid integrity signature. This proves that integrity alone does not imply freshness.

### Wrong unit

A correctly signed reading uses the wrong unit. This proves that signature validity does not imply semantic correctness.

### Corrupt integrity

The payload remains visible but fails integrity verification.

### Restore

The simulator reconnects the sensor and emits a fresh reading using its canonical metric, unit, source and valid signature.

## Tests

Branch tests cover:

1. initial signed reading;
2. sequence increment on publish;
3. heartbeat without fake telemetry;
4. disconnect without fabricated fallback;
5. reconnect with fresh telemetry;
6. stale but correctly signed telemetry;
7. wrong-unit but correctly signed telemetry;
8. corrupted integrity;
9. canonical recovery;
10. duplicate / unknown sensor rejection.

## Current validation status

Implementation is complete on the Stage 2 feature branch.

Do **not** mark Stage 2 PASS until GitHub Actions reports:

- TypeScript typecheck passes;
- all Vitest tests pass;
- fixture validation passes.

## Next stage after merge

**Stage 3 — deterministic Evidence Gate**

The Evidence Gate will consume Stage 2 snapshots/readings and enforce:

- sensor identity;
- metric identity;
- allowed unit;
- finite value;
- timestamp presence;
- no future timestamps;
- max age;
- plausible range;
- required integrity/provenance.

Its output will be one of:

- CONTINUE
- REBUY
- HOLD
- ESCALATE


## Dependency gate

The first green functional run exposed 7 npm audit findings (3 moderate, 2 high, 2 critical) in the older test/toolchain dependency graph.

Before merge, the branch updates the maintained test runner/runtime helpers and CI now runs:

`npm audit --audit-level=high`

Stage 2 is not considered ready to merge until both the functional checks and this dependency gate pass.
