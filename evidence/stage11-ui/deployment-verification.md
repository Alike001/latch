# Public deployment verification — 2026-11-25

## Published checkpoint

- Git commit: `bd32825981473d23b7b08888b1a3ede34e40338d`
- CI run: `https://github.com/Alike001/latch/actions/runs/45685277169`
- CI result: passed
- Reviewer app: `https://latch-control-room.onrender.com`
- Verification time: `2026-11-25T19:28:23Z`

## Public control-room smoke test

The deployed page served the Instrument Panel UI and was exercised through its
rendered controls using a public browser session:

- disconnect telemetry → run safe recovery → final `CONTINUE`;
- reset → disconnect telemetry → revoke spend → run safe recovery → final
  `HOLD` with no acquisition;
- live Telegraph recovery remained disabled;
- no payment was attempted or made.

The only initial browser-console error was an absent favicon request. An inline
favicon was added in the follow-up deployment checkpoint; it does not add a
network dependency.

## Live Provider read-only checks

At the verification time:

- `/health` returned `ok: true` for `SENSOR_TELEMETRY_VERIFY_GENERAL`;
- the canonical temperature request returned fresh `-18.4 C` simulated
  telemetry with verified integrity metadata;
- unknown sensor returned HTTP `404` / `sensor_not_shareable`;
- unsupported metric returned HTTP `422` / `metric_not_supported`;
- Miner registration `6159` reported `activation_status: active`, no rejection,
  no retry and zero fetch attempts.

This checkpoint is read-only except for the isolated public control-room session
state. It did not create a Telegraph charge.

