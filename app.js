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
      if (!d || !d.deliverable) return;
      if (!d.images && !d.primary_image) return;
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

      // primary_image: single IMG-ID string — Steps 8+9 combined format.
      if (!d.images && d.primary_image) {
        const imgId = String(d.primary_image).trim();
        if (/^IMG-/i.test(imgId)) {
          assignments[title] = {
            images: [imgId],
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

  // Root-level image_library array — Steps 8+9 combined format.
  // Array of { id, seo_filename, shot_type, vendor_ref, alt_text, status, subject, setting, mood, … }
  // Blueprints are keyed by IMG-ID (stable across this format).
  if (Array.isArray(parsed.image_library)) {
    parsed.image_library.forEach(d => {
      if (!d || !d.id) return;
      const id = String(d.id).trim();
      const vendorRefStr = (d.vendor_ref || "").trim();
      const isVendorRef = vendorRefStr.toLowerCase().startsWith("yes");
      const rawStatus = (d.status || "").trim().toLowerCase();
      const existing = imageState.blueprints[id];
      blueprints[id] = {
        id,
        caption:      (d.alt_text    || "").trim(),
        type:         (d.shot_type   || "").trim(),
        status:       rawStatus === "generate" ? "generate" : (isVendorRef ? "needs_reference" : "ready"),
        prompt:       (d.prompt      || "").trim(),
        shot_type:    (d.shot_type   || "").trim(),
        subject:      (d.subject     || "").trim(),
        setting:      (d.setting     || "").trim(),
        mood:         (d.mood        || "").trim(),
        vendor_ref:   vendorRefStr,
        alt_text:     (d.alt_text    || "").trim(),
        seo_filename: (d.seo_filename || "").trim(),
        image_url:    (existing && existing.image_url) || ""
      };
    });
  }

  if (!Object.keys(assignments).length && !Object.keys(blueprints).length) {
    throw new Error(
      "No image assignments or blueprints found. " +
      "Paste a packet with a \"deliverables\" array (with images or primary_image fields), " +
      "a root-level image_library array, a meta.image_library object, or a blueprints array."
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

  // Storyboard tab.
  initTabs();
  loadStoryboard();
  renderStoryboard();

  $("#btn-sb-import").addEventListener("click", () => {
    const raw = $("#sb-import-box").value.trim();
    if (!raw) { showMessage("Nothing to import.", "warn"); return; }
    const parsed = parseStoryboardPacket(raw);
    if (!parsed) return;
    storyboardState = parsed;
    saveStoryboard();
    renderStoryboard();
    const pairs = (parsed.segments || []).reduce((n, s) => n + (s.pairs || []).length, 0);
    showMessage(`Storyboard imported: ${pairs} pair${pairs !== 1 ? "s" : ""}${parsed.thumbnail ? " + thumbnail" : ""}.`, "success");
  });

  $("#btn-sb-clear").addEventListener("click", () => {
    if (!confirm("Clear the storyboard?")) return;
    storyboardState = null;
    try { localStorage.removeItem(STORYBOARD_STORAGE_KEY); } catch(e) {}
    $("#sb-import-box").value = "";
    renderStoryboard();
    showMessage("Storyboard cleared.", "info");
  });

  $("#btn-sb-copy-prompt").addEventListener("click", (e) =>
    copyToClipboard(STORYBOARD_CONVERSION_PROMPT, e.currentTarget, "Copy Conversion Prompt"));

  // Flow tab.
  loadFlow();
  renderFlow();

  $("#btn-fl-import").addEventListener("click", () => {
    const raw = $("#fl-import-box").value.trim();
    if (!raw) { showMessage("Nothing to import.", "warn"); return; }
    try {
      flowState = parseFlowPacket(raw);
      saveFlow();
      renderFlow();
      const clips = (flowState.batches || []).reduce((n, b) => n + (b.clips || []).length, 0);
      const batches = (flowState.batches || []).length;
      showMessage(`Flow packet imported: ${batches} batch${batches !== 1 ? "es" : ""}, ${clips} clip${clips !== 1 ? "s" : ""}.`, "success");
    } catch(err) {
      showMessage("Could not parse Flow packet — check the JSON format.", "error");
    }
  });

  $("#btn-fl-clear").addEventListener("click", () => {
    if (!confirm("Clear the Flow packet?")) return;
    flowState = null;
    try { localStorage.removeItem(FLOW_STORAGE_KEY); } catch(e) {}
    $("#fl-import-box").value = "";
    renderFlow();
    showMessage("Flow packet cleared.", "info");
  });

  // TTS Script standalone
  loadFlowTTS();
  renderFlowTTS();
  $("#btn-fl-tts-import").addEventListener("click", () => {
    const raw = $("#fl-tts-box").value.trim();
    if (!raw) { showMessage("Nothing to import.", "warn"); return; }
    try {
      flowTTSState = JSON.parse(raw);
      saveFlowTTS();
      renderFlowTTS();
      showMessage("TTS script imported.", "success");
    } catch(err) {
      showMessage("Could not parse TTS script — check the JSON format.", "error");
    }
  });
  $("#btn-fl-tts-clear").addEventListener("click", () => {
    if (!confirm("Clear TTS script?")) return;
    flowTTSState = null;
    try { localStorage.removeItem(FLOW_TTS_KEY); } catch(e) {}
    $("#fl-tts-box").value = "";
    renderFlowTTS();
    showMessage("TTS script cleared.", "info");
  });

  // Title & Description standalone
  loadFlowTitleDesc();
  renderFlowTitleDesc();
  $("#btn-fl-titledesc-import").addEventListener("click", () => {
    const raw = $("#fl-titledesc-box").value.trim();
    if (!raw) { showMessage("Nothing to import.", "warn"); return; }
    try {
      flowTitleDescState = JSON.parse(raw);
      saveFlowTitleDesc();
      renderFlowTitleDesc();
      showMessage("Title & description imported.", "success");
    } catch(err) {
      showMessage("Could not parse title & description — check the JSON format.", "error");
    }
  });
  $("#btn-fl-titledesc-clear").addEventListener("click", () => {
    if (!confirm("Clear title & description?")) return;
    flowTitleDescState = null;
    try { localStorage.removeItem(FLOW_TITLEDESC_KEY); } catch(e) {}
    $("#fl-titledesc-box").value = "";
    renderFlowTitleDesc();
    showMessage("Title & description cleared.", "info");
  });
}

/* =========================================================================
 * Storyboard Tab — Step 12 YouTube Storyboard parser + renderer
 * ========================================================================= */

const STORYBOARD_STORAGE_KEY = "sovereign_strategy_storyboard_v1";

const STORYBOARD_CONVERSION_PROMPT = `Convert the Step 12 YouTube Storyboard output I'm about to paste into the SOVEREIGN_STORYBOARD_V1 JSON format below. Preserve every field verbatim — do not summarize, shorten, or rewrite any instruction, subject, camera, env, file, or alt text. Every word must be copied exactly as written.

Output ONLY the JSON wrapped in:
BEGIN_SOVEREIGN_STORYBOARD_V1
{ ... }
END_SOVEREIGN_STORYBOARD_V1

JSON structure:

{
  "meta": {
    "client": "LibertyCES",
    "project": "",
    "title": "",
    "runtime": "",
    "total_pairs": 0
  },
  "segments": [
    {
      "segment": 1,
      "name": "Segment name (remove leading number and em-dash if present)",
      "timecode": "0:00–0:20",
      "voiceover": "Full voiceover text verbatim — every word.",
      "pairs": [
        {
          "n": 1,
          "image": {
            "id": "IMAGE-01",
            "style": "C",
            "ref": null,
            "timecode": "0:00–0:10",
            "subject": "Verbatim subject line from the storyboard",
            "env": "Verbatim env line",
            "camera": "Verbatim camera line",
            "video_prompt": {
              "ingredient_role": "Verbatim INGREDIENT ROLE text — or null if WITHOUT REF",
              "cinematography": "Verbatim CINEMATOGRAPHY instruction",
              "subject_action": "Verbatim SUBJECT & ACTION instruction",
              "environment_lighting": "Verbatim ENVIRONMENT & LIGHTING instruction",
              "constraints": "Verbatim CONSTRAINTS instruction"
            },
            "file": "exact-filename-as-listed.jpg",
            "alt": "Verbatim alt text"
          },
          "anim": {
            "id": "ANIM-01",
            "instruction": "Verbatim full animation instruction — every word"
          }
        }
      ]
    }
  ],
  "thumbnail": {
    "style": "A",
    "ref": "AXEON FSD",
    "subject": "Verbatim subject",
    "prompt": "Verbatim full prompt",
    "avoid": "Verbatim avoid",
    "file": "exact-filename.jpg",
    "alt": "Verbatim alt text",
    "overlay": {
      "text": "IT LOOKED FINE.",
      "placement": "Verbatim placement instruction",
      "size": "Verbatim size instruction",
      "weight": "Verbatim weight instruction",
      "color": "Verbatim color instruction",
      "treatment": "Verbatim treatment instruction"
    },
    "verify": "Verbatim verify line"
  }
}

Field rules:
• "style" → single letter only: "A", "B", "C", or "D"
• "ref" → null if WITHOUT REF; the product name string if WITH REF (e.g. "AXEON FSD", "AXEON FST")
• "segment" → integer (1, 2, 3…)
• "n" → pair index integer
• "video_prompt.ingredient_role" → null if WITHOUT REF; verbatim ingredient role text if WITH REF
• The 5 video_prompt fields map to the 5 numbered sections in the Step 12 output: Ingredient Role, Cinematography, Subject & Action, Environment & Lighting, Constraints
• Every text field → verbatim from the source, nothing rewritten
• No commentary, no explanation — output only the wrapped JSON packet`;

let storyboardState = null;

// Copy-text registry: avoids giant data-* attributes for long prompt text.
const sbCopyRegistry = {};
let sbCopySeq = 0;

function sbRegister(text) {
  const key = "sbc_" + (++sbCopySeq);
  sbCopyRegistry[key] = text;
  return key;
}

function saveStoryboard() {
  if (!storyboardState) return;
  try { localStorage.setItem(STORYBOARD_STORAGE_KEY, JSON.stringify(storyboardState)); } catch(e) {}
}

function loadStoryboard() {
  try {
    const raw = localStorage.getItem(STORYBOARD_STORAGE_KEY);
    if (raw) storyboardState = JSON.parse(raw);
  } catch(e) {}
}

function parseStoryboardPacket(text) {
  const raw = text.trim();
  const match = raw.match(/BEGIN_SOVEREIGN_STORYBOARD_V1\s*([\s\S]*?)\s*END_SOVEREIGN_STORYBOARD_V1/);
  const jsonText = match ? match[1].trim() : raw;
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch(e) {
    showMessage("Could not parse storyboard JSON — check the format.", "error");
    return null;
  }
  if (!parsed.segments && !parsed.thumbnail) {
    showMessage("No segments or thumbnail found in this packet.", "error");
    return null;
  }
  return parsed;
}

/* ---- Copy text builders ---- */

function sbImageCopyFull(img) {
  const refLabel = img.ref ? `With Ref — ${img.ref}` : "Without Ref";
  const lines = [`${img.id || "IMAGE"} | Style ${img.style || "?"} | ${refLabel}${img.timecode ? " | " + img.timecode : ""}`];
  if (img.subject) lines.push(`\nSUBJECT\n${img.subject}`);
  if (img.env)     lines.push(`\nENV\n${img.env}`);
  if (img.camera)  lines.push(`\nCAMERA\n${img.camera}`);
  const vp = img.video_prompt;
  if (vp && typeof vp === "object") {
    if (vp.ingredient_role)      lines.push(`\n[IMAGE INGREDIENT ROLE]\n${vp.ingredient_role}`);
    if (vp.cinematography)       lines.push(`\n[CINEMATOGRAPHY]\n${vp.cinematography}`);
    if (vp.subject_action)       lines.push(`\n[SUBJECT & ACTION]\n${vp.subject_action}`);
    if (vp.environment_lighting) lines.push(`\n[ENVIRONMENT & LIGHTING]\n${vp.environment_lighting}`);
    if (vp.constraints)          lines.push(`\n[CONSTRAINTS]\n${vp.constraints}`);
  } else {
    if (img.prompt) lines.push(`\nPROMPT\n${img.prompt}`);
    if (img.avoid)  lines.push(`\nAVOID\n${img.avoid}`);
  }
  if (img.file) lines.push(`\nFILE\n${img.file}`);
  if (img.alt)  lines.push(`\nALT\n${img.alt}`);
  return lines.join("\n");
}

function sbVPSection(label, text) {
  if (!text) return "";
  return `[${label}]: ${text}\n\n`;
}

function sbImageCopyFlow(img) {
  const vp = img.video_prompt;
  if (!vp || typeof vp !== "object") {
    let text = img.prompt || "";
    if (img.avoid) text += `\n\nAVOID: ${img.avoid}`;
    return text;
  }
  let out = "";
  out += sbVPSection("IMAGE INGREDIENT ROLE", vp.ingredient_role);
  out += sbVPSection("CINEMATOGRAPHY", vp.cinematography);
  out += sbVPSection("SUBJECT & ACTION", vp.subject_action);
  out += sbVPSection("ENVIRONMENT & LIGHTING", vp.environment_lighting);
  out += sbVPSection("CONSTRAINTS", vp.constraints);
  return out.trimEnd();
}

function sbImageCopyPrompt(img) {
  return sbImageCopyFlow(img);
}

function sbAnimCopyText(anim, imgId) {
  let text = anim.id || "ANIM";
  if (imgId) text += ` → ${imgId}`;
  if (anim.instruction) text += `\n\n${anim.instruction}`;
  return text;
}

function sbThumbCopyFull(thumb) {
  const refLabel = thumb.ref ? `With Ref — ${thumb.ref}` : "Without Ref";
  const lines = [`THUMBNAIL | Style ${thumb.style || "?"} | ${refLabel}`];
  if (thumb.subject) lines.push(`\nSUBJECT\n${thumb.subject}`);
  if (thumb.prompt)  lines.push(`\nPROMPT\n${thumb.prompt}`);
  if (thumb.avoid)   lines.push(`\nAVOID\n${thumb.avoid}`);
  if (thumb.file)    lines.push(`\nFILE\n${thumb.file}`);
  if (thumb.alt)     lines.push(`\nALT\n${thumb.alt}`);
  if (thumb.verify)  lines.push(`\nVERIFY\n${thumb.verify}`);
  if (thumb.overlay) {
    const ov = thumb.overlay;
    lines.push(`\nOVERLAY TEXT\n${ov.text || ""}`);
    if (ov.placement) lines.push(`Placement: ${ov.placement}`);
    if (ov.size)      lines.push(`Size: ${ov.size}`);
    if (ov.weight)    lines.push(`Weight: ${ov.weight}`);
    if (ov.color)     lines.push(`Color: ${ov.color}`);
    if (ov.treatment) lines.push(`Treatment: ${ov.treatment}`);
  }
  return lines.join("\n");
}

function sbThumbCopyPrompt(thumb) {
  let text = thumb.prompt || "";
  if (thumb.avoid) text += `\n\nAVOID: ${thumb.avoid}`;
  return text;
}

/* ---- HTML builders ---- */

function sbField(label, text, extraClass = "") {
  if (!text) return "";
  return `<div class="sb-field">
    <div class="sb-field-label">${escapeHTML(label)}</div>
    <div class="sb-field-text${extraClass ? " " + extraClass : ""}">${escapeHTML(text)}</div>
  </div>`;
}

function buildSBVPBlockHTML(colorClass, labelText, text, refBadge) {
  if (!text) return "";
  const copyKey = sbRegister(text);
  const refBadgeHTML = refBadge ? `<span class="sb-vp-ref-badge">${escapeHTML(refBadge)}</span>` : "";
  return `<div class="sb-vp-block ${colorClass}">
    <div class="sb-vp-block-header">
      <div><span class="sb-vp-label">${escapeHTML(labelText)}</span>${refBadgeHTML}</div>
      <button class="btn-mini" data-sbcopy="${copyKey}" data-label="Copy">Copy</button>
    </div>
    <div class="sb-vp-text">${escapeHTML(text)}</div>
  </div>`;
}

function buildSBVideoPromptColHTML(img) {
  const vp = img.video_prompt;
  if (!vp || typeof vp !== "object") return "";
  const flowKey = sbRegister(sbImageCopyFlow(img));
  return `<div class="sb-img-prompt-col">
    <button class="sb-copy-flow-btn" data-sbcopy="${flowKey}" data-label="Copy Full Prompt for Flow Agent">Copy Full Prompt for Flow Agent</button>
    ${buildSBVPBlockHTML("sb-vp-ingredient",    "Image Ingredient Role",   vp.ingredient_role,      img.ref || null)}
    ${buildSBVPBlockHTML("sb-vp-cinematography","Cinematography",          vp.cinematography,       null)}
    ${buildSBVPBlockHTML("sb-vp-subject",       "Subject & Action",        vp.subject_action,       null)}
    ${buildSBVPBlockHTML("sb-vp-env",           "Environment & Lighting",  vp.environment_lighting, null)}
    ${buildSBVPBlockHTML("sb-vp-constraints",   "Constraints",             vp.constraints,          null)}
  </div>`;
}

function buildSBImageCardHTML(img, pairN) {
  const id = img.id || `IMAGE-${pairN}`;
  const refLabel = img.ref ? `With Ref — ${img.ref}` : "Without Ref";
  const refClass = img.ref ? "sb-ref-yes" : "sb-ref-no";

  const fullKey = sbRegister(sbImageCopyFull(img));
  const flowKey = sbRegister(sbImageCopyFlow(img));

  const hasVP = img.video_prompt && typeof img.video_prompt === "object";

  const metaCol = `<div class="sb-img-meta-col">
    ${sbField("Subject", img.subject)}
    ${sbField("Env", img.env)}
    ${sbField("Camera", img.camera)}
    ${!hasVP ? sbField("Prompt", img.prompt, "sb-prompt") : ""}
    ${!hasVP && img.avoid ? sbField("Avoid", img.avoid, "sb-avoid") : ""}
    ${sbField("File", img.file, "sb-file")}
    ${sbField("Alt", img.alt)}
  </div>`;

  const body = hasVP
    ? `<div class="sb-img-card-inner">${metaCol}${buildSBVideoPromptColHTML(img)}</div>`
    : metaCol;

  return `<div class="sb-img-card">
    <div class="sb-img-header">
      <span class="sb-img-id">${escapeHTML(id)}</span>
      ${img.style ? `<span class="sb-badge sb-style-badge">Style ${escapeHTML(img.style)}</span>` : ""}
      <span class="sb-badge ${refClass}">${escapeHTML(refLabel)}</span>
      ${img.timecode ? `<span class="sb-img-timecode">${escapeHTML(img.timecode)}</span>` : ""}
    </div>
    ${body}
    <div class="sb-card-actions">
      <button class="btn-mini btn-primary" data-sbcopy="${flowKey}" data-label="Copy Flow Prompt">Copy Flow Prompt</button>
      <button class="btn-mini" data-sbcopy="${fullKey}" data-label="Copy Full Block">Copy Full Block</button>
    </div>
  </div>`;
}

function buildSBAnimCardHTML(anim, imgId, pairN) {
  const id = anim.id || `ANIM-${pairN}`;
  const copyKey = sbRegister(sbAnimCopyText(anim, imgId));

  return `<div class="sb-anim-card">
    <div class="sb-anim-header">
      <span class="sb-anim-id">${escapeHTML(id)}</span>
      ${imgId ? `<span class="sb-anim-arrow">→</span><span class="sb-anim-src">${escapeHTML(imgId)}</span>` : ""}
    </div>
    <div class="sb-anim-instruction">${escapeHTML(anim.instruction || "")}</div>
    <div class="sb-anim-actions">
      <button class="btn-mini" data-sbcopy="${copyKey}" data-label="Copy Instruction">Copy Instruction</button>
    </div>
  </div>`;
}

function buildSBPairRowHTML(pair) {
  const img  = pair.image || {};
  const anim = pair.anim  || {};
  return `<div class="sb-pair">
    ${buildSBImageCardHTML(img, pair.n)}
    ${buildSBAnimCardHTML(anim, img.id, pair.n)}
  </div>`;
}

function buildSBSegmentHTML(seg, idx) {
  const voKey = seg.voiceover ? sbRegister(seg.voiceover) : null;

  let html = `<div class="sb-segment">
    <div class="sb-segment-header">
      <span class="sb-seg-num">Seg ${seg.segment || idx + 1}</span>
      <span class="sb-segment-title">${escapeHTML(seg.name || "")}</span>
      ${seg.timecode ? `<span class="sb-segment-timecode">${escapeHTML(seg.timecode)}</span>` : ""}
    </div>`;

  if (seg.voiceover) {
    html += `<div class="sb-seg-vo-wrap">
      <blockquote class="sb-voiceover">${escapeHTML(seg.voiceover)}</blockquote>
      <button class="btn-mini btn-vo-copy" data-sbcopy="${voKey}" data-label="Copy VO">Copy VO</button>
    </div>`;
  }

  html += `<div class="sb-pairs">`;
  (seg.pairs || []).forEach(pair => { html += buildSBPairRowHTML(pair); });
  html += `</div></div>`;
  return html;
}

function buildSBThumbnailHTML(thumb) {
  const refLabel = thumb.ref ? `With Ref — ${thumb.ref}` : "Without Ref";
  const refClass = thumb.ref ? "sb-ref-yes" : "sb-ref-no";
  const fullKey   = sbRegister(sbThumbCopyFull(thumb));
  const promptKey = sbRegister(sbThumbCopyPrompt(thumb));

  let html = `<div class="sb-thumbnail-section">
    <div class="sb-thumbnail-label">Thumbnail</div>
    <div class="sb-thumbnail-card">
      <div class="sb-img-header">
        <span class="sb-img-id">THUMBNAIL</span>
        ${thumb.style ? `<span class="sb-badge sb-style-badge">Style ${escapeHTML(thumb.style)}</span>` : ""}
        <span class="sb-badge ${refClass}">${escapeHTML(refLabel)}</span>
      </div>
      ${sbField("Subject", thumb.subject)}
      ${sbField("Prompt", thumb.prompt, "sb-prompt")}
      ${sbField("Avoid", thumb.avoid, "sb-avoid")}
      ${sbField("File", thumb.file, "sb-file")}
      ${sbField("Alt", thumb.alt)}
      ${sbField("Verify", thumb.verify)}`;

  if (thumb.overlay) {
    const ov = thumb.overlay;
    html += `<div class="sb-overlay-block">
      <div class="sb-overlay-label">Text Overlay</div>
      ${ov.text ? `<div class="sb-overlay-text">${escapeHTML(ov.text)}</div>` : ""}
      ${sbField("Placement", ov.placement)}
      ${sbField("Size", ov.size)}
      ${sbField("Weight", ov.weight)}
      ${sbField("Color", ov.color)}
      ${sbField("Treatment", ov.treatment)}
    </div>`;
  }

  html += `<div class="sb-card-actions">
    <button class="btn-mini btn-primary" data-sbcopy="${promptKey}" data-label="Copy Prompt">Copy Prompt</button>
    <button class="btn-mini" data-sbcopy="${fullKey}" data-label="Copy Full Block">Copy Full Block</button>
  </div>
  </div></div>`;
  return html;
}

function buildBatchExportHTML(segments) {
  const SEP = "\n\n────────────────────────────────────────\n\n";
  const BATCH_SIZE = 5;

  // Flatten all pairs in order across all segments
  const allPairs = [];
  (segments || []).forEach(seg => {
    (seg.pairs || []).forEach(pair => allPairs.push(pair));
  });
  if (!allPairs.length) return "";

  // Slice into batches of 5
  const batches = [];
  for (let i = 0; i < allPairs.length; i += BATCH_SIZE) {
    batches.push(allPairs.slice(i, i + BATCH_SIZE));
  }

  let rows = "";
  batches.forEach((batch, bIdx) => {
    const firstPair = batch[0];
    const lastPair  = batch[batch.length - 1];
    const firstN    = firstPair.n || (bIdx * BATCH_SIZE + 1);
    const lastN     = lastPair.n  || (bIdx * BATCH_SIZE + batch.length);
    const firstId   = (firstPair.image || {}).id || `IMAGE-${firstN}`;
    const lastId    = (lastPair.image  || {}).id || `IMAGE-${lastN}`;
    const pairRange = firstN === lastN ? `Pair ${firstN}` : `Pairs ${firstN}–${lastN}`;
    const idRange   = firstId === lastId ? firstId : `${firstId} – ${lastId}`;

    // Build copy text: IMAGE full block → SEP → ANIM instruction → SEP → next pair...
    const parts = [];
    batch.forEach((pair, pIdx) => {
      if (pIdx > 0) parts.push(SEP);
      const img  = pair.image || {};
      const anim = pair.anim  || {};
      parts.push(sbImageCopyFlow(img));
      parts.push(SEP);
      parts.push(sbAnimCopyText(anim, img.id));
    });
    const copyKey = sbRegister(parts.join(""));

    rows += `<div class="sb-batch-row">
      <div class="sb-batch-info">
        <span class="sb-batch-num">Batch ${bIdx + 1}</span>
        <span class="sb-batch-range">${escapeHTML(pairRange)}</span>
        <span class="sb-batch-ids">${escapeHTML(idRange)}</span>
        <span class="sb-batch-count">${batch.length} pairs · ${batch.length * 2} cards</span>
      </div>
      <button class="btn-mini btn-primary sb-batch-btn" data-sbcopy="${copyKey}" data-label="Copied Batch ${bIdx + 1}">Copy for Veo</button>
    </div>`;
  });

  return `<div class="sb-batch-section">
    <div class="sb-batch-header">
      <div class="sb-batch-title">Batch Export for Veo</div>
      <div class="sb-batch-sub">5 pairs · 10 cards per batch — full image blocks + animation instructions, line-separated</div>
    </div>
    <div class="sb-batch-list">${rows}</div>
  </div>`;
}

function buildVOScriptHTML(segments) {
  const segsWithVO = segments.filter(s => s.voiceover);
  if (!segsWithVO.length) return "";

  const scriptLines = [];
  segsWithVO.forEach((seg, i) => {
    const label = `[SEG ${seg.segment || i + 1} — ${(seg.name || "").toUpperCase()}${seg.timecode ? " | " + seg.timecode : ""}]`;
    scriptLines.push(label);
    scriptLines.push(seg.voiceover);
    scriptLines.push("");
  });
  const fullText = scriptLines.join("\n").trim();
  const copyKey = sbRegister(fullText);

  let inner = "";
  segsWithVO.forEach((seg, i) => {
    inner += `<div class="sb-vo-seg-block">
      <div class="sb-vo-seg-label">Seg ${seg.segment || i + 1} — ${escapeHTML(seg.name || "")}${seg.timecode ? `<span class="sb-vo-seg-time"> | ${escapeHTML(seg.timecode)}</span>` : ""}</div>
      <p class="sb-vo-seg-text">${escapeHTML(seg.voiceover)}</p>
    </div>`;
  });

  return `<div class="sb-vo-script-section">
    <div class="sb-vo-script-header">
      <div class="sb-vo-script-label">Full Voiceover Script</div>
      <button class="btn-mini btn-primary" data-sbcopy="${copyKey}" data-label="Copy Full Script">Copy Full Script</button>
    </div>
    <div class="sb-vo-script-body">${inner}</div>
  </div>`;
}

function renderStoryboard() {
  const container = $("#sb-content");
  if (!storyboardState) { container.style.display = "none"; return; }

  // Reset copy registry before each render.
  Object.keys(sbCopyRegistry).forEach(k => delete sbCopyRegistry[k]);
  sbCopySeq = 0;

  const s = storyboardState;
  const meta = s.meta || {};

  let html = "";

  // Meta bar
  if (meta.title || meta.project || meta.runtime) {
    const parts = [];
    if (meta.client)      parts.push(escapeHTML(meta.client));
    if (meta.project)     parts.push(escapeHTML(meta.project));
    if (meta.runtime)     parts.push(escapeHTML(meta.runtime));
    if (meta.total_pairs) parts.push(`${meta.total_pairs} pairs`);
    html += `<div class="sb-meta">
      ${meta.title ? `<div class="sb-meta-title">${escapeHTML(meta.title)}</div>` : ""}
      ${parts.length ? `<div class="sb-meta-sub">${parts.join(" · ")}</div>` : ""}
    </div>`;
  }

  // Batch export panel
  html += buildBatchExportHTML(s.segments || []);

  // Segments
  (s.segments || []).forEach((seg, i) => { html += buildSBSegmentHTML(seg, i); });

  // Thumbnail
  if (s.thumbnail) html += buildSBThumbnailHTML(s.thumbnail);

  // Full voiceover script
  html += buildVOScriptHTML(s.segments || []);

  container.innerHTML = html;
  container.style.display = "";

  // Wire copy buttons via delegation.
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sbcopy]");
    if (!btn) return;
    const text = sbCopyRegistry[btn.dataset.sbcopy];
    if (text !== undefined) copyToClipboard(text, btn, btn.dataset.label || btn.textContent);
  });
}

/* ---- Tab switching ---- */

function initTabs() {
  $all(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      $all(".tab-btn").forEach(b => b.classList.toggle("tab-active", b.dataset.tab === target));
      $("#deliverables-tab-content").style.display = target === "deliverables" ? "" : "none";
      $("#storyboard-tab-content").style.display   = target === "storyboard"   ? "" : "none";
      $("#flow-tab-content").style.display         = target === "flow"         ? "" : "none";
    });
  });
}

