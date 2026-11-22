# Stage 10 — Evaluator contribution

## Live classification

`SENSOR_TELEMETRY_VERIFY_GENERAL` is currently a **judgment** Intent under the
`SENSOR_TELEMETRY_VERIFY` family.

For this class Telegraph V2 expects:
- public question/preference material in the Evaluation Pool; and
- an Evaluator adapter registered on the family prefix if we submit a scoring module.

Do **not** build a deterministic comparator for this Intent.

## Network rules that matter

The V2 adapter is a LoRA safetensors delta on Telegraph's shared ModernBERT-base
Foundation Model.

A candidate adapter must:
- pass package/foundation/tokenizer checks;
- score enough public material successfully;
- reach at least the network's minimum hidden-pair win rate;
- beat an incumbent by the required replacement margin when one exists;
- meet per-child floors when registered on a family.

The live Evaluation Pool requires independent contributor diversity before judgment
material is used. Latch must not fake that requirement with multiple addresses controlled
by one builder.

## Latch Stage 10 contribution

This stage starts with public material because the weakness we reproduced is semantic
telemetry quality.

Corpus scope:
- exact sensor identity;
- exact metric identity;
- accepted unit;
- numeric value;
- calibration/plausibility range;
- observation timestamp presence;
- no future timestamp;
- freshness.

The corpus intentionally excludes unsupported claims about cryptographic integrity because
the current response shape does not expose integrity evidence.

## GO gates

Stage 10 material GO:
- corpus generator deterministic;
- 40 preference pairs;
- 40 distinct normalized questions across five machine domains;
- eight failure classes;
- local QA proves every chosen answer outranks its paired rejected answer;
- upload format matches Telegraph preference-pair schema;
- CI green.

Stage 10 live-material GO:
- live status checked first;
- signed upload accepted by the node;
- row admission states captured;
- no claim that the pool is active until contributor/material thresholds are actually met.

Stage 10 adapter GO:
- official kit data check passes;
- training clears its local evaluation gate;
- safetensors delta exported against the released foundation;
- adapterbuild Stage 1 parser passes;
- runnable executor is reproducible;
- registration/promotion evidence captured if we proceed on-chain.
