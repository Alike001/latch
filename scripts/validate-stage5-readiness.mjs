import fs from "node:fs";
import YAML from "yaml";

const YAML_FILE = process.argv[2] ?? "miner/latch-telemetry.yaml";
const PROVIDER_ORIGIN = "https://latch-telemetry-provider.onrender.com";
const NODE = "https://devnode.telegraphprotocol.com";
const INTENT = "SENSOR_TELEMETRY_VERIFY_GENERAL";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function getJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); }
  catch { throw new Error("Expected JSON from " + url + ", got HTTP " + response.status + ": " + text.slice(0, 240)); }
  return { response, body };
}

function validateYamlShape(config) {
  const allowedTopLevel = new Set(["version","kind","id","slug","protocol","name","description","base_url","input_schema","output_schema","intent_mapping","polling","cache_ttl_sec","rate_limit_per_sec","circuit_threshold","circuit_cooldown_seconds","endpoints","semantics","auth","docs","limitations","errors","on_chain"]);
  for (const key of Object.keys(config)) assert(allowedTopLevel.has(key), "Unknown top-level YAML field: " + key);
  for (const key of ["version","kind","id","slug","name","base_url"]) assert(config[key] !== undefined, "Missing required YAML field: " + key);
  assert(config.version === "1", "version must be string 1");
  assert(config.kind === "miner", "kind must be miner");
  assert(config.protocol === "generic", "protocol must be generic");
  assert(Number.isInteger(config.id), "id must be an integer");
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.slug), "slug must be kebab-case");
  assert(config.base_url === PROVIDER_ORIGIN, "base_url must match deployed Provider");
  assert(Array.isArray(config.endpoints) && config.endpoints.length > 0, "At least one endpoint is required");
  const endpoint = config.endpoints.find((item) => item.path === "/telemetry");
  assert(endpoint, "Missing /telemetry endpoint");
  assert(endpoint.external_path === "/telemetry", "external_path must be /telemetry");
  assert(endpoint.method === "GET", "Telemetry endpoint must use GET");
  assert(typeof endpoint.description === "string" && endpoint.description.length > 0, "Endpoint requires description");
  assert(Array.isArray(endpoint.intents) && endpoint.intents.includes(INTENT), "Endpoint must declare canonical Intent");
  const requiredParams = endpoint.params?.query?.required;
  assert(Array.isArray(requiredParams), "Endpoint requires typed query params");
  for (const name of ["sensor","metric"]) {
    const param = requiredParams.find((p) => p.name === name);
    assert(param, "Missing required query param: " + name);
    assert(param.type === "string", name + " must be typed string");
    assert(Array.isArray(param.intents) && param.intents.includes("*"), name + " must apply to intents");
    assert(typeof param.description === "string" && param.description.length > 0, name + " requires description");
  }
  assert(Array.isArray(config.semantics?.supported_intents) && config.semantics.supported_intents.includes(INTENT), "supported_intents must include canonical Intent");
  const mapping = config.intent_mapping?.[INTENT];
  assert(mapping, "Missing intent_mapping");
  assert(mapping.endpoint === "/telemetry", "intent_mapping endpoint mismatch");
  assert(mapping.input?.sensor?.from === "sensor", "sensor input mapping mismatch");
  assert(mapping.input?.metric?.from === "metric", "metric input mapping mismatch");
  for (const field of ["sensor","metric","value","unit","observed_at"]) assert(mapping.output?.[field]?.path === field, "Output mapping mismatch for " + field);
  return { id: String(config.id), slug: config.slug };
}