/* =========================================================================
 * SOVEREIGN_FLOW_V1 — Google Flow video production dashboard
 * ========================================================================= */

const FLOW_STORAGE_KEY     = "sovereign_strategy_flow_v1";
const FLOW_TTS_KEY         = "sovereign_strategy_flow_tts_v1";
const FLOW_TITLEDESC_KEY   = "sovereign_strategy_flow_titledesc_v1";
let flowState = null;
let flowTTSState = null;
let flowTitleDescState = null;

const flowCopyRegistry = {};
let flowCopySeq = 0;
function flowRegister(text) {
  const key = "flc_" + (++flowCopySeq);
  flowCopyRegistry[key] = String(text || "");
  return key;
}

const flowTTSReg = {};
let flowTTSSeq = 0;
function flTTSReg(text) {
  const key = "ftts_" + (++flowTTSSeq);
  flowTTSReg[key] = String(text || "");
  return key;
}

const flowMetaReg = {};
let flowMetaSeq = 0;
function flMetaReg(text) {
  const key = "fmeta_" + (++flowMetaSeq);
  flowMetaReg[key] = String(text || "");
  return key;
}

function saveFlow() {
  if (!flowState) return;
  try { localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flowState)); } catch(e) {}
}
function loadFlow() {
  try { const r = localStorage.getItem(FLOW_STORAGE_KEY); if (r) flowState = JSON.parse(r); } catch(e) {}
}
function saveFlowTTS() {
  if (!flowTTSState) return;
  try { localStorage.setItem(FLOW_TTS_KEY, JSON.stringify(flowTTSState)); } catch(e) {}
}
function loadFlowTTS() {
  try { const r = localStorage.getItem(FLOW_TTS_KEY); if (r) flowTTSState = JSON.parse(r); } catch(e) {}
}
function saveFlowTitleDesc() {
  if (!flowTitleDescState) return;
  try { localStorage.setItem(FLOW_TITLEDESC_KEY, JSON.stringify(flowTitleDescState)); } catch(e) {}
}
function loadFlowTitleDesc() {
  try { const r = localStorage.getItem(FLOW_TITLEDESC_KEY); if (r) flowTitleDescState = JSON.parse(r); } catch(e) {}
}

