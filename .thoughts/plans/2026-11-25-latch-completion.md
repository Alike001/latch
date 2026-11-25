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

## Phase 3: One evaluator recovery attempt

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

## Phase 4: Independent test, demo and submissions

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

## Verification Checkpoint

Before declaring completion, audit the delivered Apps and Miner entries against
the current hackathon rules, the locked mission statement, the runbook and the
preserved live evidence. Audit Evaluator separately if it qualifies.

## Handoff Notes

Phase 1 is the exact next action. No re-upload of the 40 Evaluation Pool rows,
no reuse of package v2, and no unrelated dirty-file cleanup are part of this
plan.
