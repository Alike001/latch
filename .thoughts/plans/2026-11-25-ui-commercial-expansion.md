# Plan: Instrument Panel UI and commercial expansion

## Goal

Make the working Latch Apps & Agents and Miner system immediately understandable,
demonstrable and submission-ready, then evaluate one adjacent commercial
integration without weakening Mission 11 Route 2.

## Inputs

- Apps paid recovery and Miner registration are already working.
- Evaluator registration 243 is closed and is a no-go for this submission.
- Telegraph administrator guidance prioritizes polished Apps & Agents and the
  Tencent, ByteDance and Virtuals commercial opportunities.
- Deadline remains 2026-12-01 23:59 UTC.

## Design decision

Direction A — Instrument Panel.

- graphite equipment surface and warm, high-contrast text;
- blue for primary operations, green for verified success, amber/red only for
  real warning and failure states;
- square controls, fine rules and monospace evidence labels;
- one five-stage causal rail: Detect → Authorize → Acquire → Verify → Decide;
- preserved live proof explicitly separated from safe simulation;
- guided 90-second judge path with advanced failure controls still available;
- responsive desktop and mobile layouts with keyboard-visible focus.

## Phase A — Public narrative correction

Status: **complete**.

- Remove the obsolete claim that Evaluator is the next build stage.
- Present only Apps & Agents and Miner as qualifying contributions.
- Distinguish Miner registration 6159 from Engine provider 7317701.
- Update the public test count from 67 to the verified 77.
- Keep simulator, testnet and preserved receipt language explicit.

## Phase B — Control-room redesign

Status: **complete**.

- Reframe the page around the recovery sequence rather than equal-weight cards.
- Combine machine task and route into one instrument.
- Add dynamic sequence states for healthy, faulted, blocked, recovered and
  Provider-failure outcomes.
- Keep every existing runtime control and API behavior.
- Add busy-state protection, pressed fault states and accessible live feedback.
- Expose raw payment proof through a progressive disclosure panel.

## Phase C — Verification

Status: **complete**. The automated suite passes 77/77 tests and all fixtures.
The rendered UI scenario matrix and desktop/mobile visual checks are recorded in
`evidence/stage11-ui/verification.md`.

- Run typecheck, all tests and deterministic fixture validation.
- Exercise disconnect → REBUY → CONTINUE.
- Exercise stale, wrong-unit and corrupt-integrity recovery.
- Exercise revoked spend → no acquisition → HOLD.
- Exercise Provider unavailable → two attempts → zero spend → HOLD.
- Restore healthy state and confirm session reset.
- Capture desktop and mobile screenshots for the landing page and control room.
- Inspect browser console, overflow, focus and critical mobile controls.

## Phase D — Submission polish

Status: **in progress**.

- Update submission drafts and demo sequence to match the new interface.
- Preserve screenshots and verification output without overwriting prior evidence.
- Keep live paid recovery disabled by default; do not spend for visual proof.

## Phase E — Commercial follow-on gate

Selected candidate: Virtuals — Telegraph Intelligence Marketplace for ACP.

Proceed only after:

- current Latch submission is ready;
- the numeric use case and unclaimed status are confirmed;
- actual ACP integration requirements are available;
- a real ACP job, payment/result record and Telegraph purchase can be reproduced;
- the extension reuses Latch instead of becoming a separate unrelated app.

Tencent Independent Enterprise Agent Verification remains the second-best
future fit. ByteDance creative work is not selected for the current deadline.

## Stop conditions

- Do not claim ACP, Virtuals, Tencent or Hunyuan integration before it works.
- Do not delay the two qualifying Latch tracks for speculative expansion.
- Do not retrain, re-register or re-upload Evaluator material.
- Do not repeat a paid Telegraph purchase only to produce UI evidence.
- Do not touch unrelated dirty files.