function parseFlowPacket(text) {
  const t = text.trim();
  const START = "BEGIN_SOVEREIGN_FLOW_V1";
  const END   = "END_SOVEREIGN_FLOW_V1";
  const si = t.indexOf(START);
  const ei = t.indexOf(END);
  const jsonStr = (si !== -1 && ei > si) ? t.slice(si + START.length, ei).trim() : t;
  return JSON.parse(jsonStr);
}

/* ---- Flow HTML builders ---- */

function flField(label, text, cls = "") {
  if (!text) return "";
  return `<div class="fl-thumb-field">
    <div class="fl-th-label">${escapeHTML(label)}</div>
    <div class="fl-th-text${cls ? " " + cls : ""}">${escapeHTML(text)}</div>
  </div>`;
}

function buildFlowMetaBarHTML(meta) {
  if (!meta) return "";
  const chips = [
    ["Client",   meta.client],
    ["Project",  meta.project],
    ["Title",    meta.title],
    ["Runtime",  meta.runtime],
    ["Clips",    meta.total_clips],
    ["Batches",  meta.batch_count != null ? `${meta.batch_count} (${meta.batch_structure})` : null],
    ["Engine",   meta.engine],
  ].filter(([, v]) => v != null);
  return `<div class="fl-meta-bar">${chips.map(([l, v]) =>
    `<div class="fl-meta-chip"><span class="fl-meta-label">${escapeHTML(l)}</span><span class="fl-meta-value">${escapeHTML(String(v))}</span></div>`
  ).join("")}</div>`;
}

