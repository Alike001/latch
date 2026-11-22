# Stage 9 — Operations control room

Stage 9 presents the already-working Latch runtime as an operations control
room. It does not introduce a second decision engine.

## Product rule

The UI must expose runtime truth:

- machine task/state;
- local telemetry health;
- cross-operator recovery source;
- spend authorization and session limits;
- recovery attempts;
- Evidence Gate checks;
- Telegraph Provider / price / latency / receipt when a real purchase exists;
- final CONTINUE / REBUY / HOLD / ESCALATE decision.

A simulation recovery must never fabricate a Telegraph receipt.

## Failure lab

The UI controls mutate the actual simulator/runtime state:

- Disconnect telemetry
- Stale telemetry
- Wrong unit
- Corrupt integrity
- Provider unavailable
- Revoke Spend
- Restore healthy state

## Safe modes

Default:

```bash
npm run start:web
```

This starts in safe simulation mode. No Telegraph payment is possible.

Optional live mode:

```bash
LATCH_UI_LIVE_TELEGRAPH=1 npm run start:web
```

Live mode reuses the Stage 7 pinned miner `7317701`, local Telegraph wallet,
Sepolia escrow rail, and $0.01 per-attempt ceiling. The browser still requires a
confirmation before requesting live recovery.

The server does not expose the wallet private key.
