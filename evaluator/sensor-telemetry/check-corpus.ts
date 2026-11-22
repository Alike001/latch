import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  TELEMETRY_FAULTS,
  buildTelemetryPreferenceCorpus,
  datasetShortcutMetrics,
  referenceCorpusScore,
} from "./corpus.js";

const path = join(
  process.cwd(),
  "evaluator",
  "sensor-telemetry",
  "pairs.jsonl",
);

const rows = readFileSync(path, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      throw new Error(`pairs.jsonl row ${index + 1} is not valid JSON`);
    }
  });

const generated = buildTelemetryPreferenceCorpus();

if (rows.length !== generated.length) {
  throw new Error(
    `Corpus row count mismatch: file=${rows.length}, generated=${generated.length}`,
  );
}

function normalizePrompt(prompt: string): string {
  return prompt.normalize("NFC").replace(/\s+/g, " ").trim();
}

const prompts = new Set<string>();

for (const [index, item] of generated.entries()) {
  const row = rows[index];

  if (row.prompt !== item.row.prompt) {
    throw new Error(`Corpus drift at row ${index + 1}: prompt changed`);
  }

  if (row.chosen !== item.row.chosen || row.rejected !== item.row.rejected) {
    throw new Error(`Corpus drift at row ${index + 1}: answer changed`);
  }

  if (
    typeof row.prompt !== "string" ||
    row.prompt.length < 16 ||
    row.prompt.length > 16_000
  ) {
    throw new Error(`Invalid prompt length at row ${index + 1}`);
  }

  if (
    typeof row.chosen !== "string" ||
    row.chosen.length < 8 ||
    row.chosen.length > 32_000 ||
    typeof row.rejected !== "string" ||
    row.rejected.length < 8 ||
    row.rejected.length > 32_000
  ) {
    throw new Error(`Invalid answer length at row ${index + 1}`);
  }

  if (row.chosen === row.rejected) {
    throw new Error(`Identical answers at row ${index + 1}`);
  }

  const chosenScore = referenceCorpusScore(
    item.scenario,
    row.chosen,
  );
  const rejectedScore = referenceCorpusScore(
    item.scenario,
    row.rejected,
  );

  if (chosenScore <= rejectedScore) {
    throw new Error(
      `Preference inversion at row ${index + 1}: chosen=${chosenScore}, rejected=${rejectedScore}`,
    );
  }

  const normalized = normalizePrompt(row.prompt);

  if (prompts.has(normalized)) {
    throw new Error(
      `Duplicate normalized prompt at row ${index + 1}`,
    );
  }

  prompts.add(normalized);
}

if (prompts.size !== generated.length) {
  throw new Error(
    `Every row must have a distinct prompt: rows=${generated.length}, prompts=${prompts.size}`,
  );
}

for (const fault of TELEMETRY_FAULTS) {
  const count = generated.filter((item) => item.fault === fault).length;

  if (count < 8) {
    throw new Error(
      `Insufficient coverage for ${fault}: expected >=8, got ${count}`,
    );
  }
}

const shortcuts = datasetShortcutMetrics(generated);

if (shortcuts.uniqueRejectedCount !== generated.length) {
  throw new Error(
    `Rejected answers must be unique: unique=${shortcuts.uniqueRejectedCount}, rows=${generated.length}`,
  );
}

if (shortcuts.largestSingleRejectedShare > 0.02) {
  throw new Error(
    `Largest single rejected answer share ${(shortcuts.largestSingleRejectedShare * 100).toFixed(2)}% exceeds Telegraph's 2% dataset gate`,
  );
}

if (
  Math.max(
    shortcuts.pickShorterAccuracy,
    shortcuts.pickLongerAccuracy,
  ) > 0.65
) {
  throw new Error(
    `Answer length is too predictive: shorter=${(shortcuts.pickShorterAccuracy * 100).toFixed(1)}%, longer=${(shortcuts.pickLongerAccuracy * 100).toFixed(1)}%`,
  );
}

console.log(
  JSON.stringify({
    event: "stage10_corpus_valid",
    rows: rows.length,
    distinct_prompts: prompts.size,
    faults: TELEMETRY_FAULTS.length,
    shortcuts,
  }),
);