function buildFlowSetupPanelHTML(ai) {
  if (!ai) return "";

  // Deliverable 1 — Instructions Panel (full_panel = assembled copy-paste for Flow Agent Settings)
  const fullPanelText = ai.full_panel || ai.global_constraints || "";
  const fpKey = flowRegister(fullPanelText);
  const instrBlock = fullPanelText ? `<div class="fl-setup-block fl-instructions-hero">
    <div class="fl-instr-header">
      <div>
        <div class="fl-block-label">Flow Agent — Instructions Panel</div>
        <div class="fl-instructions-sub">Paste once at the start of every session. Never repeat it in Chat.</div>
      </div>
      <button class="fl-copy-btn fl-copy-btn-hero" data-flcopy="${fpKey}" data-label="Copy Instructions Panel">Copy Instructions Panel</button>
    </div>
    <pre class="fl-code-block fl-code-block-nopad">${escapeHTML(fullPanelText)}</pre>
  </div>` : "";

  // Normalize a value that might be a string or an array to a display string
  function normStr(val) {
    if (!val) return "";
    if (Array.isArray(val)) return val.map(s => `✗ ${s}`).join("\n");
    return String(val);
  }
  // Normalize clips_applied which may be an array [1,2,3] or a string "1, 2, 3"
  function normClips(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return String(val).split(",").map(s => s.trim()).filter(Boolean);
  }

  // Component sub-blocks (reference only — these are the parts that compose full_panel)
  function subBlock(label, rawVal) {
    const text = normStr(rawVal);
    if (!text) return "";
    const k = flowRegister(text);
    return `<div class="fl-sub-block">
      <div class="fl-sub-block-label">${label}</div>
      <div class="fl-code-block-wrap">
        <button class="fl-copy-btn fl-copy-btn-xs" data-flcopy="${k}" data-label="Copy">Copy</button>
        <pre class="fl-code-block">${escapeHTML(text)}</pre>
      </div>
    </div>`;
  }
  const hasSubBlocks = ai.global_bans || ai.blueprint_rule || ai.camera_package || ai.continuity_law;
  const subBlocksHTML = hasSubBlocks ? `<div class="fl-setup-block">
    <details class="fl-sub-blocks-details">
      <summary class="fl-sub-blocks-summary">Component Sub-Blocks — Reference Only</summary>
      ${subBlock("Global Bans", ai.global_bans)}
      ${subBlock("Blueprint Rule", ai.blueprint_rule)}
      ${subBlock("Camera Package", ai.camera_package)}
      ${subBlock("Continuity Law", ai.continuity_law)}
    </details>
  </div>` : "";

  // Reference manifest table
  let refRows = "";
  (ai.reference_manifest || []).forEach(ref => {
    const clipsHTML = normClips(ref.clips_applied).map(n => `<span class="fl-clip-badge">${escapeHTML(String(n))}</span>`).join(" ");
    const rKey = flowRegister(ref.integrity_rule || "");
    refRows += `<tr>
      <td class="fl-ref-product">${escapeHTML(ref.product)}</td>
      <td class="fl-ref-file"><code>${escapeHTML(ref.file)}</code></td>
      <td class="fl-ref-clips">${clipsHTML}</td>
      <td><button class="fl-copy-btn fl-copy-btn-xs" data-flcopy="${rKey}" data-label="Copy Rule">Copy Rule</button></td>
    </tr>`;
  });
  const refBlock = refRows ? `<div class="fl-setup-block">
    <div class="fl-block-label">Reference Images — Upload as Ingredients</div>
    <table class="fl-ref-table">
      <thead><tr><th>Product</th><th>File</th><th>Clips</th><th></th></tr></thead>
      <tbody>${refRows}</tbody>
    </table>
  </div>` : "";

  return `<details class="fl-setup-panel">
    <summary class="fl-setup-summary">
      <span class="fl-setup-title">One-Time Agent Setup</span>
      <span class="fl-setup-hint">Complete before pasting any batch command</span>
    </summary>
    <div class="fl-setup-callout"><strong>Instructions Panel</strong> → paste once into Flow Agent Settings at session start, never again. <strong>Reference images</strong> → upload as Ingredients using exact filenames shown. <strong>TTS Script</strong> → paste into external TTS pipeline only.</div>
    ${instrBlock}${subBlocksHTML}${refBlock}
  </details>`;
}

