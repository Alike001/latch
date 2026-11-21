# Decision Log

## D001 — Mission
COMMIT to Telegraph Season II Mission 11, Route 2: Machines trade telemetry.

## D002 — Product name
Product name: **Latch**. Repository: `Alike001/latch`.

## D003 — Hardware
Software-only. No physical hardware dependency.

## D004 — Product boundary
Cross-operator / multi-vendor missing-intelligence recovery. Not a generic warehouse or IoT dashboard.

## D005 — Three-track design
One coherent system may qualify for Apps & Agents + Provider + Evaluator, but each track must have distinct qualifying evidence.

## D006 — Reverse engineering
Borrow architecture patterns from Open-RMF/Free Fleet, Eclipse Ditto, Mosquitto/MQTT and ThingsBoard. Do not import their full platforms unless justified.

## D007 — Evidence Gate
Never act only because a Provider returned success. Validate semantics, identity and freshness before machine action.

## D008 — Safety
Telegraph is operational task-continuation intelligence, not collision avoidance, emergency stop or certified physical safety.

## D009 — Build order
Contracts/fixtures → simulator → Evidence Gate → Provider → Telegraph registration → controller → paid purchase → retry/spend authority → UI → evaluator → independent adoption.
