# Stage 10 GPU training

The local laptop has `nvidia-smi` installed but the NVIDIA driver is not usable, so Latch's first real evaluator training run should use the checked-in Colab notebook:

`notebooks/stage10-telegraph-evaluator-training.ipynb`

## Required runtime

Use a Colab NVIDIA GPU runtime (T4 or better).

The notebook:
1. verifies CUDA;
2. clones the current Latch repo and Telegraph's official evaluator kit;
3. preserves Colab's CUDA-enabled PyTorch;
4. installs the remaining official evaluator dependencies;
5. reruns the official 64-pair dataset gate;
6. trains `SENSOR_TELEMETRY_VERIFY` with the pinned `train-config.json`;
7. requires the official model evaluation gate to pass;
8. archives the training output as a ZIP for export/packaging.

It performs **no Telegraph Evaluation Pool upload and no on-chain registration**.

## Source of truth

Training data:
`evaluator/sensor-telemetry/pairs.jsonl`

Pinned hyperparameters:
`evaluator/sensor-telemetry/train-config.json`

The immutable 40-row Evaluation Pool upload remains archived separately under:
`evaluator/sensor-telemetry/history/`

Do not use `--skip-dataset-gate`.