function buildFlowTTSPanelHTML(tts) {
  if (!tts || !tts.full_script) return "";
  const copyKey = flowRegister(tts.full_script);
  return `<div class="fl-tts-panel">
    <div class="fl-panel-header">
      <div>
        <div class="fl-panel-title">Voiceover Script — Step 12b</div>
        <div class="fl-panel-sub">Paste into External TTS Pipeline — Do NOT send to Flow Agent</div>
      </div>
      <button class="fl-copy-btn fl-copy-btn-lg" data-flcopy="${copyKey}" data-label="Copy Full Script">Copy Full Script</button>
    </div>
    <div class="fl-tts-script">${escapeHTML(tts.full_script)}</div>
    <div class="fl-tts-note">This is audio-only. Google Flow never receives this.</div>
  </div>`;
}

const FL_SCENE_CLASS = { OPEN: "fl-scene-open", CONTINUE: "fl-scene-continue", EVOLVE: "fl-scene-evolve", TRANSITION: "fl-scene-transition", CLOSE: "fl-scene-close", MATCH_CUT: "fl-scene-match-cut" };
const FL_SCALE_CLASS = { MACRO: "fl-scale-macro", HERO: "fl-scale-hero", SYSTEM: "fl-scale-system", BROLL: "fl-scale-broll" };
const FL_CLIP_FOOTER = "Reproduce exact geometry, stage count, port positions, and hardware. Zero alteration. Zero color specification. For the reference images main product — only in all clips that clearly state its meant to contain the reference image. For all clips that are not clear about using the reference, please do not use the reference image for that!";

