import fs from "node:fs";
import path from "node:path";
import {
  TelemetryReadingSchema,
  TelemetryRequestSchema
} from "../packages/core/src/telemetry.js";

const dir = path.resolve("fixtures/telemetry");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const value = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));

  if (file.startsWith("request-")) {
    TelemetryRequestSchema.parse(value);
  } else {
    TelemetryReadingSchema.parse(value);
  }

  console.log(`OK ${file}`);
}
