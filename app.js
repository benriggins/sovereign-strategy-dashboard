/* =========================================================================
 * Sovereign Strategy Deliverables Dashboard
 * app.js — all logic. Vanilla JS. No frameworks. No build step. No backend.
 *
 * Everything you'd normally want to rebrand lives in CONFIG below.
 * Change titles, platforms, priorities, statuses, and theme colors there.
 * ========================================================================= */

const CONFIG = {
  appTitle: "Sovereign Strategy Deliverables Dashboard",
  appSubtitle: "Universal SEO / GEO / AEO content command center",
  defaultClient: "LibertyCES",
  storageKey: "sovereign_strategy_deliverables_v1",
  platforms: [
    "Webpage",
    "Product Page",
    "Blog",
    "YouTube / NotebookLM Video",
    "Instagram Video",
    "Instagram Carousel",
    "LinkedIn Carousel",
    "LinkedIn James Post",
    "LinkedIn LibertyCES Post",
    "LinkedIn Newsletter"
  ],
  priorities: ["Build First", "Build Second", "Build Later"],
  statuses: ["Idea", "Approved", "In Progress", "Built", "Published", "Paused"],
  theme: {
    accent: "#2f80ed",
    background: "#07111f",
    surface: "#101b2d",
    surfaceLight: "#17243a",
    text: "#ffffff",
    muted: "#aeb8c7",
    silver: "#d8dee8"
  }
};

/* The prompt copied by the "Copy Claude Data Packet Prompt" button.
 * Kept here so it is easy to edit alongside CONFIG. */
const CLAUDE_PROMPT = `Analyze the keyword research and Airtable outputs for LibertyCES.

Do not create a dashboard.
Do not write the full content.
Do not write full webpages, blogs, posts, newsletters, scripts, captions, or carousel slides.

Only create dashboard-ready deliverables.

Output using this exact wrapper:

BEGIN_SOVEREIGN_DELIVERABLES_V1
{
"meta": {
"client": "LibertyCES",
"project": "",
"topic": "",
"created_by": "Claude",
"notes": ""
},
"deliverables": [
{
"platform": "",
"deliverable_type": "",
"priority": "",
"status": "Idea",
"deliverable": "",
"angle": "",
"seo_focus": [],
"geo_focus": [],
"aeo_focus": [],
"context_blueprint": "",
"notes": ""
}
]
}
END_SOVEREIGN_DELIVERABLES_V1

Allowed platforms:

* Webpage
* Product Page
* Blog
* YouTube / NotebookLM Video
* Instagram Video
* Instagram Carousel
* LinkedIn Carousel
* LinkedIn James Post
* LinkedIn LibertyCES Post
* LinkedIn Newsletter

Allowed priorities:

* Build First
* Build Second
* Build Later

Rules:

1. Do not include rejected keywords.
2. Do not include consumer-only topics.
3. Every deliverable must have SEO, GEO, AEO, angle, and context_blueprint.
4. Keep each context_blueprint to 2-4 sentences.
5. Make every deliverable hyper-relevant to LibertyCES industrial, municipal, commercial, contractor, water treatment, wastewater treatment, filtration, valves, tanks, pumps, chemical feed, PFAS/GAC, RO pre-treatment, sodium hypochlorite, or equipment specification intent.
6. Output only the wrapped JSON packet.`;

/* =========================================================================
 * Accuracy QA prompt
 * Paste-this-research-prompt: a universal, packet-agnostic verification pass.
 * ========================================================================= */

