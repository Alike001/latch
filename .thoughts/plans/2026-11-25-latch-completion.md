# Plan: Latch completion after evaluator qualification failure

## Inputs

- `AGENTS.md` and `docs/HANDOFF.md` remain authoritative for scope.
- Apps & Agents has a preserved paid autonomous recovery through Telegraph.
- Miner registration `6159` / Engine provider `7317701` is active and healthy.
- Evaluator registration `243` completed its public batch in `3m49.935s` but
  was rejected at `9/15` (`60%`) against a `70%` floor.
- The evaluator diagnosis found narrow same-template validation and complete
  divergence between the exact 40 uploaded rows and the final 64-row training
  corpus (`0` exact rows unchanged, `35` changed, `5` absent).
- Submission deadline: 2026-12-01 23:59 UTC.

## Assumptions

- Mission 11 Route 2 and the software-only product remain locked.
- Apps and Miner submissions do not depend on winning the Evaluator track.
- Evaluator recovery receives one evidence-gated attempt, not repeated blind
  registrations.
- Existing unrelated worktree changes remain untouched.

## Open Questions

- Whether registration `243` must be deregistered to release its bond.
- Whether enough time and source-backed material remain for a genuinely broader
  adapter before the deadline.
- Submission-form or platform changes must be rechecked immediately before
  final submission.

## Prototype Reintegration Gate

No separate high-fidelity prototype blocks this plan. The judged runtime uses
the real Telegraph paid path and the real registered Provider. Simulator-backed
telemetry remains visibly labelled as the software-only demo vertical.

## Phase 1: Preserve evidence and recover resources

Status: **evidence preserved; runner stopped; registration `243` deregistered;
combined bond queued for withdrawal after unlock**.

### Goal

Close registrations `235` and `243` safely while preserving every validator
and transaction artifact.

### Work

- Preserve registration `243` request identity, 30 scores, elapsed time,
  decoded public qualification categories and terminal rejection.
- Read both bonds and withdrawal eligibility on-chain.
- After explicit user approval, deregister `243` only if required to release
  its bond.
- Withdraw released bonds only when unlocked and after explicit approval.
- Copy the remaining Codespace logs, then stop the rejected evaluator runner to
  avoid unnecessary usage.

### Real Integration Path

Use live Sepolia reads and the Telegraph node. Wallet writes require a separate
explicit approval.

### Mock/Simulation Policy

No simulated chain state is accepted as recovery proof.

### Checks

- Transaction receipts and indexed state agree.
- Final token allowance is zero.
- Released amount and unlock time are recorded.

### Stop Condition

Stop before any wallet transaction without explicit user authorization.

### Execution Checkpoint — 2026-11-25

- Sanitized qualification evidence and the exact executor scoring log are under
  `evidence/stage10-evaluator/`.
- The Codespace `latch-evaluator-runner-7vwg59q7xvq93pwpw` was stopped, not
  deleted.
- Live released balance remains `100000`, unlocking
  `2026-11-27T07:44:48Z`; wallet balance is `700000` and allowance is zero.
- A forked `deregisterEntity(243, 2)` succeeded and consolidated the released
  amount to `200000`, resetting the shared two-day unlock. A same-argument live
  `eth_call` also succeeds.
- Recommended recovery is to deregister `243` once explicitly approved, accept
  the approximately eight-hour delay to the first bond, then withdraw the full
  `200000` after the new unlock instead of splitting recovery across two dates.
- Explicit approval was received and the live deregistration succeeded in
  transaction
  `0xe2bf31df869d689341870eb94434f357c4607fefa1a4fb4c60d555f482769ea3`
  at block `12210502`, with two confirmations observed.
- The live Diamond now reports `200000` released and an exact shared unlock of
  `2026-11-27T15:48:12Z`. Wallet test-USDC remains `700000`; allowance is zero.
- The Telegraph node indexed registration `243` as `deregistered` /
  `deactivated` at `2026-11-25T15:55:15Z`, so the receipt and indexed state
  agree.
- Withdrawal remains a separate wallet action requiring explicit approval.

## Phase 2: Lock the two qualifying tracks

### Goal

Make Apps & Agents and Miner/Provider independently reproducible and
submission-ready.

### Work

- Refresh miner registration `6159`, Provider health and canonical telemetry.
- Preserve the existing paid Engine receipt; do not buy again for a screenshot.
- Verify the controller path from missing telemetry through purchase, Evidence
  Gate and final machine decision.
- Verify refusal behavior for stale, malformed, unsupported and integrity-failed
  telemetry.
- Produce a clean runbook and evidence index.

### Real Integration Path

Use Engine provider `7317701`, the live Render Provider and preserved Sepolia
escrow evidence.

### Mock/Simulation Policy

The cold-chain machine is an explicitly labelled simulator. Telegraph payment,
Provider registration, routing and receipts are real testnet integrations.

### Checks

- Relevant tests, typecheck and build pass.
- Provider is active, compatible and reachable.
- Paid receipt, cost, latency and controller decision are reproducible from
  evidence without repeating the purchase.

### Stop Condition

Do not claim a live sensor, physical safety guarantee or independent adoption.

### Execution Checkpoint — 2026-11-25

