import { writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildTelemetryPreferenceCorpus,
  datasetShortcutMetrics,
  referenceCorpusScore,
} from "./corpus.js";

const root = join(
  process.cwd(),
  "evaluator",
  "sensor-telemetry",
);

const cases = buildTelemetryPreferenceCorpus();

for (const item of cases) {
  const chosen = referenceCorpusScore(
    item.scenario,
    item.row.chosen,
  );
  const rejected = referenceCorpusScore(
    item.scenario,
    item.row.rejected,
  );

  if (chosen <= rejected) {
    throw new Error(
      `Invalid preference label for ${item.id}: chosen=${chosen}, rejected=${rejected}`,
    );
  }
}

const jsonl =
  cases.map((item) => JSON.stringify(item.row)).join("\n") + "\n";

const shortcuts = datasetShortcutMetrics(cases);

const coverage = {
  intent: "SENSOR_TELEMETRY_VERIFY_GENERAL",
  family: "SENSOR_TELEMETRY_VERIFY",
  class: "judgment",
  pair_count: cases.length,
  distinct_prompt_count: new Set(
    cases.map((item) =>
      item.row.prompt.normalize("NFC").replace(/\s+/g, " ").trim(),
    ),
  ).size,
  scenario_count: new Set(cases.map((item) => item.scenario.id)).size,
  shortcut_metrics: shortcuts,
  fault_counts: Object.fromEntries(
    [...new Set(cases.map((item) => item.fault))].map((fault) => [
      fault,
      cases.filter((item) => item.fault === fault).length,
    ]),
  ),
  cases: cases.map((item) => ({
    id: item.id,
    fault: item.fault,
    scenario: item.scenario.id,
    chosen_reference_score: referenceCorpusScore(
      item.scenario,
      item.row.chosen,
    ),
    rejected_reference_score: referenceCorpusScore(
      item.scenario,
      item.row.rejected,
    ),
  })),
};

writeFileSync(join(root, "pairs.jsonl"), jsonl);
writeFileSync(
  join(root, "coverage.json"),
  JSON.stringify(coverage, null, 2) + "\n",
);

console.log(
  JSON.stringify({
    event: "stage10_corpus_built",
    pairs: cases.length,
    shortcuts,
    output: join(root, "pairs.jsonl"),
  }),
);