function buildFlowVPBlockHTML(colorClass, labelText, text) {
  if (!text) return "";
  const k = flowRegister(text);
  return `<div class="fl-vp-block ${colorClass}">
    <div class="fl-vp-block-header">
      <span class="fl-vp-label">${escapeHTML(labelText)}</span>
      <button class="fl-copy-btn fl-copy-btn-xs" data-flcopy="${k}" data-label="Copy">Copy</button>
    </div>
    <div class="fl-vp-text">${escapeHTML(text)}</div>
  </div>`;
}

function buildFlowClipCardHTML(clip) {
  const vp = clip.video_prompt || {};
  const sceneClass = FL_SCENE_CLASS[clip.scene_build] || "fl-scene-continue";
  const scaleTier = (clip.scale_tier || "").toUpperCase();
  const scaleClass = FL_SCALE_CLASS[scaleTier] || "";
  const isBroll = scaleTier === "BROLL";

  const refHTML = (!isBroll && clip.ref) ? `<div class="fl-ref-badge-wrap">
    <span class="fl-ref-badge">REF: ${escapeHTML(clip.ref)}</span>
    <span class="fl-ref-file-label">Ingredient: <code>${escapeHTML(clip.ref_file || "")}</code></span>
  </div>` : "";

  return `<div class="fl-clip-card">
    <div class="fl-clip-left">
      <div class="fl-clip-num">#${String(clip.n).padStart(2, "0")}</div>
      <div class="fl-clip-timecode">${escapeHTML(clip.timecode || "")}</div>
      <div class="fl-clip-segment">${escapeHTML(clip.segment || "")}</div>
      <div class="fl-clip-badges">
        <span class="fl-scene-badge ${sceneClass}">${escapeHTML(clip.scene_build || "")}</span>
        ${scaleTier && scaleClass ? `<span class="fl-scale-badge ${scaleClass}">${scaleTier}</span>` : ""}
        ${clip.style ? `<span class="fl-style-badge">Style ${escapeHTML(clip.style)}</span>` : ""}
      </div>
      ${clip.environment_chapter ? `<div class="fl-env-chapter">Chapter: ${escapeHTML(clip.environment_chapter)}</div>` : ""}
      ${refHTML}
      ${clip.voiceover ? `<div class="fl-clip-vo">
        <div class="fl-vo-label">TTS Reference — Step 12b only. Not sent to Flow.</div>
        <div class="fl-vo-text">${escapeHTML(clip.voiceover)}</div>
      </div>` : ""}
      ${clip.continuity ? `<div class="fl-clip-continuity">
        <div class="fl-cont-label">Continuity</div>
        <div class="fl-cont-text">${escapeHTML(clip.continuity)}</div>
      </div>` : ""}
    </div>
    <div class="fl-clip-right">
      <div class="fl-vp-header-note">Video Prompt — 5-Part Formula</div>
      <div class="fl-vp-note">Reference only — agent_command above contains the assembled version.</div>
      ${buildFlowVPBlockHTML("fl-vp-ingredient",     "Ingredient Role",                    vp.ingredient_role)}
      ${buildFlowVPBlockHTML("fl-vp-cinematography", "Camera Movement",                    vp.cinematography_movement)}
      ${buildFlowVPBlockHTML("fl-vp-subject",        "Subject & Action",                   vp.subject_action)}
      ${buildFlowVPBlockHTML("fl-vp-env",            "Environment & Lighting (Specifics)", vp.environment_lighting_specifics)}
      ${buildFlowVPBlockHTML("fl-vp-constraints",    "Negative Space",                     vp.negative_space)}
    </div>
  </div>`;
}

