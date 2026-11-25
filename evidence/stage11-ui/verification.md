# Stage 11 UI verification — 2026-11-25

## Scope

Direction A — Instrument Panel was implemented in the existing vanilla
HTML/CSS/JavaScript control-room stack. The runtime API and safety boundary were
not replaced.

## Automated verification

`npm run verify:independent` passed:

- TypeScript typecheck;
- 9 test files;
- 77 tests;
- all 7 deterministic fixtures.

## Browser verification

Playwright exercised the rendered control-room controls against the local
runtime at `http://127.0.0.1:4173`:

| Scenario | Observed result |
| --- | --- |
| disconnected local telemetry | `REBUY` → remote simulation → Gate pass → `CONTINUE` |
| stale local telemetry | final `CONTINUE` |
| wrong-unit local telemetry | final `CONTINUE` |
| corrupt-integrity local telemetry | final `CONTINUE` |
| disconnected telemetry + revoked spend | no acquisition → `HOLD` |
| disconnected telemetry + unavailable Provider | 2 attempts, zero spend → `HOLD` |
| reset / restore | healthy local state and authorized session restored |

The simulation result explicitly says that no payment receipt was invented.
The preserved Sepolia payment proof is exposed separately through the proof
drawer. Live Telegraph spending remained disabled and no purchase was made.

A fresh browser-console read after the scenarios reported zero errors and zero
warnings.

## Visual checks

- Desktop viewport: 1440 × 1000.
- Mobile viewport: 390 × 844.
- Landing and control-room pages were checked at both sizes.
- Primary actions, failure controls, recovery rail, proof drawer, status chips
  and evidence labels remain readable without horizontal overflow.
- Focus-visible styling and reduced-motion handling are included.

## Screenshots

- `ui-before-control-room.png`
- `ui-after-landing-desktop.png`
- `ui-after-control-desktop.png`
- `ui-after-landing-mobile.png`
- `ui-after-control-mobile.png`

