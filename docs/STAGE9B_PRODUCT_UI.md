# Stage 9B — Product UI and landing page

Stage 9B turns the validated control-room shell into the public product surface.

## Routes

- `/` — product landing page
- `/control-room` — operational control room

## Landing page goals

The landing page explains Latch before a judge enters the runtime:

1. the machine loses trusted telemetry;
2. spend policy authorizes recovery;
3. Telegraph supplies replacement intelligence;
4. the Evidence Gate validates it;
5. the task CONTINUE / REBUY / HOLD / ESCALATE decision is explicit.

It also preserves the origin of the product: Latch was created after live Telegraph
telemetry validation exposed incomplete/incorrect responses, not from generic idea
brainstorming.

## Three-track framing

The landing page presents one coherent market system:

- Apps & Agents — the autonomous recovery buyer;
- Miners / Providers — canonical telemetry supply;
- Evaluators — measurement of identity, value, unit, time, freshness and integrity.

This is not three unrelated submissions.

## Control-room polish

The control room is intentionally denser than the landing page. Machine state,
telemetry, decision evidence and spend authority appear before demo controls.

Simulation mode remains safe and honest:
- no Telegraph payment;
- no fabricated receipt;
- no simulated session value presented as real USDC spend.

Live mode remains opt-in via `LATCH_UI_LIVE_TELEGRAPH=1`.