- `npm run verify:independent` passed TypeScript, 9 test files / 77 tests and
  all 7 deterministic fixtures.
- The live Miner registration `6159` is active with no rejection or retry.
- The public Provider health and fresh canonical telemetry probes passed; the
  public control room is healthy.
- Unknown sensors fail with HTTP `404` / `sensor_not_shareable`; unsupported
  metrics fail with HTTP `422` / `metric_not_supported`. Automated tests cover
  stale, malformed and integrity-failed telemetry.
- The pinned Engine route for provider `7317701` returned the expected unpaid
  HTTP `402` payment challenge. No new purchase was made.
- The existing paid evidence preserves the `10000` uUSDC cost, `42608` ms
  latency, escrow receipt and final `CONTINUE` decision.
- `docs/SUBMISSION_RUNBOOK.md`, `evidence/README.md` and
  `evidence/phase2-submission-lock.json` now provide the clean reviewer path
  and evidence index.
- The pre-registration `npm run validate:miner` guard predictably reports the
  already-registered `7317701` identity as a collision; live registration state
  is the correct post-registration check.

Status: **Phase 2 locked. Proceed to the gated Phase 3 time/material decision
without delaying Apps or Miner submission work.**

## Phase 3: One evaluator recovery attempt

Status: **NO-GO for this submission. Do not retrain or register again.**

### Goal

Decide with independent evidence whether a second adapter is worth registering.

### Work

- Build broader source-backed material covering USGS plausibility/liveness,
  NOAA units and QC, tolerance calculations above and below targets, signatures,
  integrity scope, timestamps, simple JSON, rich JSON and prose.
- Separate train, validation and final test by source/scenario/template.
- Keep the captured 15 public qualification pairs as a diagnostic regression
  set; do not copy them into training.
- Train multiple seeds and measure category-level stability.

### Real Integration Path

Use the official pinned ModernBERT/LoRA trainer, exporter, parser and executor.

### Mock/Simulation Policy

No fabricated telemetry or hidden-pair claims. Synthetic mutations are allowed
only when derived from disclosed source-backed records and labelled as training
examples.

### Checks

- Official dataset gates pass.
- Independent final test contains at least 40–60 unseen pairs.
- Overall independent accuracy is at least `80%`.
- Every major category is at least `70%`.
- Captured public diagnostic is at least `12/15`.
- Multiple seeds do not show a large performance collapse.
- Package identity, bit-exact local/public scores and 30-item deadline pass.

### Stop Condition

If any check fails, abandon the Evaluator track and do not register again.

### Go/No-Go Decision — 2026-11-25

The repository does not currently contain the evidence required to begin the
one allowed recovery attempt:

- the 64-pair corpus is generated from only eight templated scenarios;
- there is no source-separated train/validation/final-test dataset;
- there is no independent 40–60-pair final test;
- there are no category-level independent results or multi-seed stability
  measurements;
- the captured public diagnostic is `9/15`, below the required `12/15` gate;
- GPU retraining still requires a separate manual runtime, while Apps and Miner
  need final demo, independent test and submission work.

Because the preconditions fail before training, another adapter would be a
blind retry and would risk delaying the two qualifying tracks. Phase 3 is
therefore closed as a no-go for this submission. Preserve the corpus and
failure evidence for future work; do not re-register or upload more Evaluation
Pool rows.

## Phase 4: Independent test, demo and submissions

Status: **in progress; submission drafts and demo script prepared**.

### Goal

Submit the strongest truthful entries before the deadline.

### Work

- Complete one independent developer test.
- Record a focused 2–5 minute demo.
- Finalize architecture, setup, evidence and limitations documentation.
- Complete required public project updates and developer-activation evidence.
- Recheck current rules and submit Apps & Agents and Miner/Provider.
- Submit Evaluator only if Phase 3 clears every gate.

### Checks

- A clean user can follow the runbook.
- Demo proves Telegraph is essential to the decision loop.
- Every track has independent working evidence.
- Submission links, repository visibility and required forms are verified.

### Stop Condition

Do not delay the two working submissions for an evaluator that has not passed
the go/no-go gates.

### Execution Checkpoint — 2026-11-25

- Official rules were refreshed: deadline remains
  `2026-12-01T23:59:00Z`; final entries go through the H2 website.
- Required account prerequisite is satisfied: GitHub user `Alike001` has
  starred `telegraphprotocol/bounties`.
- Two public progress updates already exist on Mission 11 across November 21
  and 24. A truthful third update draft is ready but has not been posted.
- `docs/H2_SUBMISSION_DRAFTS.md` now contains separate Apps and Provider form
  copy, commercial answers, evidence, accurate limitations, a no-spend
  3.5-minute demo script and the final checklist.
- Still required: authorization to commit/push the public-safe docs and post the
  third update, one genuine independent test report, a published 2–5 minute
  demo, user contact/permission choices, and the two official form submissions.

## Verification Checkpoint

Before declaring completion, audit the delivered Apps and Miner entries against
the current hackathon rules, the locked mission statement, the runbook and the
preserved live evidence. Audit Evaluator separately if it qualifies.

## Handoff Notes

Phase 1 is the exact next action. No re-upload of the 40 Evaluation Pool rows,
no reuse of package v2, and no unrelated dirty-file cleanup are part of this
plan.