function buildFlowBatchPanelHTML(batch, totalBatches) {
  const sourceHTML = batch.frame_lock_source
    ? `<span class="fl-lock-pill fl-lock-orange">Start from: ${escapeHTML(batch.frame_lock_source)}</span>`
    : `<span class="fl-lock-pill fl-lock-gray">Opening batch — no prior frame</span>`;
  const exportHTML = batch.frame_lock_export
    ? `<span class="fl-lock-pill fl-lock-blue">After completion: extract final frame → save as ${escapeHTML(batch.frame_lock_export)}</span>`
    : `<span class="fl-lock-pill fl-lock-gray">Final batch — no export needed</span>`;

  const cmdText = (batch.agent_command || "") + "\n\n" + FL_CLIP_FOOTER;
  const cmdKey = flowRegister(cmdText);
  const clipsHTML = (batch.clips || []).map(c => buildFlowClipCardHTML(c)).join("");

  return `<div class="fl-batch-card">
    <div class="fl-zone-a">
      <div class="fl-zone-a-header">
        <div>
          <div class="fl-batch-title">Flow Agent — Chat Prompt / Batch ${batch.batch} of ${totalBatches}</div>
          <div class="fl-batch-sub">Paste into Agent Chat for this batch. Do not repeat Instructions content here.</div>
        </div>
        <button class="fl-copy-btn fl-copy-btn-hero" data-flcopy="${cmdKey}" data-label="Copy Chat Prompt — Batch ${batch.batch}">Copy Chat Prompt — Batch ${batch.batch}</button>
      </div>
      <div class="fl-lock-row">${sourceHTML}${exportHTML}</div>
      <pre class="fl-agent-command">${escapeHTML(batch.agent_command || "")}</pre>
      <div class="fl-clip-footer-block">
        <span class="fl-clip-footer-label">LOCKED FOOTER — appended to every batch copy</span>
        <p class="fl-clip-footer-text">${escapeHTML(FL_CLIP_FOOTER)}</p>
      </div>
    </div>
    <details class="fl-zone-b">
      <summary class="fl-zone-b-summary">Clip Reference Cards — for review only. Agent Command above contains everything the agent needs.</summary>
      <div class="fl-clips-list">${clipsHTML}</div>
    </details>
  </div>`;
}

