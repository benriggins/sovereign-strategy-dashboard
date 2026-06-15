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
  imageStorageKey: "sovereign_strategy_images_v1",
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

/* Platform → short label prefix for deliverable numbering. */
const PLATFORM_ABBREV = {
  "Webpage":                      "Webpage",
  "Product Page":                 "Product Pg",
  "Blog":                         "Blog",
  "YouTube / NotebookLM Video":   "YouTube",
  "Instagram Video":              "IG Video",
  "Instagram Carousel":           "IG Carousel",
  "LinkedIn Carousel":            "LI Carousel",
  "LinkedIn James Post":          "LI James",
  "LinkedIn LibertyCES Post":     "LI LibertyCES",
  "LinkedIn Newsletter":          "LI Newsletter"
};

/* =========================================================================
 * State
 * ========================================================================= */

const OTHER_SECTION = "Other";

let state = {
  meta: {},          // { client, project, topic, created_by, notes }
  deliverables: []   // array of normalized deliverable objects
};

// Deliverable short-label map: id → "LI James #2" — rebuilt on every render.
let deliverableLabelMap = new Map();

function buildDeliverableLabelMap() {
  deliverableLabelMap = new Map();
  const order = [...CONFIG.platforms, OTHER_SECTION];
  const groups = {};
  state.deliverables.forEach(d => {
    const key = CONFIG.platforms.includes(d.platform) ? d.platform : OTHER_SECTION;
    (groups[key] = groups[key] || []).push(d);
  });
  order.forEach(platform => {
    if (!groups[platform]) return;
    const abbrev = PLATFORM_ABBREV[platform] || platform;
    groups[platform].forEach((d, i) => {
      deliverableLabelMap.set(d.id, `${abbrev} #${i + 1}`);
    });
  });
}

function getDeliverableLabel(d) {
  return deliverableLabelMap.get(d.id) || "";
}

// Look up a short label by deliverable title (for Image Library "Used in").
function getLabelByTitle(title) {
  const d = state.deliverables.find(x => x.deliverable === title);
  return d ? getDeliverableLabel(d) : title;
}

// Image state — persisted separately so clearing deliverables keeps image blueprints
let imageState = {
  meta: {},        // { campaign, blocker, step, ... }
  assignments: {}, // deliverable title → { images: string[], image_logic: string }
  blueprints: {}   // "IMG-01" → { id, caption, type, status, prompt }
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
    notes: (d.notes || "").toString().trim(),
    url: (d.url || "").toString().trim()
  };

  return { ok: true, value };
}

/* =========================================================================
 * Image Blueprints — parsing, import, persistence
 * ========================================================================= */

/* Parse an image packet. Accepts:
 *   - BEGIN_SOVEREIGN_IMAGE_BLUEPRINTS_V1 wrapper
 *   - BEGIN_SOVEREIGN_DELIVERABLES_V1 wrapper (when deliverables have images fields)
 *   - Raw JSON
 * Returns { meta, assignments, blueprints }
 * assignments keyed by deliverable title → { images: string[], image_logic: string }
 * blueprints keyed by IMG ID → { id, caption, type, status, prompt }
 */
