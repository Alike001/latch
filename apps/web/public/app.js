const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];
let current = null;
let busy = false;

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
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function tone(value) {
  if (["CONTINUE", "RUNNING", "healthy", "AUTHORIZED"].includes(value)) return "good";
  if (["REBUY", "WAITING_FOR_TELEMETRY", "stale", "wrong_unit"].includes(value)) return "warn";
  if (["HOLD", "ESCALATE", "ESCALATED", "unavailable", "integrity_failed", "REVOKED"].includes(value)) return "bad";
  return "";
}

async function api(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || body.error || "Request failed");
  return body;
}

function toast(message) {
  const element = qs("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(window.__latchToast);
  window.__latchToast = setTimeout(() => element.classList.remove("show"), 4200);
}

function setBusy(value) {
  busy = value;
  document.body.setAttribute("aria-busy", String(value));
  qsa("button").forEach((button) => { button.disabled = value; });
  if (!value && current) {
    qs("#recover-live").disabled = !current.product.liveTelegraphEnabled;
  }
}

function renderMetrics(state) {
  const session = state.spend.session;
  const attemptKey = "cold-zone-b-temp::temperature";
  const attempts = session.attemptsByCapability[attemptKey] || 0;
  const items = [
    ["MACHINE STATE", state.task.state, state.task.machineId],
    ["LOCAL SIGNAL", state.telemetry.status, state.telemetry.snapshot.reading ? `${state.telemetry.snapshot.reading.value} ${state.telemetry.snapshot.reading.unit}` : "No reading"],
    ["SPEND AUTHORITY", session.authorized ? "AUTHORIZED" : "REVOKED", `Max ${dollars(state.spend.policy.maxPerPurchaseUusdc)} / purchase`],
    ["SESSION EXPOSURE", dollars(session.spentUusdc), `${attempts} / ${state.spend.policy.maxAttemptsPerCapability} attempts used`],
  ];

  qs("#metrics").innerHTML = items.map(([label, value, sub]) => `
    <div class="status-item">
      <span class="status-label">${esc(label)}</span>
      <strong class="status-value">${esc(value)}</strong>
      <small class="status-sub">${esc(sub)}</small>
    </div>
  `).join("");
}

function railStep(index, label, value, detail, stateClass) {
  return `<div class="rail-step ${esc(stateClass)}"><span>${index} / ${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`;
}

function renderRecoveryRail(state) {
  const recovery = state.latestRecovery;
  const result = recovery?.result;
  const decision = result?.finalDecision;
  const faulted = state.telemetry.fault !== "none" || !state.provider.available;
  const authorized = state.spend.session.authorized;
  let detect;
  let acquire;
  let verify;
  let decide;

  if (result) {
    detect = [result.localDecision.accepted ? "Local accepted" : "Gap confirmed", result.localDecision.action, result.localDecision.accepted ? "done" : "warn"];
    if (!result.acquisitionAttempted) {
      acquire = ["Not attempted", result.spendBlock?.reason || "Acquisition blocked", "bad"];
    } else if (result.purchases.length) {
      acquire = ["Telegraph paid", `${dollars(result.purchases.at(-1).priceUusdc)} · receipt preserved`, "done"];
    } else if (result.acquisitionErrors.length) {
      acquire = ["Provider failed", `${result.attemptsUsed} attempts · zero spend`, "bad"];
    } else {
      acquire = ["Remote simulated", "Policy exercised · zero real spend", "done"];
    }
    verify = [decision.accepted ? "Evidence passed" : "Evidence rejected", `${decision.checks.filter((check) => check.ok).length} / ${decision.checks.length} checks passed`, decision.accepted ? "done" : "bad"];
    decide = [decision.action, decision.reason || "Final machine decision", tone(decision.action) === "good" ? "done" : tone(decision.action)];
  } else {
    detect = faulted ? ["Fault detected", state.telemetry.status, "warn"] : ["Monitoring", "Local signal healthy", "done"];
    acquire = ["Standing by", faulted && authorized ? "Ready for bounded recovery" : "No acquisition requested", faulted && authorized ? "active" : ""];
    verify = ["Awaiting signal", "Gate has not run", ""];
    decide = [state.task.state === "RUNNING" ? "Task running" : "Task paused", state.task.state, tone(state.task.state) === "good" ? "done" : "warn"];
  }

  const authority = authorized
    ? [result ? "Authorized" : "Policy ready", `Max ${dollars(state.spend.policy.maxPerPurchaseUusdc)} · ${state.spend.policy.maxAttemptsPerCapability} attempts`, result || faulted ? "done" : ""]
    : ["Spend revoked", "Purchases are blocked", "bad"];

  qs("#recovery-rail").innerHTML = [
    railStep("01", "DETECT", ...detect),
    railStep("02", "AUTHORIZE", ...authority),
    railStep("03", "ACQUIRE", ...acquire),
    railStep("04", "VERIFY", ...verify),
    railStep("05", "DECIDE", ...decide),
  ].join("");

  qs("#sequence-summary").textContent = result
    ? recovery.mode === "live"
      ? `Live Telegraph recovery completed with final decision ${decision.action}.`
      : `Safe simulation completed with final decision ${decision.action}; no payment receipt was invented.`
    : faulted
      ? "Fault injected. Confirm authority, then run the recovery sequence."
      : "System ready. Introduce a failure to begin.";
}

function renderTelemetry(state) {
  const snapshot = state.telemetry.snapshot;
  const reading = snapshot.reading;
  const items = [
    ["Source", reading?.source || snapshot.source],
    ["Value", reading ? `${reading.value} ${reading.unit}` : "Unavailable"],
    ["Observed", reading ? time(reading.observedAt) : "—"],
    ["Integrity", state.telemetry.integrityVerified === null ? "No reading" : state.telemetry.integrityVerified ? "Verified" : "Failed"],
  ];
  qs("#telemetry-detail").innerHTML = items.map(([label, value]) => `<div class="readout"><label>${esc(label)}</label><strong>${esc(value)}</strong></div>`).join("");
}

function renderChecks(state) {
  const decision = state.latestRecovery?.result.finalDecision;
  const pill = qs("#decision-pill");
  if (!decision) {
    pill.textContent = "NO RUN";
    pill.className = "state-chip";
    qs("#checks").className = "gate-matrix empty-state";
    qs("#checks").textContent = "Run recovery to inspect evidence checks.";
    return;
  }
  pill.textContent = decision.action;
  pill.className = `state-chip ${tone(decision.action)}`;
  qs("#checks").className = "gate-matrix";
  qs("#checks").innerHTML = decision.checks.map((check) => `
    <div class="gate-check"><span>${esc(check.key.replaceAll("_", " "))}</span><strong class="${check.ok ? "ok" : "no"}">${check.ok ? "PASS" : esc(check.reason || "FAIL")}</strong></div>
  `).join("");
}

function renderPurchase(state) {
  const recovery = state.latestRecovery;
  const purchase = recovery?.result.purchases?.at(-1);
  const element = qs("#purchase");
  if (!purchase) {
    element.className = "purchase-grid empty-state";
    element.textContent = recovery?.mode === "simulation" && recovery.result.acquisitionAttempted
      ? "Safe simulation exercised acquisition policy and verification without inventing a Telegraph payment or receipt."
      : "No purchase in this control-room session.";
  } else {
    element.className = "purchase-grid";
    const fields = [
      ["Provider", purchase.providerId || "—"], ["Price", dollars(purchase.priceUusdc)], ["Latency", `${purchase.latencyMs} ms`],
      ["Rail", purchase.paymentRail || "—"], ["Signal", purchase.signalId || "—"], ["Receipt", purchase.paymentReceipt?.receipt_hash || "—"],
    ];
    element.innerHTML = fields.map(([label, value]) => `<div class="purchase-field"><label>${esc(label)}</label><code>${esc(value)}</code></div>`).join("");
  }
  qs("#historical-receipt").textContent = state.historicalLiveProof.receiptHash;
}

function renderSpend(state) {
  const policy = state.spend.policy;
  const session = state.spend.session;
  const status = session.authorized ? "AUTHORIZED" : "REVOKED";
  const pill = qs("#spend-state");
  pill.textContent = status;
  pill.className = `state-chip ${tone(status)}`;
  const rows = [
    ["Per purchase", dollars(policy.maxPerPurchaseUusdc)],
    ["Attempts / capability", policy.maxAttemptsPerCapability],
    ["Session cap", dollars(policy.maxSessionSpendUusdc)],
    ["Spent / reserved", `${dollars(session.spentUusdc)} / ${dollars(session.reservedUusdc)}`],
  ];
  qs("#spend-detail").innerHTML = rows.map(([label, value]) => `<div class="policy-row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("");
}

function renderEvents(state) {
  qs("#events").innerHTML = state.events.slice(0, 14).map((event) => `
    <div class="event"><strong>${esc(event.kind.toUpperCase())} / ${esc(time(event.at))}</strong><span>${esc(event.message)}</span></div>
  `).join("");
}

function renderFaults(state) {
  const activeFaults = new Set();
  if (state.telemetry.fault !== "none") activeFaults.add(state.telemetry.fault);
  if (!state.provider.available) activeFaults.add("provider_unavailable");
  qsa("[data-fault]").forEach((button) => {
    const active = activeFaults.has(button.dataset.fault);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const status = qs("#fault-status");
  status.textContent = activeFaults.size ? `${activeFaults.size} active` : "Healthy";
  status.className = `console-status ${activeFaults.size ? "bad" : ""}`;
}

function render(state) {
  current = state;
  const mode = qs("#mode-badge");
  mode.textContent = state.product.liveTelegraphEnabled ? "LIVE TESTNET ENABLED" : "SAFE SIMULATION";
  mode.className = `system-badge ${state.product.liveTelegraphEnabled ? "live" : "sim"}`;
  qs("#recover-live").disabled = busy || !state.product.liveTelegraphEnabled;

  qs("#task-name").textContent = state.task.name;
  qs("#machine-id").textContent = state.task.machineId;
  qs("#task-state").textContent = state.task.state;
  qs("#task-state").className = `state-chip ${tone(state.task.state)}`;
  qs("#telemetry-state").textContent = state.telemetry.status;
  qs("#telemetry-state").className = `state-chip ${tone(state.telemetry.status)}`;

  renderMetrics(state);
  renderRecoveryRail(state);
  renderTelemetry(state);
  renderChecks(state);
  renderPurchase(state);
  renderSpend(state);
  renderEvents(state);
  renderFaults(state);
}

async function refresh() {
  try { render(await api("/api/state")); } catch (error) { toast(error.message); }
}

async function mutate(path, body) {
  if (busy) return;
  setBusy(true);
  try {
    render(await api(path, { method: "POST", body: JSON.stringify(body || {}) }));
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(false);
  }
}

qs("#recover-sim").addEventListener("click", () => mutate("/api/recover", { mode: "simulation" }));
qs("#recover-live").addEventListener("click", () => {
  if (!current?.product.liveTelegraphEnabled) return;
  const confirmed = confirm("This can spend up to $0.01 test USDC per attempt from the dedicated Telegraph escrow. Continue?");
  if (confirmed) mutate("/api/recover", { mode: "live" });
});
qs("#authorize").addEventListener("click", () => mutate("/api/spend", { authorized: true }));
qs("#revoke").addEventListener("click", () => mutate("/api/spend", { authorized: false }));
qs("#reset").addEventListener("click", () => mutate("/api/reset", {}));
qsa("[data-fault]").forEach((button) => button.addEventListener("click", () => mutate("/api/fault", { fault: button.dataset.fault })));

refresh();
setInterval(() => { if (!busy) refresh(); }, 3000);
