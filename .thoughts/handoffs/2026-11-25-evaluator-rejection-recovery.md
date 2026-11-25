# Handoff: Latch after evaluator registration 243 rejection

## Objective

Finish Latch for Telegraph Season II Mission 11 Route 2 while protecting the
working Apps and Miner tracks and allowing at most one evidence-gated Evaluator
recovery attempt.

## Current State

- Apps paid autonomous recovery is complete and preserved.
- Miner registration `6159` / Engine provider `7317701` is `active`, compatible
  and healthy. The direct Provider and pinned Engine payment challenge work.
- Evaluator `243` is terminally rejected: its public batch completed in
  `3m49.935s`, but it ordered `9/15` pairs correctly (`60%`, floor `70%`).
- Runtime, public transport, hash, identity echo, order and deadline all passed.
- The adapter failed semantic generalization and did not reach package download
  or hidden competition.
- The 4-core/16-GB Codespace is stopped, not deleted. Its validator evidence was
  archived before shutdown.

## Key Decisions

- Do not re-register package v2.
- Do not re-upload the 40 Evaluation Pool rows.
- Treat the local `8/9` result as a same-distribution gate, not network-quality
  proof.
- Apps and Miner submission readiness takes priority over Evaluator recovery.
- A new Evaluator may register only after all go/no-go gates in the completion
  plan pass.

## Artifacts

- Completion plan: `.thoughts/plans/2026-11-25-latch-completion.md`
- Authoritative continuity: `docs/HANDOFF.md`
- Sanitized validator evidence:
  `evidence/stage10-evaluator/registration-243-validator-summary.json`
- Exact executor scoring log:
  `evidence/stage10-evaluator/registration-243-adapterexec.txt`
- v2 artifact commit: `f03e75a1144f887f898bfd2fb8e9518b995410be`
- registration transaction:
  `0xd3af1fde4ed882b12a4182ccc47d04609d4eb4ae0b04d8f2b8d041ee50853931`
- registration ID: `243`
- package hash:
  `0xe5e1a494f59653f008348e61cc3513812b17fa5bf1dd10643bc222321b277bec`

## Files Changed

- This handoff.
- `.thoughts/plans/2026-11-25-latch-completion.md`.
- `docs/HANDOFF.md` receives the terminal result and plan pointer.

Unrelated dirty files remain untouched:
`evaluator/sensor-telemetry/coverage.json`, `evidence/stage7-live/`, and
`package-lock.json`.

## Commands And Results

- Live `/api/miners/6159`: active, no rejection, no retry.
- Direct Provider `/health` and `/telemetry`: HTTP 200 with fresh canonical
  telemetry.
- Pinned Engine `/engine/v1/ask/7317701`: HTTP 402 with the expected `$0.01`
  payment offers.
- Live evaluator `243`: rejected at `9/15`.
- Recovered public request: 30 tokenized texts, correct v2 identities, input root
  `d598fca0840da2c7c8ea9d7ef949daf099a7224a6073cfa5bd5c313b2321e402`.
- Live bond state: `100000` released from registration `235`, unlock
  `2026-11-27T07:44:48Z`; wallet `700000`, allowance zero.
- Fork test: `deregisterEntity(243, 2)` succeeds, changes the released amount to
  `200000`, and resets the shared unlock to two days after deregistration. The
  exact live `eth_call` also succeeds.
- After explicit approval, the live deregistration succeeded in transaction
  `0xe2bf31df869d689341870eb94434f357c4607fefa1a4fb4c60d555f482769ea3`
  at block `12210502`. Two confirmations were observed. The combined released
  amount is `200000`, unlocking at `2026-11-27T15:48:12Z`; wallet balance
  remains `700000` and Diamond allowance remains zero.
- The Telegraph node indexed registration `243` at
  `2026-11-25T15:55:15Z` as `deregistered` / `deactivated`, matching the chain
  receipt.

## Open Questions

- None for the current Evaluator submission: the recovery attempt is a no-go.

## Risks Or Blockers

- The 64-row corpus was narrow and templated; its nine-row validation split was
  not independent.
- None of the exact 40 uploaded rows remained unchanged in the final training
  corpus (`35` changed, `5` absent).
- The live qualification pool includes richer formats and semantics from other
  contributors.
- Deadline pressure makes blind retraining or repeated registration especially
  costly.

## Next Steps

1. Execute Phase 4 for the Apps and Miner submissions only.
2. Withdraw the full released amount after unlock, again only with explicit
   approval.

## Resume Prompt

Continue Latch from `AGENTS.md`, `docs/HANDOFF.md`,
`.thoughts/handoffs/2026-11-25-evaluator-rejection-recovery.md`, and
`.thoughts/plans/2026-11-25-latch-completion.md`. Registration 243 is rejected
for `9/15` public-pair accuracy after the runtime passed; do not re-register v2
or re-upload Evaluation Pool rows. Evidence is archived and the Codespace is
stopped. Registration `243` has been deregistered; the combined `200000` bond
unlocks at `2026-11-27T15:48:12Z`. Phase 2 is locked and Phase 3 is a no-go:
do not retrain, re-register or re-upload Evaluation Pool rows for this
submission. Continue with Phase 4 for Apps and Miner only. Withdrawal still
requires separate explicit approval. Do not touch unrelated dirty files or
expose secrets.
