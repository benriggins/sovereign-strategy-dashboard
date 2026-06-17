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
    "Solutions Hub | Pillar",
    "Solutions Hub | Blog",
    "Industries Hub | Pillar",
    "Industries Hub | Application",
    "Products Hub | Pillar",
    "Products Hub | Product Page",
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

Website (use these for all web pages):
* Solutions Hub | Pillar
* Solutions Hub | Blog
* Industries Hub | Pillar
* Industries Hub | Application
* Products Hub | Pillar
* Products Hub | Product Page

Social / Video:
* YouTube / NotebookLM Video
* Instagram Video
* Instagram Carousel
* LinkedIn Carousel
* LinkedIn James Post
* LinkedIn LibertyCES Post
* LinkedIn Newsletter

Legacy (accepted but prefer hub platforms above for web):
* Webpage
* Product Page
* Blog

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
  "Solutions Hub | Pillar":       "Sol Pillar",
  "Solutions Hub | Blog":         "Sol Blog",
  "Industries Hub | Pillar":      "Ind Pillar",
  "Industries Hub | Application": "Ind App",
  "Products Hub | Pillar":        "Prod Pillar",
  "Products Hub | Product Page":  "Prod Page",
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

/* =========================================================================
 * Website Hub Configuration
 * ========================================================================= */

const WEBSITE_HUB_CONFIG = [
  {
    name: "Solutions Hub",
    pillarPlatforms: new Set(["Solutions Hub | Pillar"]),
    platforms: new Set(["Solutions Hub | Pillar", "Solutions Hub | Blog", "Webpage", "Blog"])
  },
  {
    name: "Industries Hub",
    pillarPlatforms: new Set(["Industries Hub | Pillar"]),
    platforms: new Set(["Industries Hub | Pillar", "Industries Hub | Application"])
  },
  {
    name: "Products Hub",
    pillarPlatforms: new Set(["Products Hub | Pillar"]),
    platforms: new Set(["Products Hub | Pillar", "Products Hub | Product Page", "Product Page"])
  }
];

const WEBSITE_PLATFORMS = new Set(
  WEBSITE_HUB_CONFIG.flatMap(h => [...h.platforms])
);