function buildFlowThumbnailPanelHTML(thumb) {
  if (!thumb) return "";
  const promptKey = flowRegister(thumb.prompt || "");
  const ov = thumb.overlay || {};
  const refHTML = thumb.ref ? `<div class="fl-thumb-ref">
    <span class="fl-ref-badge">REF: ${escapeHTML(thumb.ref)}</span>
    <span class="fl-ref-file-label">Ingredient: <code>${escapeHTML(thumb.ref_file || "")}</code></span>
  </div>` : "";

  return `<div class="fl-thumb-panel">
    <div class="fl-panel-header">
      <div class="fl-panel-title">Thumbnail Blueprint</div>
      ${thumb.style ? `<span class="fl-style-badge">Style ${escapeHTML(thumb.style)}</span>` : ""}
    </div>
    ${refHTML}
    <div class="fl-thumb-fields">
      ${flField("Subject", thumb.subject)}
      ${thumb.prompt ? `<div class="fl-thumb-field">
        <div class="fl-th-label-row">
          <span class="fl-th-label">Prompt</span>
          <button class="fl-copy-btn fl-copy-btn-sm" data-flcopy="${promptKey}" data-label="Copy Prompt">Copy</button>
        </div>
        <div class="fl-th-prompt">${escapeHTML(thumb.prompt)}</div>
      </div>` : ""}
      ${thumb.avoid ? `<div class="fl-thumb-field"><div class="fl-th-label">Avoid</div><div class="fl-th-avoid">${escapeHTML(thumb.avoid)}</div></div>` : ""}
      ${thumb.file  ? `<div class="fl-thumb-field"><div class="fl-th-label">File</div><code class="fl-th-file">${escapeHTML(thumb.file)}</code></div>` : ""}
      ${flField("Alt Text", thumb.alt)}
    </div>
    ${ov.text ? `<div class="fl-thumb-overlay-wrap">
      <div class="fl-overlay-mock"><span class="fl-overlay-text">${escapeHTML(ov.text)}</span></div>
      <div class="fl-overlay-specs">
        ${ov.placement ? `<div><span class="fl-ov-label">Placement:</span> ${escapeHTML(ov.placement)}</div>` : ""}
        ${ov.size      ? `<div><span class="fl-ov-label">Size:</span> ${escapeHTML(ov.size)}</div>` : ""}
        ${ov.weight    ? `<div><span class="fl-ov-label">Weight:</span> ${escapeHTML(ov.weight)}</div>` : ""}
        ${ov.color     ? `<div><span class="fl-ov-label">Color:</span> ${escapeHTML(ov.color)}</div>` : ""}
        ${ov.treatment ? `<div><span class="fl-ov-label">Treatment:</span> ${escapeHTML(ov.treatment)}</div>` : ""}
      </div>
    </div>` : ""}
    ${thumb.verify ? `<div class="fl-verify-callout">${escapeHTML(thumb.verify)}</div>` : ""}
  </div>`;
}

function renderFlow() {
  Object.keys(flowCopyRegistry).forEach(k => delete flowCopyRegistry[k]);
  flowCopySeq = 0;

  const container = $("#fl-content");
  if (!container) return;

  if (!flowState) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  const s = flowState;
  const totalBatches = (s.batches || []).length;
  let html = buildFlowMetaBarHTML(s.meta);
  html += buildFlowSetupPanelHTML(s.agent_instructions);
  html += buildFlowTTSPanelHTML(s.tts_script);
  (s.batches || []).forEach(b => { html += buildFlowBatchPanelHTML(b, totalBatches); });
  html += buildFlowThumbnailPanelHTML(s.thumbnail);

  container.innerHTML = html;
  container.style.display = "";

  container.addEventListener("click", e => {
    const btn = e.target.closest("[data-flcopy]");
    if (!btn) return;
    const text = flowCopyRegistry[btn.dataset.flcopy];
    if (text !== undefined) copyToClipboard(text, btn, btn.dataset.label || btn.textContent);
  });
}

function renderFlowTTS() {
  Object.keys(flowTTSReg).forEach(k => delete flowTTSReg[k]);
  flowTTSSeq = 0;
  const container = $("#fl-tts-content");
  if (!container) return;
  if (!flowTTSState) { container.style.display = "none"; container.innerHTML = ""; return; }
  const tts = flowTTSState;
  const scriptKey = flTTSReg(tts.full_script || "");
  const instrBlock = tts.instructions ? (() => {
    const k = flTTSReg(tts.instructions);
    return `<div class="fl-tts-instr-block">
      <div class="fl-tts-instr-header">
        <span class="fl-tts-instr-label">TTS Instructions</span>
        <button class="fl-copy-btn fl-copy-btn-xs" data-fltts="${k}" data-label="Copy Instructions">Copy Instructions</button>
      </div>
      <pre class="fl-code-block">${escapeHTML(tts.instructions)}</pre>
    </div>`;
  })() : "";
  container.innerHTML = `<div class="fl-tts-panel fl-tts-standalone">
    <div class="fl-panel-header">
      <div>
        <div class="fl-panel-title">Voiceover Script — Step 12b</div>
        <div class="fl-panel-sub">Paste into External TTS Pipeline — Do NOT send to Flow Agent</div>
      </div>
      <button class="fl-copy-btn fl-copy-btn-lg" data-fltts="${scriptKey}" data-label="Copy Full Script">Copy Full Script</button>
    </div>
    ${instrBlock}
    <div class="fl-tts-script">${escapeHTML(tts.full_script || "")}</div>
    <div class="fl-tts-note">This is audio-only. Google Flow never receives this.</div>
  </div>`;
  container.style.display = "";
  container.addEventListener("click", e => {
    const btn = e.target.closest("[data-fltts]");
    if (!btn) return;
    const text = flowTTSReg[btn.dataset.fltts];
    if (text !== undefined) copyToClipboard(text, btn, btn.dataset.label || btn.textContent);
  });
}

function renderFlowTitleDesc() {
  Object.keys(flowMetaReg).forEach(k => delete flowMetaReg[k]);
  flowMetaSeq = 0;
  const container = $("#fl-titledesc-content");
  if (!container) return;
  if (!flowTitleDescState) { container.style.display = "none"; container.innerHTML = ""; return; }
  const td = flowTitleDescState;
  function tdField(label, val) {
    if (!val && val !== 0) return "";
    const text = Array.isArray(val) ? val.join("\n") : String(val);
    const k = flMetaReg(text);
    return `<div class="fl-td-field">
      <div class="fl-td-label-row">
        <span class="fl-td-label">${escapeHTML(label)}</span>
        <button class="fl-copy-btn fl-copy-btn-xs" data-flmeta="${k}" data-label="Copy">Copy</button>
      </div>
      <div class="fl-td-value">${escapeHTML(text)}</div>
    </div>`;
  }
  container.innerHTML = `<div class="fl-titledesc-panel">
    <div class="fl-panel-title fl-td-title">Title &amp; Description</div>
    ${tdField("Video Title", td.video_title)}
    ${tdField("YouTube Description", td.youtube_description)}
    ${tdField("Chapters", td.chapters)}
    ${tdField("Tags", td.tags)}
    ${tdField("LinkedIn Caption", td.linkedin_caption)}
    ${tdField("SEO Slug", td.seo_slug)}
  </div>`;
  container.style.display = "";
  container.addEventListener("click", e => {
    const btn = e.target.closest("[data-flmeta]");
    if (!btn) return;
    const text = flowMetaReg[btn.dataset.flmeta];
    if (text !== undefined) copyToClipboard(text, btn, btn.dataset.label || btn.textContent);
  });
}

document.addEventListener("DOMContentLoaded", init);
