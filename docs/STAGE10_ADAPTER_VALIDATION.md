# Stage 10 — Evaluator adapter validation

Date: 2026-11-24

## Result

Latch trained and validated a specialist `SENSOR_TELEMETRY_VERIFY` judgment
adapter against Telegraph's shared ModernBERT foundation.

Official model gate:

- pairwise accuracy: **0.8889** on 9 held-out pairs;
- length baseline: **0.5556**;
- beats length baseline: **true**;
- negative memorisation: **0.0**;
- verdict: **PASS**.

The first default run used `grad_accum: 16` and `epochs: 3`. It received only
nine optimizer updates and failed at 0.3333 accuracy. The accepted run changed
only the update budget to `grad_accum: 8` and `epochs: 6` (36 optimizer
updates). The corpus, split seed, learning rate, ModernBERT base, LoRA shape and
all official gates remained unchanged.

## Package

- ABI: `lora-v1`
- class: `judgment`
- rank: 8
- alpha: 32
- max tokens: 512
- tensors: 178
- package bytes: 6,776,916
- SHA-256: `e748b650d19e648fac0854228a40df1b951f8aab474737c0087f8c4bb34ee2ce`
- keccak256: `0x9118b154f8995279eb5ea3008388d6ec9ecb54f2493a402878698ce10e08867d`

Telegraph `adapterbuild` validation:

- Stage 1 parser: **PASS**
- foundation load: **PASS**
- repeated deterministic score: **PASS**
- score bits: `0x3e570bd9`
- repeated score count: 2

The local validated archive is
`SENSOR_TELEMETRY_VERIFY-validated.zip`, SHA-256
`6b08b4029c30414243c89cc50a2a5e82242f34b906deb98f36ca1dd31d8d89d7`.
The binary archive is not committed to the repository; its public-safe result
and manifest are preserved under `evaluator/sensor-telemetry/history/`.

## Compatibility findings

The released Telegraph tokenizer and the tokenizer emitted by current Hugging
Face tooling have different byte serializations. Export correctly refused the
non-canonical hash. Latch compared the released tokenizer against all 128
rendered chosen/rejected training texts and found **zero token-ID mismatches**,
then packaged the exact released node tokenizer while preserving both original
hashes and the compatibility record.

Evaluator-kit commit `1ed063e` also exposed two upstream tooling gaps:

1. after a successful training PASS, `train_adapter.py` raises
   `NameError: pkg is not defined` while printing its suggested next command;
   the result and adapter have already been written;
2. the offline adapterbuild catalog omits the live
   `SENSOR_TELEMETRY_VERIFY` judgment family. Latch validated with the unchanged
   node parser plus a temporary one-line classification synchronization matching
   the live devnode.

Neither workaround changes adapter tensors or weakens a validation gate.

## Live network checkpoint

`npm run stage10:status` at `2026-11-24T15:40:26.468Z` showed:

- Latch material is in the active snapshot;
- submitters: 3;
- eligible submitters: 3;
- minimum submitters: 3;
- active snapshot rows: 354;
- activation epoch: 40;
- current epoch: 50;
- scorer remains `GENERIC` with `generic_fallback: true`.

The contributor-diversity threshold is now actually active. The specialist
scorer gap remains real.

## Registration boundary

Do not claim canonical promotion or register blindly. Before an on-chain action:

1. inspect the current live adapter competition/registration route;
2. confirm hosting requirements for the immutable safetensors package;
3. preserve the exact package hash and public URL;
4. confirm wallet, fee and transaction details with the user;
5. submit to hidden evaluation and report the actual result without claiming
   promotion in advance.
