import { describe, expect, it } from "vitest";

import {
  TELEMETRY_FAULTS,
  TELEMETRY_SCENARIOS,
  buildTelemetryPreferenceCorpus,
  referenceCorpusScore,
} from "../corpus.js";

describe("Stage 10 telemetry evaluator corpus", () => {
  const corpus = buildTelemetryPreferenceCorpus();

  it("covers five operational domains and eight failure classes", () => {
    expect(TELEMETRY_SCENARIOS).toHaveLength(5);
    expect(TELEMETRY_FAULTS).toHaveLength(8);
    expect(corpus).toHaveLength(40);

    for (const fault of TELEMETRY_FAULTS) {
      expect(
        corpus.filter((item) => item.fault === fault),
      ).toHaveLength(5);
    }
  });

  it("uses one distinct normalized question per upload row", () => {
    const normalized = corpus.map((item) =>
      item.row.prompt.normalize("NFC").replace(/\s+/g, " ").trim(),
    );

    expect(new Set(normalized).size).toBe(corpus.length);
  });

  it("labels the structurally and semantically stronger answer as chosen", () => {
    for (const item of corpus) {
      const chosen = referenceCorpusScore(
        item.scenario,
        item.row.chosen,
      );
      const rejected = referenceCorpusScore(
        item.scenario,
        item.row.rejected,
      );

      expect(chosen).toBe(8);
      expect(rejected).toBeLessThan(chosen);
    }
  });

  it("uses the live SENSOR_TELEMETRY_VERIFY response fields", () => {
    for (const item of corpus) {
      const chosen = JSON.parse(item.row.chosen);

      expect(Object.keys(chosen).sort()).toEqual([
        "metric",
        "observed_at",
        "sensor",
        "unit",
        "value",
      ]);
    }
  });

  it("keeps upload rows in Telegraph preference-pair format", () => {
    for (const item of corpus) {
      expect(item.row.label_kind).toBe("preference_pair");
      expect(item.row.prompt.length).toBeGreaterThanOrEqual(16);
      expect(item.row.chosen).not.toBe(item.row.rejected);
      expect(item.row.provenance.source_kind).toBe("human");
      expect(item.row.provenance.source_url).toMatch(/^https:\/\//);
    }
  });
});