async function validateLiveIntent() {
  const result = await getJson(NODE + "/engine/v1/intents/" + INTENT);
  const response = result.response; const body = result.body;
  assert(response.ok, "Live Intent endpoint returned HTTP " + response.status);
  assert(body.intent_name === INTENT, "Live Intent name changed");
  assert(body.class === "judgment", "Live Intent class changed");
  assert(body.request?.schema_version === 3, "Request schema version changed");
  assert(body.response?.format_version === 3, "Response format version changed");
  const params = (body.request?.params ?? []).map((p) => p.name).sort();
  assert(JSON.stringify(params) === JSON.stringify(["metric","sensor"]), "Live request params changed: " + JSON.stringify(params));
  const fields = (body.response?.fields ?? []).map((f) => f.name).sort();
  const expected = ["metric","observed_at","sensor","unit","value"].sort();
  assert(JSON.stringify(fields) === JSON.stringify(expected), "Live response fields changed: " + JSON.stringify(fields));
  return { class: body.class, miner_count: body.miner_count, request_schema_version: body.request.schema_version, response_format_version: body.response.format_version };
}

async function validateProvider() {
  const health = await getJson(PROVIDER_ORIGIN + "/health");
  assert(health.response.ok && health.body.ok === true, "Provider health failed");
  assert(health.body.intent === INTENT, "Provider health Intent mismatch");
  const query = new URLSearchParams({ sensor: "cold-zone-b-temp", metric: "temperature" });
  const telemetry = await getJson(PROVIDER_ORIGIN + "/telemetry?" + query.toString());
  assert(telemetry.response.ok, "Provider telemetry returned HTTP " + telemetry.response.status);
  const body = telemetry.body;
  assert(body.sensor === "cold-zone-b-temp", "Provider sensor mismatch");
  assert(body.metric === "temperature", "Provider metric mismatch");
  assert(typeof body.value === "number" && Number.isFinite(body.value), "Provider value invalid");
  assert(body.unit === "C", "Provider unit mismatch");
  assert(typeof body.observed_at === "string", "Provider observed_at missing");
  assert(body.integrity === "verified", "Provider integrity not verified");
  const ageSeconds = (Date.now() - new Date(body.observed_at).getTime()) / 1000;
  assert(ageSeconds >= -5 && ageSeconds <= 120, "Provider reading is not fresh: age=" + ageSeconds.toFixed(1) + "s");
  return { sensor: body.sensor, metric: body.metric, value: body.value, unit: body.unit, observed_at: body.observed_at, age_seconds: Number(ageSeconds.toFixed(1)) };
}

async function validateIdentity(id, slug) {
  const result = await getJson(NODE + "/api/miners");
  assert(result.response.ok, "Miner list returned HTTP " + result.response.status);
  const body = result.body;
  const miners = Array.isArray(body) ? body : (Array.isArray(body.miners) ? body.miners : []);
  const collisions = miners.filter((miner) => String(miner.id) === id || miner.slug === slug);
  assert(collisions.length === 0, "Miner identity collision: " + JSON.stringify(collisions.map((m) => ({ id: m.id, slug: m.slug }))));
  return { id, slug, free: true };
}

async function probeOfficialValidator(rawYaml) {
  try {
    const response = await fetch("https://integrate.telegraphprotocol.com/api/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ yaml: rawYaml }), signal: AbortSignal.timeout(20000), redirect: "follow" });
    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    if (!contentType.includes("application/json")) return { available: false, status: response.status, reason: "non_json_response", content_type: contentType };
    return { available: true, status: response.status, result: JSON.parse(text) };
  } catch (error) {
    return { available: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

const rawYaml = fs.readFileSync(YAML_FILE, "utf8");
const config = YAML.parse(rawYaml);
const identity = validateYamlShape(config);
const results = await Promise.all([validateLiveIntent(), validateProvider(), validateIdentity(identity.id, identity.slug), probeOfficialValidator(rawYaml)]);
console.log(JSON.stringify({ ready: true, yaml: { file: YAML_FILE, id: identity.id, slug: identity.slug, canonical_intent: INTENT }, live_intent: results[0], provider: results[1], miner_identity: results[2], official_http_validator: results[3], registration_gate: "Use the Anjoman Earn web validator before sending the on-chain transaction." }, null, 2));