const QA_PROMPT = `🔍 UNIVERSAL ACCURACY VERIFICATION — FULL PACKET QA

Review this ENTIRE deliverable package — every section, every writeup, every
image, every caption, every number, every link, every contact detail. Do NOT
skim. I need you to LITERALLY quadruple-check it: four separate, independent
verification passes over the whole thing.

CHECK EVERYTHING:
• Writeups/copy — every factual claim, statistic, product spec, material/chemical
  compatibility, standard or code cited, date, name, title, and quote.
• Numbers & units — recompute and verify every figure, unit, conversion,
  percentage, price, and dimension.
• Images — for EACH image, confirm it actually depicts what its caption,
  filename, and surrounding copy claim. Right product, right equipment, right
  setting. Flag AI artifacts, wrong/garbled text, wrong logos, mislabeled parts,
  and any filename that's inaccurate or not SEO-correct.
• Links & references — every URL must resolve and point to the right place.
• Contacts/branding — phone, emails, website, and links must match the canonical
  LibertyCES block EXACTLY: James Riggins james@libertyces.com,
  sales@libertyces.com, (559) 395-5500, libertyces.com. No placeholders, no
  "scan to…", no [link] stand-ins. Brand palette correct.
• Internal consistency — nothing contradicts anything else anywhere in the
  packet; naming, terminology, and branding consistent throughout.

FOUR-PASS METHOD (do all four):
  Pass 1 — Claims & facts
  Pass 2 — Numbers, units, specs, links
  Pass 3 — Images vs. their captions/context
  Pass 4 — Cross-document consistency + branding/contacts

THEN SEND A FULL STATUS REPORT ON ACCURACY:
  1. Overall verdict — PASS or FIX REQUIRED
  2. Item-by-item table — location → what was checked → verified / error
     → the exact correction
  3. A complete list of every error found and the fix
  4. Confirmation that all four passes were completed

Eliminate ALL errors — no matter what. If something cannot be verified, label it
UNVERIFIED and flag it loudly; never let it pass silently. Do not approve this
packet until it is 100% error-free.`;

/* =========================================================================
 * State
 * ========================================================================= */

const OTHER_SECTION = "Other";

let state = {
  meta: {},          // { client, project, topic, created_by, notes }
  deliverables: []   // array of normalized deliverable objects
};

/* =========================================================================
 * Utilities
 * ========================================================================= */

function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function genId() {
  return "d_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Convert a value into a clean string array. Accepts arrays or
 * comma/newline separated strings. */
function toArray(value) {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/[\n,]/).map(v => v.trim()).filter(Boolean);
  }
  return [];
}

/* Apply the theme colors from CONFIG onto CSS custom properties so the
 * stylesheet and JS stay in sync from one place. */
function applyTheme() {
  const r = document.documentElement;
  const t = CONFIG.theme;
  r.style.setProperty("--accent", t.accent);
  r.style.setProperty("--bg", t.background);
  r.style.setProperty("--surface", t.surface);
  r.style.setProperty("--surface-light", t.surfaceLight);
  r.style.setProperty("--text", t.text);
  r.style.setProperty("--muted", t.muted);
  r.style.setProperty("--silver", t.silver);
}

/* =========================================================================
 * Parsing & normalization
 * ========================================================================= */

/* Pull JSON out of any supported wrapper, then JSON.parse it.
 * Supports:
 *   - BEGIN_SOVEREIGN_DELIVERABLES_V1 ... END_SOVEREIGN_DELIVERABLES_V1
 *   - BEGIN_LIBERTYCES_DELIVERABLES_V1 ... END_LIBERTYCES_DELIVERABLES_V1
 *   - Raw JSON (object with .deliverables, or a plain array)
 * Returns { meta, deliverables } or throws an Error with a friendly message. */
function parsePacket(raw) {
  if (!raw || !raw.trim()) {
    throw new Error("Nothing to import. Paste a deliverables packet first.");
  }

  let text = raw.trim();

  // Strip known wrappers if present (case-insensitive, any whitespace).
  const wrappers = [
    [/BEGIN_SOVEREIGN_DELIVERABLES_V1/i, /END_SOVEREIGN_DELIVERABLES_V1/i],
    [/BEGIN_LIBERTYCES_DELIVERABLES_V1/i, /END_LIBERTYCES_DELIVERABLES_V1/i]
  ];
  for (const [begin, end] of wrappers) {
    const b = text.search(begin);
    if (b !== -1) {
      const afterBegin = text.slice(b).replace(begin, "");
      const e = afterBegin.search(end);
      text = (e !== -1 ? afterBegin.slice(0, e) : afterBegin).trim();
      break;
    }
  }

  // As a fallback, if there is still stray prose around the JSON, grab the
  // outermost { } or [ ] block.
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const sliced = sliceOutermostJSON(text);
    if (sliced) {
      try {
        parsed = JSON.parse(sliced);
      } catch (err2) {
        throw new Error("That doesn't look like valid JSON. Check for missing commas or quotes.");
      }
    } else {
      throw new Error("That doesn't look like valid JSON. Check for missing commas or quotes.");
    }
  }

  // Normalize into { meta, deliverables }.
  let meta = {};
  let deliverables;

  if (Array.isArray(parsed)) {
    deliverables = parsed;
  } else if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.deliverables)) {
      meta = parsed.meta && typeof parsed.meta === "object" ? parsed.meta : {};
      deliverables = parsed.deliverables;
    } else {
      // A single deliverable object pasted on its own.
      deliverables = [parsed];
    }
  } else {
    throw new Error("Could not find any deliverables in that input.");
  }

  if (!Array.isArray(deliverables) || deliverables.length === 0) {
    throw new Error("No deliverables found in that packet.");
  }

  return { meta, deliverables };
}