function getHubForPlatform(platform) {
  for (const hub of WEBSITE_HUB_CONFIG) {
    if (hub.platforms.has(platform)) return hub.name;
  }
  return null;
}

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

  // Parse deliverables array → image assignments
  // Supports two images formats:
  //   • New: array of blueprint objects { id, seo_filename, shot_type, … }
  //   • Old: array of IMG-ID strings or a space/comma-separated string
  if (Array.isArray(parsed.deliverables)) {
    parsed.deliverables.forEach(d => {
      if (!d || !d.deliverable || !d.images) return;
      const title = d.deliverable.trim();

      if (Array.isArray(d.images) && d.images.length > 0 &&
          typeof d.images[0] === "object" && d.images[0] !== null) {
        // New embedded format: each element is a full blueprint object.
        // Key blueprints by seo_filename (unique per physical image) so the
        // same GCS photo doesn't create duplicate blueprint records.
        const keys = [];
        d.images.forEach(imgObj => {
          if (!imgObj || !imgObj.id) return;
          const displayId   = String(imgObj.id).trim();
          const seoFilename = (imgObj.seo_filename || "").trim();
          const bpKey       = seoFilename || displayId;
          keys.push(bpKey);
          const vendorRefStr = (imgObj.vendor_ref || "").trim();
          const isVendorRef  = vendorRefStr.toLowerCase().startsWith("yes");
          const existing     = imageState.blueprints[bpKey];
          blueprints[bpKey] = {
            id:           displayId,   // friendly label e.g. "IMG-01", "IMG-LC-03"
            caption:      (imgObj.alt_text  || "").trim(),
            type:         (imgObj.shot_type || "").trim(),
            status:       isVendorRef ? "needs_reference" : "ready",
            prompt:       (imgObj.prompt    || "").trim(),
            shot_type:    (imgObj.shot_type || "").trim(),
            subject:      (imgObj.subject   || "").trim(),
            setting:      (imgObj.setting   || "").trim(),
            mood:         (imgObj.mood      || "").trim(),
            vendor_ref:   vendorRefStr,
            alt_text:     (imgObj.alt_text  || "").trim(),
            seo_filename: seoFilename,
            image_url:    (existing && existing.image_url) || ""
          };
        });
        if (keys.length) {
          assignments[title] = {
            images: keys,
            image_logic: (d.image_logic || "").trim()
          };
        }
        return;
      }

      // Old format: string or array of IMG-ID strings.
      const rawImgs = typeof d.images === "string"
        ? d.images.split(/[\s,]+/)
        : (Array.isArray(d.images) ? d.images : []);
      const imgs = rawImgs.map(s => String(s).trim()).filter(s => /^IMG-/i.test(s));
      if (imgs.length) {
        assignments[title] = {
          images: imgs,
          image_logic: (d.image_logic || "").trim()
        };
      }
    });
  }

  // Parse blueprints array → full structured format
  if (Array.isArray(parsed.blueprints)) {
    parsed.blueprints.forEach(d => {
      if (!d || !d.id) return;
      const id = d.id.trim();
      const vendorRefStr = (d.vendor_ref || "").trim();
      const isVendorRef = vendorRefStr.toLowerCase().startsWith("yes");
      const existing = imageState.blueprints[id];
      blueprints[id] = {
        id,
        caption:      (d.alt_text   || d.caption || "").trim(),
        type:         (d.shot_type  || d.type    || "").trim(),
        status:       d.status ? d.status.trim() : (isVendorRef ? "needs_reference" : "ready"),
        prompt:       (d.prompt     || "").trim(),
        shot_type:    (d.shot_type  || "").trim(),
        subject:      (d.subject    || "").trim(),
        setting:      (d.setting    || "").trim(),
        mood:         (d.mood       || "").trim(),
        vendor_ref:   vendorRefStr,
        alt_text:     (d.alt_text   || "").trim(),
        seo_filename: (d.seo_filename || "").trim(),
        image_url:    (existing && existing.image_url) || ""
      };
    });
  }

  // Parse meta.image_library → structured blueprint dict (IMG-01: { shot_type, subject, ... })
  const imgLib = parsed.meta && parsed.meta.image_library;
  if (imgLib && typeof imgLib === "object" && !Array.isArray(imgLib)) {
    Object.entries(imgLib).forEach(([id, d]) => {
      if (!id || typeof d !== "object") return;
      const vendorRefStr = (d.vendor_ref || "").trim();
      const isVendorRef = vendorRefStr.toLowerCase().startsWith("yes");
      // Preserve any image_url already set by a manual GCS paste — never overwrite it from the packet
      const existing = imageState.blueprints[id];
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
        seo_filename: (d.seo_filename || "").trim(),
        image_url:    (existing && existing.image_url) || ""
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

/* Extract the filename slug from a GCS URL.
 * https://.../axeon-fst-industrial-process-water-skid-libertyces.webp → axeon-fst-... */
function extractFilenameSlug(url) {
  const m = url.trim().match(/\/([^\/]+)\.[^.\/]+$/);
  return m ? m[1] : "";
}

/* Token-based Jaccard similarity between seo_filename slug and a GCS file slug.
 * Handles cases where the uploaded filename has extra words (e.g. "open-housing" vs "housing"). */
function slugMatchScore(seoFilename, gcsSlug) {
  if (!seoFilename || !gcsSlug) return 0;
  if (seoFilename === gcsSlug) return 1.0;
  const seoToks = new Set(seoFilename.toLowerCase().split(/-+/).filter(Boolean));
  const gcsToks = new Set(gcsSlug.toLowerCase().split(/-+/).filter(Boolean));
  let inter = 0;
  seoToks.forEach(t => { if (gcsToks.has(t)) inter++; });
  const union = new Set([...seoToks, ...gcsToks]).size;
  return union ? inter / union : 0;
}

/* Set a GCS URL on a blueprint card — shared by paste-box import and inline card inputs. */
function setBlueprintUrl(imgId, url) {
  const bp = imageState.blueprints[imgId];
  if (!bp) return;
  bp.image_url = url;
  saveImages();
  buildDeliverableLabelMap();
  renderSections();
  renderImageLibrary();
}

function importGCSUrls(raw) {
  const urls = raw.split(/\n/).map(s => s.trim()).filter(Boolean);
  if (!urls.length) { showMessage("Paste at least one GCS URL.", "warn"); return; }

  let matched = 0;
  let fuzzyCount = 0;
  const bpList = Object.values(imageState.blueprints).filter(b => b.seo_filename);

  urls.forEach(url => {
    const slug = extractFilenameSlug(url);
    if (!slug) return;

    // 1. Exact match
    let bp = bpList.find(b => b.seo_filename === slug);

    // 2. Fuzzy match — pick highest-scoring candidate at or above threshold
    if (!bp) {
      let bestScore = 0;
      bpList.forEach(b => {
        const score = slugMatchScore(b.seo_filename, slug);
        if (score > bestScore && score >= 0.7) { bestScore = score; bp = b; }
      });
      if (bp) fuzzyCount++;
    }

    if (bp) { bp.image_url = url; matched++; }
  });

  if (matched) {
    saveImages();
    buildDeliverableLabelMap();
    renderSections();
    renderImageLibrary();
  }
  const fuzzyNote = fuzzyCount ? ` (${fuzzyCount} fuzzy-matched by slug similarity)` : "";
  showMessage(
    `${matched} of ${urls.length} URL${urls.length === 1 ? "" : "s"} matched to blueprint cards${fuzzyNote}.`,
    matched ? "success" : "warn"
  );
  if (matched) $("#gcs-url-box").value = "";
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

  const displayId = bp.id || imgId;
  const lines = [];
  lines.push(`[${displayId}]${bp.shot_type ? " — " + bp.shot_type : ""}`);
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

  const gcsFilename = bp.image_url ? bp.image_url.split("/").pop() : "";
  const imageHTML = bp.image_url
    ? `<div class="bp-image-wrap">
         <a class="bp-image-link" href="${escapeHTML(bp.image_url)}" target="_blank" rel="noopener">
           <img class="bp-image" src="${escapeHTML(bp.image_url)}" alt="${escapeHTML(bp.alt_text || imgId)}" loading="lazy"
             onerror="this.closest('.bp-image-wrap').classList.add('bp-image-missing')">
         </a>
       </div>
       <div class="bp-image-url-row">
         <span class="bp-field-label">GCS</span>
         <a class="bp-image-url" href="${escapeHTML(bp.image_url)}" target="_blank" rel="noopener" title="${escapeHTML(bp.image_url)}">${escapeHTML(gcsFilename)} ↗</a>
       </div>`
    : "";

  const slugRow = bp.seo_filename
    ? `<div class="bp-slug-row">
         <span class="bp-field-label">Slug</span>
         <code class="bp-slug-code">${escapeHTML(bp.seo_filename)}</code>
       </div>`
    : "";

  const urlEditRow = `
    <div class="bp-url-edit-row">
      <input class="bp-url-input" type="url"
        placeholder="Paste GCS URL to link this card…"
        data-urlimgid="${escapeHTML(imgId)}"
        value="${escapeHTML(bp.image_url || "")}">
      <button class="btn-mini btn-mini-set" data-setimgurl="${escapeHTML(imgId)}">${bp.image_url ? "Replace" : "Set URL"}</button>
      ${bp.image_url ? `<button class="btn-mini btn-mini-rm" data-rmimgurl="${escapeHTML(imgId)}" title="Remove GCS link">✕</button>` : ""}
    </div>`;

  return `
    <div class="img-prompt-card">
      <div class="img-prompt-header">
        <span class="chip chip-img chip-img-loaded">${escapeHTML(bp.id || imgId)}</span>
        ${bp.shot_type ? `<span class="img-type-badge">${escapeHTML(bp.shot_type)}</span>` : ""}
        ${bp.status    ? `<span class="img-status-badge">${escapeHTML(bp.status.replace(/_/g, " "))}</span>` : ""}
        <button class="btn-mini" style="margin-left:auto" data-copyimgcard="${escapeHTML(imgId)}" data-imgusage="${showUsage}">Copy Card</button>
      </div>
      ${imageHTML}
      ${slugRow}
      ${usageHTML}
      ${fields.join("")}
      ${urlEditRow}
    </div>`;
}

/* Wire blueprint card buttons (Copy Card + inline URL set/remove) inside a container. */
function wireBlueprintCopyEvents(container) {
  container.querySelectorAll("[data-copyimgcard]").forEach(btn => {
    btn.addEventListener("click", () => {
      const includeUsage = btn.dataset.imgusage === "true";
      const text = buildBlueprintCopyText(btn.dataset.copyimgcard, includeUsage);
      copyToClipboard(text, btn, "Copy Card");
    });
  });
  container.querySelectorAll("[data-setimgurl]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.setimgurl;
      const input = btn.closest(".bp-url-edit-row")?.querySelector(`[data-urlimgid="${id}"]`);
      const url = input ? input.value.trim() : "";
      if (!url) { showMessage("Paste a GCS URL first.", "warn"); return; }
      setBlueprintUrl(id, url);
      showMessage(`GCS URL set for ${id}.`, "success");
    });
  });
  container.querySelectorAll("[data-rmimgurl]").forEach(btn => {
    btn.addEventListener("click", () => {
      setBlueprintUrl(btn.dataset.rmimgurl, "");
      showMessage(`GCS URL removed from ${btn.dataset.rmimgurl}.`, "success");
    });
  });
}

