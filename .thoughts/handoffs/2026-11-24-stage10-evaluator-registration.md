# Handoff: Latch Stage 10 Evaluator Registration

## Objective

Put the validated `SENSOR_TELEMETRY_VERIFY` adapter through Telegraph's live
registration checks and hidden competition without changing Mission 11 Route 2
or re-uploading the 40 Evaluation Pool rows.

## Current State

- Apps & Agents path is complete: a real paid Telegraph recovery changed the
  controller decision from HOLD/REBUY to CONTINUE and preserved a receipt.
- Miner/Provider path is complete: registered miner `7317701`
  (`latch-telemetry`) is live, healthy, and currently reported compatible for
  `SENSOR_TELEMETRY_VERIFY_GENERAL`.
- Evaluator data path is complete: Latch's 40 rows are in the active eligible
  snapshot; the network has 3 eligible submitters and the live minimum is 3.
- Evaluator model path is trained and runtime-validated, but is **not
  registered or canonical**.
- Live scorer still resolves through `GENERIC` with `generic_fallback: true`.
- Local branch `main` contains commit `f11a2e0` and is ahead of `origin/main`.

## Key Decisions

- Use the official `adapterexec`; do not reproduce scoring with another ONNX
  runtime because confirmation requires bit-identical scores.
- Use a free temporary registration runner on the laptop through the existing
  ngrok account instead of billing-enabled cloud infrastructure.
- Host the 6.8 MB safetensors package at an immutable, commit-pinned public URL;
  do not serve the package only from the laptop.
- The laptop must remain awake and online until the registration becomes
  `active` or `rejected`. Once active, validators score from their locally
  loaded foundation/package; the runner is not part of normal scoring. Keep the
  immutable package URL available, and do not assume future revalidation can
  never occur.
- Do not register before the public runner passes a real batch preflight.

## Artifacts

- Validated archive:
  `/home/ali/Downloads/SENSOR_TELEMETRY_VERIFY-validated.zip`
- Archive SHA-256:
  `6b08b4029c30414243c89cc50a2a5e82242f34b906deb98f36ca1dd31d8d89d7`
- Extracted package:
  `/home/ali/.local/share/latch-evaluator/package/SENSOR_TELEMETRY_VERIFY.safetensors`
- Package SHA-256:
  `e748b650d19e648fac0854228a40df1b951f8aab474737c0087f8c4bb34ee2ce`
- Package keccak256:
  `0x9118b154f8995279eb5ea3008388d6ec9ecb54f2493a402878698ce10e08867d`
- Telegraph foundation release:
  `modernbert-base-lora16-v1`
- Detailed validation record: `docs/STAGE10_ADAPTER_VALIDATION.md`

## Files Changed

- `docs/HANDOFF.md`
- `.thoughts/handoffs/2026-11-24-stage10-evaluator-registration.md`

## Commands And Results

- Training gate: PASS, pairwise accuracy `0.8889`, length baseline `0.5556`.
- `adapterbuild`: Stage 1 PASS, foundation loaded, repeated score bits
  `0x3e570bd9`.
- `npm run stage10:status`: active snapshot has 3 eligible submitters; scorer
  remains generic fallback.
- Provider health check: OK.
- Live intent miner lookup: miner `7317701` is present and compatible.
- Live Diamond `entityBonds()` on 2026-11-24 returned adapter bond
  `100000` test-USDC base units (`$0.10`). `machinaToken()` returned the zero
  address. Re-read immediately before registration because current docs still
  contain a stale `$5` example.
- ngrok test succeeded at the account's stable dev domain with a
  `Go-http-client/1.1` user agent; the browser interstitial did not replace the
  origin response for that validator-like client.

## Open Questions

- Choose the exact immutable public package location. Prefer a commit-pinned
  raw GitHub URL or another host that returns the exact bytes.
- Choose the author wallet and non-zero payout address. Never put a private key
  in the repository or chat.

## Risks Or Blockers

- Official foundation ONNX download is incomplete because GitHub was serving
  it at roughly 45-80 KB/s. Current resumable file:
  `/home/ali/.local/share/latch-evaluator/foundation/foundation_lora_fp32.onnx`
  (4,596,326 of 599,117,769 bytes). A second earlier partial is preserved as
  `foundation_lora_fp32.onnx.curl-partial`.
- The local runner needs about 1.8 GB RAM. Close unnecessary browser tabs before
  starting it; the machine has 7.1 GiB RAM and swap available.
- Local internet/power loss can make the runner unreachable. Telegraph retries
  temporary failures, but rejects after 3 failed evaluation attempts.
- Hidden evaluation is genuinely unknown. With no specialist champion, the
  candidate needs the first-canonical floor: at least 70% overall and the
  applicable 60% per-child floor.
- Existing unrelated worktree items must remain untouched:
  `evaluator/sensor-telemetry/coverage.json`, `evidence/stage7-live/`, and
  `package-lock.json`.

## Next Steps

1. Finish the official 599,117,769-byte foundation ONNX download and verify
   SHA-256 `0a49b325304bb4cf292e683929689d0457966be264f60bfc94d0072b614bf8e6`.
2. Download/verify `foundation_engine.wasm` SHA-256
   `77643d6e1176ab8744801cef93ccb844d0136ed32b8daa865d541f37d13292de`.
3. Build and start the pinned official `adapterexec` locally, then expose it at
   the stable ngrok HTTPS domain.
4. Run a local and public batch request and verify identity echoes and exact
   score bits.
5. Host the exact safetensors bytes at an immutable public URL, download them
   back, and re-check both SHA-256 and keccak256.
6. Re-read the live Diamond addresses, prefix, bond, wallet USDC balance,
   allowance, and Sepolia ETH balance. Run a free `cast call` dry run.
7. Present the final transaction arguments to the user and obtain explicit
   confirmation before `approve` or `registerWasm`.
8. Keep the laptop online, monitor the registration through remote check,
   Stage 1, confirmation, and hidden competition, then archive the ID, hashes,
   status, score, and transaction receipts.
9. If active, rerun `npm run stage10:status`, update project evidence, then move
   to Stage 11 independent developer testing and Stage 12 demo/submission proof.

## Resume Prompt

Continue Latch from `docs/HANDOFF.md` and `.thoughts/handoffs/2026-11-24-stage10-evaluator-registration.md`. Mission 11 Route 2 and the three-track strategy are locked. The Provider and paid recovery paths are complete; the telemetry adapter is trained and runtime-validated but not registered. Resume with the free local `adapterexec` + ngrok path by finishing and verifying the official foundation download. Do not re-upload the 40 rows, expose wallet secrets, register before public batch preflight, or touch the unrelated dirty worktree files.

## Registration Submitted Update

Registration `235` was submitted successfully on 2026-11-24 after local and
public batch preflights passed twice. Approval transaction:
`0x06480f016b5b266f8fb80857516758de4aa9b26e9360d545de4302ab910ed6fb`.
Registration transaction:
`0x69c0f7b7d7e94633addb88e74e1fd3b7089e2dad674ba15f9b363d05acdbfe0d`.
The exact `100000`-unit bond was pulled and allowance returned to zero.

At the last check, `/api/wasm` had not indexed registration `235`; there was no
validator request or rejection yet. The adapter executor, ngrok tunnel,
one-minute monitor, and sleep inhibitor are active as user services. Next epoch:
`2026-11-24T22:25:29Z`. Keep the laptop online and monitor until `active` or
`rejected`; do not submit another registration.