function parseImagePacket(raw) {
  if (!raw || !raw.trim()) {
    throw new Error("Nothing to import. Paste an image blueprints packet first.");
  }

  let text = raw.trim();
  const wrappers = [
    [/BEGIN_SOVEREIGN_IMAGE_BLUEPRINTS_V1/i, /END_SOVEREIGN_IMAGE_BLUEPRINTS_V1/i],
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

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    const sliced = sliceOutermostJSON(text);
    if (sliced) {
      try { parsed = JSON.parse(sliced); }
      catch (_2) { throw new Error("That doesn't look like valid JSON. Check for missing commas or quotes."); }
    } else {
      throw new Error("That doesn't look like valid JSON. Check for missing commas or quotes.");
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Could not parse the image packet.");
  }

  const meta = (parsed.meta && typeof parsed.meta === "object") ? parsed.meta : {};
  const assignments = {};
  const blueprints = {};

  // Parse deliverables array → image assignments (expects "images" + "deliverable" fields)
  if (Array.isArray(parsed.deliverables)) {
    parsed.deliverables.forEach(d => {
      if (!d || !d.deliverable || !d.images) return;
      const rawImgs = typeof d.images === "string"
        ? d.images.split(/[\s,]+/)
        : (Array.isArray(d.images) ? d.images : []);
      const imgs = rawImgs.map(s => s.trim()).filter(s => /^IMG-\d+$/i.test(s));
      if (imgs.length) {
        assignments[d.deliverable.trim()] = {
          images: imgs,
          image_logic: (d.image_logic || "").trim()
        };
      }
    });
  }

  // Parse blueprints array → prompt-style format
  if (Array.isArray(parsed.blueprints)) {
    parsed.blueprints.forEach(bp => {
      if (!bp || !bp.id) return;
      blueprints[bp.id.trim()] = {
        id: bp.id.trim(),
        caption: (bp.caption || "").trim(),
        type: (bp.type || "").trim(),
        status: (bp.status || "").trim(),
        prompt: (bp.prompt || "").trim(),
        shot_type: "", subject: "", setting: "", mood: "", vendor_ref: "", alt_text: ""
      };
    });
  }

  // Parse meta.image_library → structured blueprint dict (IMG-01: { shot_type, subject, ... })
  const imgLib = parsed.meta && parsed.meta.image_library;
  const gcsPattern = (parsed.meta && parsed.meta.gcs_url_pattern) || "";
  if (imgLib && typeof imgLib === "object" && !Array.isArray(imgLib)) {
    Object.entries(imgLib).forEach(([id, d]) => {
      if (!id || typeof d !== "object") return;
      const vendorRefStr = (d.vendor_ref || "").trim();
      const isVendorRef = vendorRefStr.toLowerCase().startsWith("yes");
      const seoFilename = (d.seo_filename || "").trim();
      const imageUrl = gcsPattern && seoFilename
        ? gcsPattern.replace("[seo_filename]", seoFilename)
        : "";
      blueprints[id] = {
        id,
        caption:      (d.alt_text   || "").trim(),
        type:         (d.shot_type  || "").trim(),
        status:       isVendorRef ? "needs_reference" : "ready",
        prompt:       (d.prompt     || "").trim(),
        shot_type:    (d.shot_type  || "").trim(),
        subject:      (d.subject    || "").trim(),
        setting:      (d.setting    || "").trim(),
        mood:         (d.mood       || "").trim(),
        vendor_ref:   (d.vendor_ref || "").trim(),
        alt_text:     (d.alt_text   || "").trim(),
        seo_filename: seoFilename,
        image_url:    imageUrl
      };
    });
  }

  if (!Object.keys(assignments).length && !Object.keys(blueprints).length) {
    throw new Error(
      "No image assignments or blueprints found. " +
      "Paste a packet with a \"deliverables\" array (with images fields) " +
      "and/or a meta.image_library object or a blueprints array."
    );
  }

  // sourceDeliverables lets the importer look up platform for auto-created cards
  const sourceDeliverables = Array.isArray(parsed.deliverables) ? parsed.deliverables : [];

  return { meta, assignments, blueprints, sourceDeliverables };
}

function importImageBlueprints(raw) {
  let packet;
  try {
    packet = parseImagePacket(raw);
  } catch (err) {
    showMessage(err.message, "error");
    return;
  }

  // Merge into imageState so multiple pastes layer together
  Object.assign(imageState.meta, packet.meta);
  Object.assign(imageState.assignments, packet.assignments);
  Object.assign(imageState.blueprints, packet.blueprints);

  // Auto-create minimal deliverable cards for any assignment that has no matching card.
  // This lets an image-map packet stand alone — no separate deliverables import needed.
  const newCards = [];
  Object.keys(packet.assignments).forEach(title => {
    const normTitle = normalizeTitle(title);
    if (state.deliverables.find(d => normalizeTitle(d.deliverable) === normTitle)) return;
    const src = packet.sourceDeliverables.find(d => (d.deliverable || "").trim() === title);
    const platform = src && CONFIG.platforms.includes((src.platform || "").trim())
      ? src.platform.trim()
      : OTHER_SECTION;
    newCards.push({
      id: genId(),
      platform,
      deliverable_type: "",
      priority: CONFIG.priorities[0],
      status: "Idea",
      deliverable: title,
      angle: "",
      seo_focus: [],
      geo_focus: [],
      aeo_focus: [],
      context_blueprint: "",
      notes: ""
    });
  });

  if (newCards.length) {
    state.deliverables = [...state.deliverables, ...newCards];
    save();
  }

  saveImages();
  buildDeliverableLabelMap();
  renderSections();
  renderImageLibrary();

  const aCount = Object.keys(packet.assignments).length;
  const bCount = Object.keys(packet.blueprints).length;
  const parts = [];
  if (aCount) parts.push(`${aCount} image assignment${aCount === 1 ? "" : "s"}`);
  if (bCount) parts.push(`${bCount} image blueprint${bCount === 1 ? "" : "s"}`);
  if (newCards.length) parts.push(`${newCards.length} card${newCards.length === 1 ? "" : "s"} created`);
  showMessage(parts.join(" + ") + " imported.", "success");
  $("#img-import-box").value = "";
}

function saveImages() {
  try {
    localStorage.setItem(CONFIG.imageStorageKey, JSON.stringify(imageState));
  } catch (err) {
    console.warn("Could not save image state:", err);
  }
}

function loadImages() {
  try {
    const raw = localStorage.getItem(CONFIG.imageStorageKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      imageState.meta = parsed.meta || {};
      imageState.assignments = parsed.assignments || {};
      imageState.blueprints = parsed.blueprints || {};
      return true;
    }
  } catch (_) {}
  return false;
}

/* Normalize a title for fuzzy matching: em/en-dash → hyphen, collapse spaces, lowercase. */
function normalizeTitle(t) {
  return String(t || "")
    .replace(/[—–‒]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getImageAssignment(deliverableTitle) {
  // Exact match first
  if (imageState.assignments[deliverableTitle]) return imageState.assignments[deliverableTitle];
  // Normalized fallback (handles em-dash vs hyphen and similar punctuation drift)
  const norm = normalizeTitle(deliverableTitle);
  const entry = Object.entries(imageState.assignments).find(([k]) => normalizeTitle(k) === norm);
  return entry ? entry[1] : null;
}

/* Build copy text for one image blueprint card. */
function buildBlueprintCopyText(imgId, includeUsage = false) {
  const bp = imageState.blueprints[imgId];
  if (!bp) return `[${imgId}]\nNo blueprint loaded.`;

  const lines = [];
  lines.push(`[${imgId}]${bp.shot_type ? " — " + bp.shot_type : ""}`);
  if (bp.vendor_ref) lines.push(`Vendor ref: ${bp.vendor_ref}`);
  lines.push("");

  if (bp.image_url)  { lines.push("Image:");      lines.push(bp.image_url);  lines.push(""); }
  if (bp.subject)    { lines.push("Subject:");    lines.push(bp.subject);    lines.push(""); }
  if (bp.setting)    { lines.push("Setting:");    lines.push(bp.setting);    lines.push(""); }
  if (bp.mood)       { lines.push("Mood:");       lines.push(bp.mood);       lines.push(""); }
  if (bp.alt_text)   { lines.push("Alt text:");   lines.push(bp.alt_text);   lines.push(""); }
  if (bp.prompt)     { lines.push("Prompt:");     lines.push(bp.prompt);     lines.push(""); }

  if (includeUsage) {
    const uses = Object.entries(imageState.assignments)
      .filter(([, asgn]) => asgn.images.includes(imgId))
      .map(([title]) => {
        const label = getLabelByTitle(title);
        return label !== title ? `${label} — ${title}` : title;
      });
    if (uses.length) {
      lines.push("Used in:");
      uses.forEach(t => lines.push(`• ${t}`));
    }
  }

  return lines.join("\n").trim();
}

/* Build the HTML card for one image blueprint (used in inline expand + library). */
function buildBlueprintCardHTML(imgId, showUsage = false) {
  const bp = imageState.blueprints[imgId];
  if (!bp) {
    return `
      <div class="img-prompt-card">
        <div class="img-prompt-header">
          <span class="chip chip-img">${escapeHTML(imgId)}</span>
          <span class="img-no-prompt">No blueprint loaded yet — paste a blueprints packet to add it.</span>
        </div>
      </div>`;
  }

  const isVendorRef = bp.vendor_ref && bp.vendor_ref.toLowerCase().startsWith("yes");
  const hasStructured = bp.subject || bp.setting || bp.mood || bp.vendor_ref || bp.alt_text;

  const fields = [];
  if (bp.subject)    fields.push(`<div class="bp-field"><span class="bp-field-label">Subject</span><p class="bp-field-text">${escapeHTML(bp.subject)}</p></div>`);
  if (bp.setting)    fields.push(`<div class="bp-field"><span class="bp-field-label">Setting</span><p class="bp-field-text">${escapeHTML(bp.setting)}</p></div>`);
  if (bp.mood)       fields.push(`<div class="bp-field"><span class="bp-field-label">Mood</span><p class="bp-field-text">${escapeHTML(bp.mood)}</p></div>`);
  if (bp.vendor_ref) fields.push(`<div class="bp-field"><span class="bp-field-label">Vendor Ref</span><p class="bp-field-text ${isVendorRef ? "bp-vendor-yes" : "bp-vendor-no"}">${escapeHTML(bp.vendor_ref)}</p></div>`);
  if (bp.alt_text)   fields.push(`<div class="bp-field"><span class="bp-field-label">Alt Text</span><p class="bp-field-text bp-alt">${escapeHTML(bp.alt_text)}</p></div>`);
  if (bp.prompt)     fields.push(`<div class="bp-field"><span class="bp-field-label">Prompt</span><pre class="img-prompt-text">${escapeHTML(bp.prompt)}</pre></div>`);

  let usageHTML = "";
  if (showUsage) {
    const uses = Object.entries(imageState.assignments)
      .filter(([, asgn]) => asgn.images.includes(imgId))
      .map(([title]) => ({ title, label: getLabelByTitle(title) }));
    if (uses.length) {
      usageHTML = `<div class="img-lib-usage">
        <span class="img-usage-label">Used in</span>
        <div class="chips">${uses.map(({ title, label }) =>
          `<span class="chip chip-img-usage" title="${escapeHTML(title)}">${escapeHTML(label)}</span>`
        ).join("")}</div>
      </div>`;
    }
  }

  const imageHTML = bp.image_url
    ? `<a class="bp-image-link" href="${escapeHTML(bp.image_url)}" target="_blank" rel="noopener">
        <img class="bp-image" src="${escapeHTML(bp.image_url)}" alt="${escapeHTML(bp.alt_text || imgId)}" loading="lazy"
          onerror="this.closest('.bp-image-wrap').classList.add('bp-image-missing')">
       </a>`
    : "";

  return `
    <div class="img-prompt-card">
      <div class="img-prompt-header">
        <span class="chip chip-img chip-img-loaded">${escapeHTML(imgId)}</span>
        ${bp.shot_type ? `<span class="img-type-badge">${escapeHTML(bp.shot_type)}</span>` : ""}
        ${bp.status    ? `<span class="img-status-badge">${escapeHTML(bp.status.replace(/_/g, " "))}</span>` : ""}
        <button class="btn-mini" style="margin-left:auto" data-copyimgcard="${escapeHTML(imgId)}" data-imgusage="${showUsage}">Copy Card</button>
      </div>
      ${imageHTML ? `<div class="bp-image-wrap">${imageHTML}</div>` : ""}
      ${usageHTML}
      ${fields.join("")}
    </div>`;
}

/* Wire Copy Card buttons inside a container. */
function wireBlueprintCopyEvents(container) {
  container.querySelectorAll("[data-copyimgcard]").forEach(btn => {
    btn.addEventListener("click", () => {
      const includeUsage = btn.dataset.imgusage === "true";
      const text = buildBlueprintCopyText(btn.dataset.copyimgcard, includeUsage);
      copyToClipboard(text, btn, "Copy Card");
    });
  });
}

/* Build the image row HTML for a card (returns empty string when no assignment).
 * Blueprint cards are always rendered inline — no toggle. */
function buildImageRow(cardId, asgn) {
  const chips = asgn.images.map(id => {
    const loaded = !!imageState.blueprints[id];
    return `<span class="chip chip-img${loaded ? " chip-img-loaded" : ""}">${escapeHTML(id)}</span>`;
  }).join("");

  const hasBlueprints = asgn.images.some(id => imageState.blueprints[id]);
  const blueprintsHTML = hasBlueprints
    ? `<div class="img-inline-blueprints">${asgn.images.map(id => buildBlueprintCardHTML(id, false)).join("")}</div>`
    : "";

  return `
    <div class="img-row">
      <div class="img-row-top">
        <span class="field-label">Images</span>
        <div class="chips">${chips}</div>
      </div>
      ${asgn.image_logic ? `<p class="img-logic">${escapeHTML(asgn.image_logic)}</p>` : ""}
      ${blueprintsHTML}
    </div>`;
}

/* Render the full Image Library section at the bottom of the page. */
function renderImageLibrary() {
  const container = $("#image-library");

  const hasBp = Object.keys(imageState.blueprints).length > 0;
  const hasAsgn = Object.keys(imageState.assignments).length > 0;

  if (!hasBp && !hasAsgn) {
    container.style.display = "none";
    return;
  }
  container.style.display = "";

  // Build usage map: IMG ID → list of deliverable titles that reference it
  const usage = {};
  Object.entries(imageState.assignments).forEach(([title, asgn]) => {
    asgn.images.forEach(id => {
      (usage[id] = usage[id] || []).push(title);
    });
  });

  // All IMG IDs from both sources, numerically sorted
  const allIds = [...new Set([
    ...Object.keys(imageState.blueprints),
    ...Object.values(imageState.assignments).flatMap(a => a.images)
  ])].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ""), 10) || 0;
    const nb = parseInt(b.replace(/\D/g, ""), 10) || 0;
    return na !== nb ? na - nb : a.localeCompare(b);
  });

  const meta = imageState.meta;
  const campaign = meta.campaign || "";

  const libCards = allIds.map(id => buildBlueprintCardHTML(id, true)).join("");

  container.innerHTML = `
    <div class="section-head">
      <h2 class="section-title">Image Library</h2>
      <span class="section-count">${allIds.length}</span>
      ${campaign ? `<span class="img-lib-campaign">${escapeHTML(campaign)}</span>` : ""}
    </div>
    ${meta.blocker ? `<div class="img-blocker">${escapeHTML(meta.blocker)}</div>` : ""}
    <div class="img-library-grid">${libCards}</div>
  `;

  wireBlueprintCopyEvents(container);
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
  buildDeliverableLabelMap();
  applyMetaToHeader();
  renderStats();
  renderSections();
  renderImageLibrary();
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
  const asgn = getImageAssignment(d.deliverable);
  const imgRow = asgn ? buildImageRow(d.id, asgn) : "";
  const label = getDeliverableLabel(d);

  return `
  <article class="card" data-id="${d.id}">
    <div class="card-top">
      <span class="badge ${priorityClass(d.priority)}">${escapeHTML(d.priority)}</span>
      ${label ? `<span class="card-del-label">${escapeHTML(label)}</span>` : ""}
      ${statusSelect(d)}
    </div>

    <h3 class="card-title">${escapeHTML(d.deliverable)}</h3>
    ${d.deliverable_type ? `<div class="card-type">${escapeHTML(d.deliverable_type)}</div>` : ""}
    ${d.url ? `<a class="card-url" href="https://${d.url.replace(/^https?:\/\//, "")}" target="_blank" rel="noopener">${escapeHTML(d.url)}</a>` : ""}

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

    ${imgRow}

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
  // Blueprint Copy Card buttons (inside inline blueprint cards)
  const bpBtn = e.target.closest("[data-copyimgcard]");
  if (bpBtn) {
    const includeUsage = bpBtn.dataset.imgusage === "true";
    const text = buildBlueprintCopyText(bpBtn.dataset.copyimgcard, includeUsage);
    copyToClipboard(text, bpBtn, "Copy Card");
    return;
  }

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
  if (d.url) lines.push(d.url);
  lines.push("");
  lines.push("Angle:");
  lines.push(d.angle);
  if (d.seo_focus.length) { lines.push(""); lines.push("SEO:"); lines.push(d.seo_focus.join(", ")); }
  if (d.geo_focus.length) { lines.push(""); lines.push("GEO:"); d.geo_focus.forEach(g => lines.push(g)); }
  if (d.aeo_focus.length) { lines.push(""); lines.push("AEO:"); d.aeo_focus.forEach(a => lines.push(a)); }
  lines.push(""); lines.push("Context:"); lines.push(d.context_blueprint);
  if (d.notes) { lines.push(""); lines.push("Notes:"); lines.push(d.notes); }

  // Append image blueprints if any are assigned and loaded
  const asgn = getImageAssignment(d.deliverable);
  if (asgn && asgn.images.length) {
    const bpTexts = asgn.images
      .map(imgId => buildBlueprintCopyText(imgId, false))
      .filter(t => !t.includes("No blueprint loaded"));
    if (bpTexts.length) {
      lines.push("");
      lines.push("— Image Blueprints —");
      bpTexts.forEach((bp, i) => {
        if (i > 0) lines.push("");
        lines.push(bp);
      });
    }
  }

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
      <label class="ed ed-full">URL
        <input type="text" data-f="url" value="${escapeHTML(d.url || "")}">
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
    notes: get("notes").trim(),
    url: get("url").trim()
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
  if (!confirm("Clear the dashboard? This wipes all deliverables, image blueprints, and saved changes.")) return;
  state = { meta: {}, deliverables: [] };
  imageState = { meta: {}, assignments: {}, blueprints: {} };
  try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
  try { localStorage.removeItem(CONFIG.imageStorageKey); } catch (e) {}
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

  // Image blueprints import.
  $("#btn-img-import").addEventListener("click", () => importImageBlueprints($("#img-import-box").value));
  $("#btn-img-clear").addEventListener("click", () => {
    if (!confirm("Clear all image blueprints and assignments?")) return;
    imageState = { meta: {}, assignments: {}, blueprints: {} };
    saveImages();
    renderSections();
    renderImageLibrary();
    showMessage("Image blueprints cleared.", "info");
  });

  // Filters (live).
  ["#filter-search", "#filter-platform", "#filter-priority", "#filter-status"].forEach(sel => {
    const el = $(sel);
    el.addEventListener("input", renderSections);
    el.addEventListener("change", renderSections);
  });

  // Load saved data if present.
  load();
  loadImages();
  render();
}

document.addEventListener("DOMContentLoaded", init);