/* Build the image row HTML for a card (returns empty string when no assignment).
 * Blueprint cards are always rendered inline — no toggle. */
function buildImageRow(cardId, asgn) {
  const chips = asgn.images.map(id => {
    const bp = imageState.blueprints[id];
    const label = bp ? (bp.id || id) : id;
    return `<span class="chip chip-img${bp ? " chip-img-loaded" : ""}">${escapeHTML(label)}</span>`;
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
    const bpA = imageState.blueprints[a];
    const bpB = imageState.blueprints[b];
    const sa = (bpA && bpA.id) ? bpA.id : a;
    const sb = (bpB && bpB.id) ? bpB.id : b;
    const na = parseInt(sa.replace(/\D/g, ""), 10) || 0;
    const nb = parseInt(sb.replace(/\D/g, ""), 10) || 0;
    return na !== nb ? na - nb : sa.localeCompare(sb);
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

  if (state.deliverables.length === 0) {
    container.innerHTML = "";
    $("#empty-state").style.display = "";
    $("#no-results").style.display = "none";
    return;
  }
  $("#empty-state").style.display = "none";

  // Partition filtered items into website hub items vs everything else.
  const hasWebsiteInState = state.deliverables.some(d => getHubForPlatform(d.platform) !== null);
  const filteredWebsite = filtered.filter(d => getHubForPlatform(d.platform) !== null);
  const filteredOther = filtered.filter(d => getHubForPlatform(d.platform) === null);

  // Build non-website platform groups (CONFIG order, Other last).
  const nonWebsitePlatforms = CONFIG.platforms.filter(p => !WEBSITE_PLATFORMS.has(p));
  const order = [...nonWebsitePlatforms, OTHER_SECTION];
  const groups = {};
  filteredOther.forEach(d => {
    const key = CONFIG.platforms.includes(d.platform) && !WEBSITE_PLATFORMS.has(d.platform)
      ? d.platform : OTHER_SECTION;
    (groups[key] = groups[key] || []).push(d);
  });
  const hasOtherResults = order.some(p => groups[p]?.length);

  if (!hasWebsiteInState && !hasOtherResults) {
    container.innerHTML = "";
    $("#no-results").style.display = "";
    return;
  }
  $("#no-results").style.display = "none";

  const parts = [];
  if (hasWebsiteInState) parts.push(renderWebsiteSection(filteredWebsite));
  order.filter(p => groups[p]?.length).forEach(p => parts.push(renderSection(p, groups[p])));

  container.innerHTML = parts.join("");
  wireCardEvents(container);
  wireHubToggles(container);
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

function renderWebsiteSection(filteredItems) {
  const hubsHTML = WEBSITE_HUB_CONFIG.map(hub => {
    const hubItems = filteredItems.filter(d => hub.platforms.has(d.platform));
    const pillarItems = hubItems.filter(d => hub.pillarPlatforms.has(d.platform));
    const supportItems = hubItems.filter(d => !hub.pillarPlatforms.has(d.platform));
    return renderHubGroup(hub.name, pillarItems, supportItems);
  }).join("");

  return `
    <section class="platform-section website-super-section">
      <div class="section-head">
        <h2 class="section-title">Website &amp; Webpages</h2>
      </div>
      <div class="hub-groups">${hubsHTML}</div>
    </section>
  `;
}

function renderHubGroup(hubName, pillarItems, supportItems) {
  const total = pillarItems.length + supportItems.length;
  const hubId = hubName.toLowerCase().replace(/\s+/g, "-");
  const pillarTitle = pillarItems.length ? pillarItems[0].deliverable : "";

  let bodyHTML;
  if (total === 0) {
    bodyHTML = `<div class="hub-empty">No content planned for this hub yet.</div>`;
  } else {
    const pillarSection = pillarItems.length ? `
      <div class="hub-pillar-section">
        <div class="hub-pillar-label">
          <span class="hub-pillar-tag">Pillar</span>
          <div class="hub-pillar-rule"></div>
        </div>
        <div class="hub-pillar-card-wrap">
          ${pillarItems.map(renderCard).join("")}
        </div>
      </div>` : "";

    const supportSection = supportItems.length ? `
      <div class="hub-support-section">
        ${pillarItems.length ? `<div class="hub-support-label">Supporting Pages</div>` : ""}
        <div class="card-grid">${supportItems.map(renderCard).join("")}</div>
      </div>` : "";

    bodyHTML = pillarSection + supportSection;
  }

  return `
    <div class="hub-group" data-hub="${escapeHTML(hubId)}">
      <div class="hub-header" data-toggle-hub="${escapeHTML(hubId)}">
        <span class="hub-collapse-icon">▾</span>
        <span class="hub-name">${escapeHTML(hubName)}</span>
        ${total ? `<span class="hub-count">${total}</span>` : `<span class="hub-count hub-count-empty">0</span>`}
        ${pillarTitle ? `<span class="hub-pillar-name">${escapeHTML(pillarTitle)}</span>` : ""}
      </div>
      <div class="hub-body" data-hub-body="${escapeHTML(hubId)}">
        ${bodyHTML}
      </div>
    </div>
  `;
}

function wireHubToggles(container) {
  container.querySelectorAll("[data-toggle-hub]").forEach(header => {
    header.addEventListener("click", () => {
      const hubId = header.dataset.toggleHub;
      const group = container.querySelector(`.hub-group[data-hub="${hubId}"]`);
      if (group) group.classList.toggle("collapsed");
    });
  });
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

  // Inline blueprint URL set/remove buttons
  const setBtn = e.target.closest("[data-setimgurl]");
  if (setBtn) {
    const id = setBtn.dataset.setimgurl;
    const input = setBtn.closest(".bp-url-edit-row")?.querySelector(`[data-urlimgid="${id}"]`);
    const url = input ? input.value.trim() : "";
    if (!url) { showMessage("Paste a GCS URL first.", "warn"); return; }
    setBlueprintUrl(id, url);
    showMessage(`GCS URL set for ${id}.`, "success");
    return;
  }
  const rmBtn = e.target.closest("[data-rmimgurl]");
  if (rmBtn) {
    setBlueprintUrl(rmBtn.dataset.rmimgurl, "");
    showMessage(`GCS URL removed from ${rmBtn.dataset.rmimgurl}.`, "success");
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
  $("#btn-gcs-import").addEventListener("click", () => importGCSUrls($("#gcs-url-box").value));
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
