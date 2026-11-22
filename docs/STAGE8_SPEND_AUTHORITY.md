# Stage 8 — bounded retry and spending authority

Stage 8 adds policy-controlled recovery spending around the Stage 7 paid
Telegraph adapter.

## Default demo policy

```text
authorized: true
max per purchase: 10000 uUSDC ($0.01)
max attempts per capability: 2
session cap: configurable
```

## Policy behavior

Before any paid recovery attempt Latch checks:

1. spending is currently authorized;
2. the planned purchase does not exceed the per-purchase ceiling;
3. the capability has attempts remaining;
4. spent + reserved + planned cost remains within the session cap.

Budget is reserved before calling the acquisition adapter. This prevents
parallel recoveries from both passing the same remaining session budget.

A failed network/Provider attempt releases its money reservation but still
consumes an attempt. A delivered purchase settles its actual recorded cost into
the session spend total.

## Required demo failure

**Revoke Spend**

When spending is revoked while telemetry is unavailable:

```text
telemetry unavailable
→ spend authority check
→ blocked: spend_revoked
→ no Telegraph request
→ no payment
→ HOLD (or explicit ESCALATE policy)
```

Valid local telemetry does not require spending authority and may continue
without a Telegraph purchase.

## Scope

Stage 8 owns bounded retry and spending authorization. It does not add the
operations UI; that remains Stage 9.
