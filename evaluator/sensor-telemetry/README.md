# Latch telemetry evaluator — Stage 10

Family: **SENSOR_TELEMETRY_VERIFY**  
Intent used for public material: **SENSOR_TELEMETRY_VERIFY_GENERAL**  
Class: **judgment**

This directory is the public, reproducible evaluator contribution for Latch.

## Why this evaluator exists

Latch started after live Telegraph telemetry validation produced answers that could look
plausible while missing or breaking fields that a machine needs to act safely:
sensor identity, metric identity, unit, value and observation time.

The live canonical answer shape is:

```text
sensor
metric
value
unit
observed_at
```

The public corpus therefore teaches preference ordering around those fields rather than
generic writing quality.

## Corpus

`pairs.jsonl` contains **40 public preference pairs** across five operational domains
and eight failure classes. Every row has its own distinct normalized question so the
Telegraph node does not collapse multiple fault variants into duplicate cases:

- wrong sensor identity;
- wrong metric;
- wrong unit;
- non-numeric value;
- implausible/calibration-breaking value;
- stale timestamp;
- future timestamp;
- missing timestamp.

Each prompt supplies a distinct operational context plus the evaluation time, accepted unit,
plausible calibration range and freshness limit so the better/worse ordering is checkable
from the public row itself. Telegraph keeps only the first valid row for a normalized
question, so prompt uniqueness is a hard upload gate.

Build and verify:

```bash
npm run stage10:build-corpus
npm run stage10:check-corpus
npm test
```

The deterministic `referenceCorpusScore` is **corpus QA only**. It is not presented or
registered as a Telegraph scorer. Telegraph V2 judgment families require a trained
Evaluator adapter.

## Live network status

Before training or upload:

```bash
npm run stage10:status
```

This checks:
- the live Intent class;
- which scoring family currently serves the Intent;
- whether that scorer is routed;
- current Evaluation Pool contributor/material state.

Do not train a judgment adapter if the live class changes.

## Upload evaluation material

Review `pairs.jsonl` first. Uploading changes the live Evaluation Pool.

The uploader uses the same dedicated Telegraph wallet already used by Latch, but never
prints or exports its private key.

```bash
LATCH_EVALPOOL_UPLOAD=1 npm run stage10:upload-material
```

A judgment pool is only used after it has material from enough distinct contributors.
One Latch upload must not be misrepresented as independent ecosystem coverage.

## Train the official V2 adapter

Telegraph V2 expects a LoRA safetensors delta on its shared ModernBERT-base Foundation
Model. Older comparator, MiniLM rank_answer, Q32.32, and full-model WASM formats are not
accepted.

Use the official kit:

```bash
mkdir -p vendor
git clone https://github.com/telegraphprotocol/telegraph-wasm-baseline.git vendor/telegraph-wasm-baseline

cd vendor/telegraph-wasm-baseline
pip install -r requirements.txt

python -m float_runtime.train_adapter \
  --intent SENSOR_TELEMETRY_VERIFY \
  --data ../../evaluator/sensor-telemetry/pairs.jsonl \
  --check-data

python -m float_runtime.train_adapter \
  --intent SENSOR_TELEMETRY_VERIFY \
  --data ../../evaluator/sensor-telemetry/pairs.jsonl \
  --out runs/SENSOR_TELEMETRY_VERIFY
```

Training is a separate compute step; GPU is recommended by the official kit.

Then obtain the released Foundation metadata and export the adapter:

```bash
mkdir -p foundation
curl -fLo foundation/foundation.json \
  https://github.com/telegraphprotocol/telegraph-foundation/releases/download/modernbert-base-lora16-v1/foundation.json

python -m float_runtime.export_adapter \
  --run runs/SENSOR_TELEMETRY_VERIFY \
  --intent SENSOR_TELEMETRY_VERIFY \
  --class judgment \
  --foundation foundation/foundation.json
```

Validate/package with the node parser before hosting or registration.

## Integrity limitation discovered

The family description mentions cryptographic payload integrity, but the current canonical
answer shape exposes only sensor, metric, value, unit and observed_at. The public adapter
corpus does **not** claim it can cryptographically verify integrity evidence that is not
present in the answer.

That is a protocol/schema gap to document separately, not a reason to fabricate an
integrity score.


## Official dataset-gate hardening

The first official Telegraph `--check-data` run on the 40-pair training set failed two anti-shortcut rules:

- `largest single neg 2.5% > 2%`: even a perfectly unique 40-row set cannot satisfy a 2% maximum because one appearance is already 1/40 = 2.5%;
- `pick the shorter answer 66.2% > 65%`: answer length was slightly predictive of the preferred label.

The training corpus was therefore expanded to **64 pairs** and the answer mutations were length-balanced.

Local CI now enforces before the official Python gate:
- every normalized prompt is unique;
- every rejected answer is unique;
- largest single rejected-answer share <= 2%;
- neither shorter-answer nor longer-answer choice predicts the label above 65%.

The live Evaluation Pool upload is preserved unchanged; this hardening is for adapter training.
