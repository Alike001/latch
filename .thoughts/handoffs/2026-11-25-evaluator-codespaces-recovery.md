# Handoff: Latch Evaluator Codespaces Recovery

## Objective

Recover safely from rejected evaluator registration `235`, move the official
Telegraph adapter executor to free GitHub Codespaces compute, benchmark the
validator-sized batch below the five-minute deadline, recover the existing
bond, and only then prepare a valid retry for
`SENSOR_TELEMETRY_VERIFY`.

## Current State

- Mission 11 Route 2 and the coherent three-track strategy remain locked.
- Apps & Agents paid recovery path is complete and publicly deployed.
- Provider miner `7317701` is complete and live.
- Evaluator package is trained and validated, but registration `235` is
  terminally `rejected`; there is still no canonical champion.
- The rejection was a runner deadline failure, not an evaluator-quality or
  package failure. Three validator batches reached the laptop and ran for
  almost exactly five minutes. The final one to three items were cancelled.
- Registry rejection reason: `gave up after 3 failed evaluation attempts:
  remote executor unreachable: remote executor: temporary failure (status
  503)`.
- The laptop services were stopped after rejection; no executor, tunnel,
  monitor, or sleep inhibitor is currently needed.
- Wallet test-USDC balance is `800000` base units (`0.8`) and allowance is
  zero. The `0.1` test-USDC bond was not automatically returned.
- The user has created a GitHub Codespace for `Alike001/latch`, visible at a
  `github.dev` URL with codespace name beginning
  `congenial-memory-69wj5g6vp4jq345jx`. Its machine type has not been checked.

## Key Decisions

- Do not pay for DigitalOcean or add a payment method.
- Prefer the personal GitHub Codespaces free allowance. GitHub Free includes
  120 core-hours/month; a four-core machine for four hours uses 16 core-hours.
- Target at least a four-core, 16 GB Codespace. Do not assume the default
  machine is sufficient.
- Benchmark the official executor on the Codespace before any wallet action.
  Require comfortable margin below five minutes, not a borderline pass.
- Do not re-register, mutate the package, or send deregistration until current
  duplicate-hash and bond-recovery behavior is verified from live/official
  sources.
- Do not re-upload the 40 Evaluation Pool rows.
- Never paste wallet keys or ngrok tokens into chat, files, terminal history,
  or the repository. Use GitHub Codespaces secrets when credentials are
  required.

## Artifacts

- Authoritative continuity: `docs/HANDOFF.md`
- Prior registration handoff:
  `.thoughts/handoffs/2026-11-24-stage10-evaluator-registration.md`
- Adapter validation: `docs/STAGE10_ADAPTER_VALIDATION.md`
- Immutable package commit: `df2e09ee00dac801725e1c95cc069855d5fdc436`
- Package URL:
  `https://raw.githubusercontent.com/Alike001/latch/df2e09ee00dac801725e1c95cc069855d5fdc436/artifacts/evaluator/SENSOR_TELEMETRY_VERIFY/SENSOR_TELEMETRY_VERIFY.safetensors`
- Package SHA-256:
  `e748b650d19e648fac0854228a40df1b951f8aab474737c0087f8c4bb34ee2ce`
- Package keccak256:
  `0x9118b154f8995279eb5ea3008388d6ec9ecb54f2493a402878698ce10e08867d`
- Foundation SHA-256:
  `0a49b325304bb4cf292e683929689d0457966be264f60bfc94d0072b614bf8e6`
- Engine SHA-256:
  `77643d6e1176ab8744801cef93ccb844d0136ed32b8daa865d541f37d13292de`
- Registration ID: `235`
- Approval transaction:
  `0x06480f016b5b266f8fb80857516758de4aa9b26e9360d545de4302ab910ed6fb`
- Registration transaction:
  `0x69c0f7b7d7e94633addb88e74e1fd3b7089e2dad674ba15f9b363d05acdbfe0d`

## Files Changed

- This handoff file.
- The terminal rejection is already recorded in `docs/HANDOFF.md` and the
  prior registration handoff at commit `05b7b4e`.

## Commands And Results

- Local and ngrok preflights passed twice with byte-identical score bits
  `0x3e570bd9`.
- Registration `235` was successfully created on-chain.
- Validator attempts arrived around `01:11`, `02:11`, and `03:11` local time.
- Each 30-item batch ran for approximately `4m59s`–`5m00s`; request context
  cancellation occurred at the final items.
- The node rejected after the third temporary 503.
- The failure therefore occurred while the laptop was awake and computing.

## Open Questions

- Which machine type does the new Codespace currently use, and can it be
  changed to four cores/16 GB or better within the free allowance?
- What is the exact official/live function and rule for deregistering rejected
  registration `235` and returning its bond?
- After deregistration, may the exact package hash be registered again, or must
  a new valid package hash be produced?
- What benchmark request best reproduces the 30-item, roughly 170–227 token
  validator workload before retrying?

## Risks Or Blockers

- Re-registering the same hash prematurely may revert as a duplicate or waste
  another bond.
- A Codespace can idle-stop; set its idle timeout to four hours and keep the
  session active during validation. Its maximum lifetime is 12 hours.
- The public executor must remain reachable across the seed epoch and remote
  validation window.
- Existing unrelated dirty worktree paths must remain untouched:
  `evaluator/sensor-telemetry/coverage.json`, `evidence/stage7-live/`, and
  `package-lock.json`.

## Next Steps

1. In the new chat, inspect the Codespace machine type; change it to at least
   four cores/16 GB if available under free usage.
2. Re-check official/live rejected-registration deregistration, bond recovery,
   and duplicate-hash behavior. Do not send a transaction yet.
3. Configure the Codespace without secrets in the repository, download and
   verify the official foundation/engine and immutable adapter, then build the
   pinned official `adapterexec`.
