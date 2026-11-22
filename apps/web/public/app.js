const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];
let current = null;

function esc(value) {
  return String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function dollars(uusdc) {
  return "$" + (Number(uusdc || 0) / 1_000_000).toFixed(2);
}

function time(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"});
}

function tone(action) {
  if (["CONTINUE", "RUNNING", "healthy", "AUTHORIZED"].includes(action)) return "good";
  if (["REBUY", "WAITING_FOR_TELEMETRY", "stale", "wrong_unit"].includes(action)) return "warn";
  if (["HOLD", "ESCALATE", "ESCALATED", "unavailable", "integrity_failed", "REVOKED"].includes(action)) return "bad";
  return "";
}

async function api(path, options) {
  const response = await fetch(path, {
    headers: {"Content-Type": "application/json"},
    ...options,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || body.error || "Request failed");
  return body;
}

function toast(message) {
  const el = qs("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => el.classList.remove("show"), 4200);
}

function renderMetrics(state) {
  const session = state.spend.session;
  const attemptKey = "cold-zone-b-temp::temperature";
  const attempts = session.attemptsByCapability[attemptKey] || 0;
  const items = [
    ["Machine state", state.task.state, state.task.machineId],
    ["Telemetry", state.telemetry.status, state.telemetry.snapshot.reading ? state.telemetry.snapshot.reading.value + " " + state.telemetry.snapshot.reading.unit : "No reading"],
    ["Spend authority", session.authorized ? "AUTHORIZED" : "REVOKED", "Max " + dollars(state.spend.policy.maxPerPurchaseUusdc) + " / purchase"],
    ["Session", dollars(session.spentUusdc), attempts + " / " + state.spend.policy.maxAttemptsPerCapability + " attempts"],
  ];
  qs("#metrics").innerHTML = items.map(([label, value, sub]) => `
    <div class="metric">
      <div class="metric-label">${esc(label)}</div>
      <div class="metric-value">${esc(value)}</div>
      <div class="metric-sub">${esc(sub)}</div>
    </div>
  `).join("");
}

function renderTelemetry(state) {
  const s = state.telemetry.snapshot;
  const r = s.reading;
  qs("#telemetry-detail").innerHTML = [
    ["Source", r?.source || s.source],
    ["Value", r ? r.value + " " + r.unit : "Unavailable"],
    ["Observed", r ? time(r.observedAt) : "—"],
    ["Integrity", state.telemetry.integrityVerified === null ? "No reading" : state.telemetry.integrityVerified ? "Verified" : "Failed"],
  ].map(([label, value]) => `<div class="datum"><label>${esc(label)}</label><strong>${esc(value)}</strong></div>`).join("");
}

function renderChecks(state) {
  const result = state.latestRecovery?.result;
  const decision = result?.finalDecision;
  const pill = qs("#decision-pill");
  if (!decision) {
    pill.textContent = "NO RUN";
    pill.className = "decision-pill neutral";
    qs("#checks").className = "checks empty-state";
    qs("#checks").textContent = "Run recovery to inspect evidence checks.";
    return;
  }
  pill.textContent = decision.action;
  pill.className = "decision-pill " + tone(decision.action);
  qs("#checks").className = "checks";
  qs("#checks").innerHTML = decision.checks.map((c) => `
    <div class="check">
      <span>${esc(c.key.replaceAll("_", " "))}</span>
      <strong class="${c.ok ? "ok" : "no"}">${c.ok ? "PASS" : esc(c.reason || "FAIL")}</strong>
    </div>
  `).join("");
}

function renderPurchase(state) {
  const recovery = state.latestRecovery;
  const purchase = recovery?.result.purchases?.at(-1);
  const el = qs("#purchase");
  if (!purchase) {
    el.className = "purchase empty-state";
    el.textContent = recovery?.mode === "simulation" && recovery.result.acquisitionAttempted
      ? "Simulation recovery completed without inventing a Telegraph receipt. No real payment evidence exists for this run."
      : "No purchase in this control-room session.";
  } else {
    const receiptHash = purchase.paymentReceipt?.receipt_hash || "—";
    el.className = "purchase";
    el.innerHTML = [
      ["Provider", purchase.providerId || "—"],
      ["Price", dollars(purchase.priceUusdc)],
      ["Latency", purchase.latencyMs + " ms"],
      ["Rail", purchase.paymentRail || "—"],
      ["Signal", purchase.signalId || "—"],
      ["Receipt", receiptHash],
    ].map(([label, value]) => `<div class="purchase-item"><label>${esc(label)}</label><code>${esc(value)}</code></div>`).join("");
  }
  qs("#historical-receipt").textContent = state.historicalLiveProof.receiptHash;
}

function renderSpend(state) {
  const p = state.spend.policy;
  const s = state.spend.session;
  const status = s.authorized ? "AUTHORIZED" : "REVOKED";
  const pill = qs("#spend-state");
  pill.textContent = status;
  pill.className = "state-pill " + tone(status);
  qs("#spend-detail").innerHTML = [
    ["Per purchase", dollars(p.maxPerPurchaseUusdc)],
    ["Max attempts / capability", p.maxAttemptsPerCapability],
    ["Session cap", dollars(p.maxSessionSpendUusdc)],
    ["Spent / reserved", dollars(s.spentUusdc) + " / " + dollars(s.reservedUusdc)],
  ].map(([label, value]) => `<div class="policy-row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("");
}

function renderEvents(state) {
  qs("#events").innerHTML = state.events.slice(0, 14).map((e) => `
    <div class="event">
      <strong>${esc(e.kind.toUpperCase())} · ${esc(time(e.at))}</strong>
      <span>${esc(e.message)}</span>
    </div>
  `).join("");
}

function render(state) {
  current = state;
  const mode = qs("#mode-badge");
  mode.textContent = state.product.liveTelegraphEnabled ? "LIVE TELEGRAPH ENABLED" : "SAFE SIMULATION";
  mode.className = "tag tag-mode " + (state.product.liveTelegraphEnabled ? "live" : "sim");
  qs("#recover-live").disabled = !state.product.liveTelegraphEnabled;

  qs("#task-name").textContent = state.task.name;
  qs("#machine-id").textContent = state.task.machineId;
  qs("#task-state").textContent = state.task.state;
  qs("#task-state").className = "state-pill " + tone(state.task.state);
  qs("#telemetry-state").textContent = state.telemetry.status;
  qs("#telemetry-state").className = "state-pill " + tone(state.telemetry.status);

  renderMetrics(state);
  renderTelemetry(state);
  renderChecks(state);
  renderPurchase(state);
  renderSpend(state);
  renderEvents(state);
}

async function refresh() {
  try { render(await api("/api/state")); } catch (e) { toast(e.message); }
}

async function mutate(path, body) {
  try {
    render(await api(path, {method: "POST", body: JSON.stringify(body || {})}));
  } catch (e) {
    toast(e.message);
  }
}

qs("#recover-sim").addEventListener("click", () => mutate("/api/recover", {mode: "simulation"}));
qs("#recover-live").addEventListener("click", () => {
  if (!current?.product.liveTelegraphEnabled) return;
  const ok = confirm("This can spend up to $0.01 test USDC per attempt from the dedicated Telegraph escrow. Continue?");
  if (ok) mutate("/api/recover", {mode: "live"});
});
qs("#authorize").addEventListener("click", () => mutate("/api/spend", {authorized: true}));
qs("#revoke").addEventListener("click", () => mutate("/api/spend", {authorized: false}));
qs("#reset").addEventListener("click", () => mutate("/api/reset", {}));
qsa("[data-fault]").forEach((button) => button.addEventListener("click", () => mutate("/api/fault", {fault: button.dataset.fault})));

refresh();
setInterval(refresh, 3000);
