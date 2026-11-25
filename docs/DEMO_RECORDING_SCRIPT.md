# Latch demo recording script

Target length: **3 minutes 20 seconds**. Hard limit: **5 minutes**.

This is an authentic browser walkthrough, not a rendered product film. Use the
deployed application and preserved public evidence. Do not enable live payment
or repeat the historical Telegraph purchase.

## Recording setup

- Record at 1440 × 900 or 1920 × 1080.
- Use a clean browser profile with bookmarks and personal extensions hidden.
- Set browser zoom to 100%.
- Close wallets, private terminals, notifications and unrelated tabs.
- Open these tabs in advance:
  1. `https://latch-control-room.onrender.com/`
  2. `https://latch-control-room.onrender.com/control-room`
  3. `https://github.com/Alike001/latch/blob/main/evidence/stage7-paid-recovery-summary.json`
  4. `https://devnode.telegraphprotocol.com/api/miners/6159`
  5. `https://latch-telemetry-provider.onrender.com/health`
- Reset the public control-room session before recording.
- Never open local wallet files, environment variables or unredacted Stage 7
  evidence.

## 0:00–0:25 — Problem, product and boundary

### Screen

Show the landing-page hero and the verified recovery instrument.

### Narration

> Autonomous machines sometimes cross sites, vendors or operators where a
> required operational signal is unavailable. Latch lets the controller buy
> that missing telemetry through Telegraph, but payment alone never authorizes
> action. The result must pass a deterministic Evidence Gate first. This is
> operational task-continuation intelligence—not emergency stop, collision
> avoidance or certified machine safety.

## 0:25–1:15 — Successful autonomous recovery

### Screen

1. Open the control room.
2. Point briefly to the five-stage rail.
3. Choose **Disconnect telemetry**.
4. Show the rail changing to **Fault detected** and the machine task pausing.
5. Choose **Run safe recovery**.
6. Follow the rail to `CONTINUE` and show the Evidence Gate checks.

### Narration

> The cold-chain cart begins with fresh local telemetry and bounded spending
> authority. I will disconnect the required temperature signal. Latch detects
> the gap and pauses the task. The safe reviewer recovery now exercises the
> actual controller policy: detect, authorize, acquire from the independent
> remote source, verify every field, and decide. The local decision is REBUY;
> recovered evidence passes the Gate; and the task returns to CONTINUE.
>
> This reviewer run is an explicitly labelled simulation. It spends zero and
> does not invent a Telegraph receipt.

## 1:15–1:55 — Preserved real Telegraph proof

### Screen

1. Expand **Inspect preserved live proof**.
2. Show Sepolia, `$0.01 test USDC`, `CONTINUE`, and the receipt hash.
3. Switch to `stage7-paid-recovery-summary.json`.
4. Point to Engine provider `7317701`, `10000` uUSDC, `42608` ms, signal ID,
   receipt, Gate result and final decision.

### Narration

> The real paid run is preserved separately so reviewers do not need to spend
> funds. On Sepolia, the same controller pinned Telegraph Engine provider
> 7317701, paid 10,000 micro-USDC—one cent—received the canonical signal in
> 42.608 seconds, preserved the escrow receipt, passed the Evidence Gate and
> returned CONTINUE. This is real testnet integration evidence, not a receipt
> from the simulation I just ran.

## 1:55–2:30 — Fail closed

### Screen

1. Return to the control room and choose **Reset session**.
2. Choose **Disconnect telemetry**.
3. Choose **Revoke spend**.
4. Choose **Run safe recovery**.
5. Show **Spend revoked**, **Not attempted**, and final `HOLD` on the rail.

### Narration

> Latch also makes refusal behavior visible. I will disconnect the signal again
> and revoke spending authority. Recovery is now blocked before acquisition:
> no purchase is attempted, session spend remains zero, and the machine ends at
> HOLD. Provider outages are also bounded to two attempts before HOLD.

## 2:30–3:00 — Provider contribution

### Screen

1. Show Miner registration `6159` and its active status.
2. Show the Provider `/health` response.
3. If useful, show the public Provider example and the documented refusal
   behavior in `docs/SUBMISSION_RUNBOOK.md`.

### Narration

> The supply side is a separate qualifying contribution. Miner registration
> 6159 is active, and Engine provider 7317701 serves the canonical
> SENSOR_TELEMETRY_VERIFY intent. It returns complete sensor, metric, value,
> unit and time fields, and refuses unknown sensors, unsupported metrics, stale
> data and failed integrity instead of guessing. The Apps entry consumed this
> Provider through Telegraph; we disclose that as same-project integration,
> not independent adoption.

## 3:00–3:20 — Reproducibility and close

### Screen

Return to the landing-page proof band or briefly show the repository runbook.

### Narration

> Latch currently passes TypeScript validation, 77 tests and seven deterministic
> fixtures. The public repository includes the reviewer runbook, independent
> test guide and preserved evidence. The machine and sensor are simulated, the
> payment is testnet, and no production customer claim is made. Latch proves one
> principle: machines should buy missing intelligence—but trust the evidence
> before they move.

## Final review before upload

- Duration is between 2 and 5 minutes.
- Every spoken identifier matches the screen.
- Simulation and Sepolia testnet proof are explicitly distinguished.
- No private keys, wallet paths, environment variables or protected evaluator
  material appear.
- The recording shows both `CONTINUE` and `HOLD`.
- Audio is intelligible at normal volume and the UI text remains readable at
  1080p.
- The uploaded video is accessible without requesting permission.