4. Run a realistic 30-item benchmark. Require a clear sub-five-minute margin,
   preferably under four minutes.
5. Only after the benchmark and recovery rules pass, present exact wallet
   actions for explicit user confirmation.

## Resume Prompt

Continue Latch from `AGENTS.md`, `docs/HANDOFF.md`, and `.thoughts/handoffs/2026-11-25-evaluator-codespaces-recovery.md`. Mission 11 Route 2 and the three-track strategy are locked. Registration `235` was rejected only because the awake laptop took about five minutes for the validator's 30-item batch; do not re-upload Evaluation Pool rows or re-register yet. The user has opened a free GitHub Codespace for `Alike001/latch`. First verify/change its machine type to at least four cores/16 GB, then investigate the official bond-recovery and duplicate-hash route, benchmark the pinned official adapter executor with a realistic 30-item workload, and preserve all wallet secrets. Do not touch the unrelated dirty worktree paths.

## Codespaces Recovery Checkpoint

Date: 2026-11-25

Codespace compute:

- codespace: `congenial-memory-69wj5g6vp4jq345jx`;
- original machine: `basicLinux32gb` (2 cores, 8 GB RAM, 32 GB storage);
- changed machine: `standardLinux32gb` (4 cores, 16 GB RAM, 32 GB storage);
- verified inside the VM: 4 CPUs and 15 GiB usable RAM;
- repository checkout was not modified; the pre-existing untracked
  `package-lock.json` was left untouched;
- executor assets live only under
  `/home/codespace/.local/share/latch-evaluator`.

Pinned runtime verification:

- official adapter kit commit:
  `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`;
- foundation SHA-256: verified;
- engine SHA-256: verified;
- adapter SHA-256: verified;
- executor loaded the expected foundation, adapter and tokenizer identities.

Validator-shaped benchmark:

- batch size: 30 items;
- token lengths used the exact observed validator profile, in order:
  `219, 219, 182, 176, 201, 199, 195, 191, 205, 200, 213, 218,
  201, 201, 198, 198, 177, 171, 180, 185, 214, 214, 227, 227, 195,
  175, 214, 214, 224, 224`;
- token content was synthetic public text, not reconstructed hidden material;
- run 1: **219.120 s**, 30/30 results, zero errors, identities matched;
- run 2: **214.875 s**, 30/30 results, zero errors, identities matched;
- run 2 score bits were byte-for-byte identical to run 1;
- worst observed margin below the five-minute deadline: **80.880 s**;
- both runs passed the preferred under-four-minute gate.

Official/live recovery findings:

- registration `235` is owned by evaluator address
  `0x95dc03c1f3937341aea4943fc5376085fdffbeba`;
- the older test wallet in the general handoff is not the registration owner;
- live `entityBonds()` still reports an adapter bond of `100000` test-USDC
  base units;
- the owner currently has `800000` test-USDC base units, allowance `0`, and
  `releasedMinerBond(owner) = (0, 0)` before deregistration;
- official docs specify `deregisterEntity(registrationId, 2)` for a scoring
  module, followed after the two-day unlock by `withdrawMinerBond()`;
- a read-only `eth_call` simulation of
  `deregisterEntity(uint256,uint8)(235, 2)` from the actual owner succeeded;
- official docs explicitly state that deregistration frees the package slot and
  permits the exact same binary/hash to be registered again under a fresh ID;
- registration `235` remains `rejected`; no deregistration, withdrawal,
  approval or re-registration transaction was sent.

Exact next gate:

**Obtain explicit user confirmation before sending
`deregisterEntity(uint256,uint8)(235, 2)` from the evaluator owner. After the
node indexes `deregistered`, verify the released bond amount and unlock time.
Do not re-register until the bond state is preserved and the Codespace executor
has also passed a public HTTPS preflight.**

## Bond Recovery Completed

Date: 2026-11-25

The evaluator owner credential was recovered from the user's existing local
wallet backup, verified in memory against
`0x95dc03c1f3937341aea4943fc5376085fdffbeba`, and confirmed to already have
owner-only file permissions (`0600`). The key was never printed, copied into
the repository, added to shell history, or sent to the Codespace.

After explicit user authorization, registration `235` was deregistered:

- function: `deregisterEntity(uint256,uint8)(235, 2)`;
- transaction:
  `0xbb8207ffb3fa94f9a41ee76580f91dd2baa9c29b6359efb9834cafe59563fc87`;
- block: `12208175`;
- receipt status: success;
- gas used: `377389`;
- confirmations waited: 2.

Live post-transaction state:

- released bond: `100000` test-USDC base units (`0.10` test USDC);
- unlock timestamp: `1795765488` = `2026-11-27T07:44:48Z`
  (`2026-11-27T08:44:48+01:00` Lagos);
- wallet test-USDC remains `800000` base units until withdrawal;
- node indexed registration `235` at `2026-11-25T07:55:15Z` as
  `activation_status: deregistered`, `stage: deactivated`;
- no approval, withdrawal, package mutation or re-registration was sent.

Post-recovery `npm run stage10:status` at `2026-11-25T07:55:45.115Z`:

- intent class: `judgment`;
- canonical: `null`;
- scorer: `GENERIC`, `generic_fallback: true`;
- eligible rows: `354`;
- eligible submitters: `3` of required `3`;
- active snapshot remains activation epoch `40`;
- current epoch: `53`.

Exact next gate:

**Run the verified Codespace executor through a public HTTPS Codespaces port,
repeat the 30-item benchmark over that public route, and prove the Codespace
will remain awake through the validation window. Only then re-read bond,
allowance, balance and live registration rules and request explicit approval
for a fresh registration using the now-freed exact package hash.**