/* Find the outermost {...} or [...] in a string for lenient parsing. */
function sliceOutermostJSON(text) {
  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  let start = -1, open = "{", close = "}";
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr; open = "["; close = "]";
  } else if (firstObj !== -1) {
    start = firstObj; open = "{"; close = "}";
  }
  if (start === -1) return null;
  const last = text.lastIndexOf(close);
  if (last <= start) return null;
  return text.slice(start, last + 1);
}

/* Validate + fill defaults for one deliverable. Returns { ok, value, error }. */
function normalizeDeliverable(d) {
  if (!d || typeof d !== "object") {
    return { ok: false, error: "A deliverable entry was not an object." };
  }

  const platform = (d.platform || "").toString().trim();
  const deliverable = (d.deliverable || "").toString().trim();
  const angle = (d.angle || "").toString().trim();
  const blueprint = (d.context_blueprint || "").toString().trim();

  // Required: platform, deliverable, angle, context_blueprint.
  const missing = [];
  if (!platform) missing.push("platform");
  if (!deliverable) missing.push("deliverable");
  if (!angle) missing.push("angle");
  if (!blueprint) missing.push("context_blueprint");
  if (missing.length) {
    const label = deliverable || platform || "an entry";
    return { ok: false, error: `"${label}" is missing: ${missing.join(", ")}.` };
  }

  const priority = CONFIG.priorities.includes(d.priority) ? d.priority : CONFIG.priorities[0];
  const status = CONFIG.statuses.includes(d.status) ? d.status : "Idea";

  const value = {
    id: (d.id && String(d.id).trim()) || genId(),
    platform: platform,
    deliverable_type: (d.deliverable_type || "").toString().trim(),
    priority: priority,
    status: status,
    deliverable: deliverable,
    angle: angle,
    seo_focus: toArray(d.seo_focus),
    geo_focus: toArray(d.geo_focus),
    aeo_focus: toArray(d.aeo_focus),
    context_blueprint: blueprint,
    notes: (d.notes || "").toString().trim()
  };

  return { ok: true, value };
}

/* =========================================================================
 * Persistence
 * ========================================================================= */

function save() {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save to localStorage:", err);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.deliverables)) {
      state.meta = parsed.meta || {};
      // Re-normalize lightly so older saves still get IDs/defaults.
      state.deliverables = parsed.deliverables.map(d => {
        const n = normalizeDeliverable(d);
        return n.ok ? n.value : null;
      }).filter(Boolean);
      return true;
    }
  } catch (err) {
    console.warn("Could not load from localStorage:", err);
  }
  return false;
}

/* =========================================================================
 * Import flow
 * ========================================================================= */

function importFromText(raw) {
  let packet;
  try {
    packet = parsePacket(raw);
  } catch (err) {
    showMessage(err.message, "error");
    return;
  }

  const accepted = [];
  const errors = [];
  packet.deliverables.forEach((d, i) => {
    const n = normalizeDeliverable(d);
    if (n.ok) accepted.push(n.value);
    else errors.push(`#${i + 1}: ${n.error}`);
  });

  if (accepted.length === 0) {
    showMessage(
      "No valid deliverables imported. " + (errors[0] || "Check required fields."),
      "error"
    );
    return;
  }

  state.meta = packet.meta || {};
  state.deliverables = accepted;
  save();
  render();

  let msg = `Imported ${accepted.length} deliverable${accepted.length === 1 ? "" : "s"}.`;
  if (errors.length) {
    msg += ` ${errors.length} entr${errors.length === 1 ? "y was" : "ies were"} skipped (missing required fields).`;
    showMessage(msg, "warn");
  } else {
    showMessage(msg, "success");
  }

  $("#import-box").value = "";
}

