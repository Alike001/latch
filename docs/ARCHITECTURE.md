# Latch Architecture

## Locked path

```text
Machine Simulator
      ↓
Telemetry State Hub
      ↓
Telegraph Provider
      ↓
Telegraph paid intelligence market
      ↓
Autonomous Controller
      ↓
Evidence Gate
      ↓
CONTINUE / REBUY / HOLD / ESCALATE
```

## Safety boundary

Telegraph intelligence is operational task-continuation intelligence. Collision avoidance, emergency stop and certified physical safety remain local and out of scope.

## Evidence principle

HTTP 200 is never sufficient authorization to act.

Validate:
- sensor;
- metric;
- unit;
- value;
- freshness;
- plausibility;
- required integrity/provenance.

## First demo

A simulated cold-chain machine loses a trusted temperature capability and buys replacement telemetry through Telegraph.
