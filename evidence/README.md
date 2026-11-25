# Evidence vault

Preserve authentic proof as the project develops. Do not recreate or fabricate
proof during submission week.

## Current index

| Evidence | What it proves |
| --- | --- |
| `phase2-submission-lock.json` | Apps and Miner verification checkpoint, live reachability and refusal behavior |
| `stage7-paid-recovery-summary.json` | Public-safe real paid recovery, failed-closed attempt, cost, latency, receipt, Evidence Gate and outcome |
| `stage10-evaluator/registration-243-validator-summary.json` | Sanitized 30-item public qualification result and 9/15 outcome |
| `stage10-evaluator/registration-243-adapterexec.txt` | Exact executor scoring log for registration 243 |
| `stage10-evaluator/registration-243-deregistration.json` | Sepolia receipt, indexed state, combined released bond and unlock timestamp |
| `stage11-ui/verification.md` | Instrument Panel verification, browser scenario matrix and desktop/mobile screenshot index |

The pre-existing untracked `stage7-live/` directory remains unmodified and is
not part of the public commit. Its relevant public-safe facts are preserved in
`stage7-paid-recovery-summary.json`.

Every meaningful test should preserve timestamp, network, Intent, Provider,
input, raw/normalized output, decision, cost, latency and request/signal or
transaction evidence where available.