/* =========================================================================
 * Rendering
 * ========================================================================= */

function render() {
  applyMetaToHeader();
  renderStats();
  renderSections();
}

function applyMetaToHeader() {
  const m = state.meta || {};
  const parts = [];
  const client = m.client || (state.deliverables.length ? CONFIG.defaultClient : "");
  if (client) parts.push(`<span class="meta-key">Client:</span> ${escapeHTML(client)}`);
  if (m.project) parts.push(`<span class="meta-key">Project:</span> ${escapeHTML(m.project)}`);
  if (m.topic) parts.push(`<span class="meta-key">Topic:</span> ${escapeHTML(m.topic)}`);

  const el = $("#active-meta");
  if (parts.length) {
    el.innerHTML = parts.join('<span class="meta-sep">•</span>');
    el.style.display = "";
  } else {
    el.innerHTML = "";
    el.style.display = "none";
  }
}

function renderStats() {
  const all = state.deliverables;
  const total = all.length;
  const buildFirst = all.filter(d => d.priority === "Build First").length;
  const published = all.filter(d => d.status === "Published").length;

  $("#stat-total").textContent = total;
  $("#stat-buildfirst").textContent = buildFirst;
  $("#stat-published").textContent = published;
}

/* Returns the deliverables passing the current filters. */
function getFiltered() {
  const q = $("#filter-search").value.trim().toLowerCase();
  const platform = $("#filter-platform").value;
  const priority = $("#filter-priority").value;
  const status = $("#filter-status").value;

  return state.deliverables.filter(d => {
    if (platform && d.platform !== platform) return false;
    if (priority && d.priority !== priority) return false;
    if (status && d.status !== status) return false;

    if (q) {
      const haystack = [
        d.deliverable,
        d.deliverable_type,
        d.angle,
        d.context_blueprint,
        d.notes,
        d.seo_focus.join(" "),
        d.geo_focus.join(" "),
        d.aeo_focus.join(" ")
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function renderSections() {
  const container = $("#sections");
  const filtered = getFiltered();

  // Empty state: no data at all.
  if (state.deliverables.length === 0) {
    container.innerHTML = "";
    $("#empty-state").style.display = "";
    $("#no-results").style.display = "none";
    return;
  }
  $("#empty-state").style.display = "none";

  // Data exists but filters matched nothing.
  if (filtered.length === 0) {
    container.innerHTML = "";
    $("#no-results").style.display = "";
    return;
  }
  $("#no-results").style.display = "none";

  // Group by platform, honoring CONFIG order, with "Other" last.
  const order = [...CONFIG.platforms, OTHER_SECTION];
  const groups = {};
  filtered.forEach(d => {
    const key = CONFIG.platforms.includes(d.platform) ? d.platform : OTHER_SECTION;
    (groups[key] = groups[key] || []).push(d);
  });

  const html = order
    .filter(p => groups[p] && groups[p].length)
    .map(p => renderSection(p, groups[p]))
    .join("");

  container.innerHTML = html;
  wireCardEvents(container);
}

function renderSection(platform, items) {
  const cards = items.map(renderCard).join("");
  return `
    <section class="platform-section">
      <div class="section-head">
        <h2 class="section-title">${escapeHTML(platform)}</h2>
        <span class="section-count">${items.length}</span>
      </div>
      <div class="card-grid">${cards}</div>
    </section>
  `;
}

function chipList(label, arr, cls) {
  if (!arr || !arr.length) return "";
  const chips = arr.map(v => `<span class="chip ${cls}">${escapeHTML(v)}</span>`).join("");
  return `
    <div class="focus-row">
      <span class="focus-label">${label}</span>
      <div class="chips">${chips}</div>
    </div>`;
}

function priorityClass(priority) {
  if (priority === "Build First") return "p-first";
  if (priority === "Build Second") return "p-second";
  return "p-later";
}

function statusSelect(d) {
  const options = CONFIG.statuses.map(s =>
    `<option value="${escapeHTML(s)}"${s === d.status ? " selected" : ""}>${escapeHTML(s)}</option>`
  ).join("");
  const slug = d.status.toLowerCase().replace(/[^a-z]+/g, "-");
  return `<select class="status-select status-${slug}" data-act="status" data-id="${d.id}" aria-label="Status">${options}</select>`;
}

function renderCard(d) {
  return `
  <article class="card" data-id="${d.id}">
    <div class="card-top">
      <span class="badge ${priorityClass(d.priority)}">${escapeHTML(d.priority)}</span>
      ${statusSelect(d)}
    </div>

    <h3 class="card-title">${escapeHTML(d.deliverable)}</h3>
    ${d.deliverable_type ? `<div class="card-type">${escapeHTML(d.deliverable_type)}</div>` : ""}

    <div class="field">
      <span class="field-label">Angle</span>
      <p class="field-text">${escapeHTML(d.angle)}</p>
    </div>

    ${chipList("SEO", d.seo_focus, "chip-seo")}
    ${chipList("GEO", d.geo_focus, "chip-geo")}
    ${chipList("AEO", d.aeo_focus, "chip-aeo")}

    <div class="field">
      <span class="field-label">Context</span>
      <p class="field-text">${escapeHTML(d.context_blueprint)}</p>
    </div>

    ${d.notes ? `
    <div class="field notes">
      <span class="field-label">Notes</span>
      <p class="field-text">${escapeHTML(d.notes)}</p>
    </div>` : ""}

    <div class="card-actions">
      <button class="btn-mini" data-act="copy" data-id="${d.id}">Copy Card</button>
      <button class="btn-mini" data-act="edit" data-id="${d.id}">Edit</button>
      <button class="btn-mini btn-danger" data-act="delete" data-id="${d.id}">Delete</button>
    </div>

    <div class="edit-area" data-edit="${d.id}" hidden></div>
  </article>`;
}

/* =========================================================================
 * Card interactions (event delegation)
 * ========================================================================= */

function wireCardEvents(root) {
  root.addEventListener("change", onCardChange);
  root.addEventListener("click", onCardClick);
}

function findById(id) {
  return state.deliverables.find(d => d.id === id);
}

function onCardChange(e) {
  const sel = e.target.closest('[data-act="status"]');
  if (!sel) return;
  const d = findById(sel.dataset.id);
  if (!d) return;
  d.status = sel.value;
  save();
  renderStats();
  // Recolor the dropdown without a full re-render.
  sel.className = "status-select status-" + d.status.toLowerCase().replace(/[^a-z]+/g, "-");
  sel.setAttribute("data-act", "status");
}

function onCardClick(e) {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const id = btn.dataset.id;
  if (act === "copy") copyCard(id, btn);
  else if (act === "delete") deleteCard(id);
  else if (act === "edit") toggleEdit(id);
}

function copyCard(id, btn) {
  const d = findById(id);
  if (!d) return;
  const lines = [];
  lines.push(`[${d.priority}] [${d.status}]`);
  lines.push("");
  lines.push(d.deliverable);
  if (d.deliverable_type) lines.push(d.deliverable_type);
  lines.push("");
  lines.push("Angle:");
  lines.push(d.angle);
  if (d.seo_focus.length) { lines.push(""); lines.push("SEO:"); lines.push(d.seo_focus.join(", ")); }
  if (d.geo_focus.length) { lines.push(""); lines.push("GEO:"); d.geo_focus.forEach(g => lines.push(g)); }
  if (d.aeo_focus.length) { lines.push(""); lines.push("AEO:"); d.aeo_focus.forEach(a => lines.push(a)); }
  lines.push(""); lines.push("Context:"); lines.push(d.context_blueprint);
  if (d.notes) { lines.push(""); lines.push("Notes:"); lines.push(d.notes); }

  copyToClipboard(lines.join("\n"), btn, "Copy Card");
}

function deleteCard(id) {
  const d = findById(id);
  if (!d) return;
  if (!confirm(`Delete "${d.deliverable}"?`)) return;
  state.deliverables = state.deliverables.filter(x => x.id !== id);
  save();
  render();
}

/* Inline expandable edit area inside the card. */
function toggleEdit(id) {
  const wrap = document.querySelector(`[data-edit="${id}"]`);
  if (!wrap) return;
  if (!wrap.hidden) { wrap.hidden = true; wrap.innerHTML = ""; return; }

  const d = findById(id);
  if (!d) return;

  const platformOpts = CONFIG.platforms.concat(
    CONFIG.platforms.includes(d.platform) ? [] : [d.platform]
  ).map(p => `<option value="${escapeHTML(p)}"${p === d.platform ? " selected" : ""}>${escapeHTML(p)}</option>`).join("");

  const priorityOpts = CONFIG.priorities.map(p =>
    `<option value="${escapeHTML(p)}"${p === d.priority ? " selected" : ""}>${escapeHTML(p)}</option>`).join("");

  const statusOpts = CONFIG.statuses.map(s =>
    `<option value="${escapeHTML(s)}"${s === d.status ? " selected" : ""}>${escapeHTML(s)}</option>`).join("");

  wrap.innerHTML = `
    <div class="edit-grid">
      <label class="ed">Platform
        <select data-f="platform">${platformOpts}</select>
      </label>
      <label class="ed">Deliverable type
        <input type="text" data-f="deliverable_type" value="${escapeHTML(d.deliverable_type)}">
      </label>
      <label class="ed">Priority
        <select data-f="priority">${priorityOpts}</select>
      </label>
      <label class="ed">Status
        <select data-f="status">${statusOpts}</select>
      </label>
      <label class="ed ed-full">Deliverable title
        <input type="text" data-f="deliverable" value="${escapeHTML(d.deliverable)}">
      </label>
      <label class="ed ed-full">Angle
        <textarea data-f="angle" rows="2">${escapeHTML(d.angle)}</textarea>
      </label>
      <label class="ed ed-full">SEO focus (comma separated)
        <input type="text" data-f="seo_focus" value="${escapeHTML(d.seo_focus.join(", "))}">
      </label>
      <label class="ed ed-full">GEO focus (comma separated)
        <input type="text" data-f="geo_focus" value="${escapeHTML(d.geo_focus.join(", "))}">
      </label>
      <label class="ed ed-full">AEO focus (comma separated)
        <input type="text" data-f="aeo_focus" value="${escapeHTML(d.aeo_focus.join(", "))}">
      </label>
      <label class="ed ed-full">Context blueprint
        <textarea data-f="context_blueprint" rows="3">${escapeHTML(d.context_blueprint)}</textarea>
      </label>
      <label class="ed ed-full">Notes
        <textarea data-f="notes" rows="2">${escapeHTML(d.notes)}</textarea>
      </label>
    </div>
    <div class="edit-buttons">
      <button class="btn-mini btn-primary" data-editact="save" data-id="${id}">Save</button>
      <button class="btn-mini" data-editact="cancel" data-id="${id}">Cancel</button>
    </div>
  `;
  wrap.hidden = false;

  wrap.querySelector('[data-editact="save"]').addEventListener("click", () => saveEdit(id, wrap));
  wrap.querySelector('[data-editact="cancel"]').addEventListener("click", () => toggleEdit(id));
}

function saveEdit(id, wrap) {
  const d = findById(id);
  if (!d) return;
  const get = f => wrap.querySelector(`[data-f="${f}"]`).value;

  const updated = {
    ...d,
    platform: get("platform").trim() || d.platform,
    deliverable_type: get("deliverable_type").trim(),
    priority: CONFIG.priorities.includes(get("priority")) ? get("priority") : d.priority,
    status: CONFIG.statuses.includes(get("status")) ? get("status") : d.status,
    deliverable: get("deliverable").trim() || d.deliverable,
    angle: get("angle").trim() || d.angle,
    seo_focus: toArray(get("seo_focus")),
    geo_focus: toArray(get("geo_focus")),
    aeo_focus: toArray(get("aeo_focus")),
    context_blueprint: get("context_blueprint").trim() || d.context_blueprint,
    notes: get("notes").trim()
  };

  const idx = state.deliverables.findIndex(x => x.id === id);
  state.deliverables[idx] = updated;
  save();
  render();
  showMessage("Saved changes.", "success");
}

/* =========================================================================
 * Export
 * ========================================================================= */

function exportJSON() {
  if (!state.deliverables.length) { showMessage("Nothing to export yet.", "warn"); return; }
  const payload = {
    meta: state.meta || {},
    deliverables: state.deliverables
  };
  download(
    "sovereign-deliverables-export.json",
    JSON.stringify(payload, null, 2),
    "application/json"
  );
  showMessage("Exported JSON.", "success");
}

function csvCell(value) {
  const s = String(value === null || value === undefined ? "" : value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function exportCSV() {
  if (!state.deliverables.length) { showMessage("Nothing to export yet.", "warn"); return; }
  const cols = [
    "id", "platform", "deliverable_type", "priority", "status",
    "deliverable", "angle", "seo_focus", "geo_focus", "aeo_focus",
    "context_blueprint", "notes"
  ];
  const rows = [cols.join(",")];
  state.deliverables.forEach(d => {
    const row = cols.map(c => {
      const v = d[c];
      if (Array.isArray(v)) return csvCell(v.join("; "));
      return csvCell(v);
    });
    rows.push(row.join(","));
  });
  download("sovereign-deliverables-export.csv", rows.join("\n"), "text/csv");
  showMessage("Exported CSV.", "success");
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* =========================================================================
 * Clipboard + messages
 * ========================================================================= */

function copyToClipboard(text, btn, restoreLabel) {
  const done = () => {
    if (btn) {
      const original = restoreLabel || btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = original; }, 1200);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
  if (done) done();
}

let messageTimer = null;
function showMessage(text, type = "info") {
  const el = $("#message");
  el.textContent = text;
  el.className = "message show msg-" + type;
  if (messageTimer) clearTimeout(messageTimer);
  messageTimer = setTimeout(() => { el.className = "message"; }, 5000);
}

/* =========================================================================
 * Wiring
 * ========================================================================= */

function populateFilterDropdowns() {
  const platSel = $("#filter-platform");
  CONFIG.platforms.concat([OTHER_SECTION]).forEach(p => {
    const o = document.createElement("option");
    o.value = p; o.textContent = p;
    platSel.appendChild(o);
  });
  const prioSel = $("#filter-priority");
  CONFIG.priorities.forEach(p => {
    const o = document.createElement("option");
    o.value = p; o.textContent = p;
    prioSel.appendChild(o);
  });
  const statSel = $("#filter-status");
  CONFIG.statuses.forEach(s => {
    const o = document.createElement("option");
    o.value = s; o.textContent = s;
    statSel.appendChild(o);
  });
}

function clearDashboard() {
  if (!confirm("Clear the dashboard? This wipes all imported deliverables and saved changes.")) return;
  state = { meta: {}, deliverables: [] };
  try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
  $("#import-box").value = "";
  render();
  showMessage("Dashboard cleared.", "info");
}

function init() {
  applyTheme();

  // Header text from CONFIG.
  document.title = CONFIG.appTitle;
  $("#app-title").textContent = CONFIG.appTitle;
  $("#app-subtitle").textContent = CONFIG.appSubtitle;

  populateFilterDropdowns();

  // Buttons.
  $("#btn-import").addEventListener("click", () => importFromText($("#import-box").value));
  $("#btn-sample").addEventListener("click", () => {
    const data = window.SAMPLE_DELIVERABLES;
    if (!data) { showMessage("Sample data not found.", "error"); return; }
    importFromText(JSON.stringify(data));
  });
  $("#btn-clear").addEventListener("click", clearDashboard);
  $("#btn-export-json").addEventListener("click", exportJSON);
  $("#btn-export-csv").addEventListener("click", exportCSV);
  $("#btn-copy-prompt").addEventListener("click", (e) =>
    copyToClipboard(CLAUDE_PROMPT, e.currentTarget, "Copy Claude Data Packet Prompt"));

  // Accuracy QA prompt: fill preview from the single source of truth + wire copy.
  $("#qa-preview").textContent = QA_PROMPT;
  $("#btn-copy-qa").addEventListener("click", (e) =>
    copyToClipboard(QA_PROMPT, e.currentTarget, "Copy Accuracy QA Prompt"));

  // Filters (live).
  ["#filter-search", "#filter-platform", "#filter-priority", "#filter-status"].forEach(sel => {
    const el = $(sel);
    el.addEventListener("input", renderSections);
    el.addEventListener("change", renderSections);
  });

  // Load saved data if present.
  load();
  render();
}

document.addEventListener("DOMContentLoaded", init);
