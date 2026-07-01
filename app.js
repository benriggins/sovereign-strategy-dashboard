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
    "Manufacturers Hub | Pillar",
    "Manufacturers Hub | Product Page",
    "Webpage",
    "Product Page",
    "Blog",
    "YouTube / NotebookLM Video",
    "Instagram Video",
    "Instagram Carousel",
    "LinkedIn Carousel",
    "LinkedIn James Post",
    "LinkedIn LibertyCES Post",
    "LinkedIn Newsletter",
    "Short Form Video"
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
* Manufacturers Hub | Pillar
* Manufacturers Hub | Product Page

Social / Video:
* YouTube / NotebookLM Video
* Instagram Video
* Instagram Carousel
* LinkedIn Carousel
* LinkedIn James Post
* LinkedIn LibertyCES Post
* LinkedIn Newsletter
* Short Form Video

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
  "Manufacturers Hub | Pillar":        "Mfr Pillar",
  "Manufacturers Hub | Product Page":  "Mfr Page",
  "Webpage":                      "Webpage",
  "Product Page":                 "Product Pg",
  "Blog":                         "Blog",
  "YouTube / NotebookLM Video":   "YouTube",
  "Instagram Video":              "IG Video",
  "Instagram Carousel":           "IG Carousel",
  "LinkedIn Carousel":            "LI Carousel",
  "LinkedIn James Post":          "LI James",
  "LinkedIn LibertyCES Post":     "LI LibertyCES",
  "LinkedIn Newsletter":          "LI Newsletter",
  "Short Form Video":             "Short Form"
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
    name: "Manufacturers Hub",
    pillarPlatforms: new Set(["Manufacturers Hub | Pillar"]),
    platforms: new Set(["Manufacturers Hub | Pillar", "Manufacturers Hub | Product Page", "Product Page"])
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
  updateMachineReadableState();

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

    ${renderCardOCSection(d)}

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
  sel.className = "status-select status-" + d.status.toLowerCase().replace(/[^a-z]+/g, "-");
  sel.setAttribute("data-act", "status");
  // When content is set to Approved, bump approval_status to READY_FOR_PREVIEW
  // (but never to BENJAMIN_APPROVED — that requires explicit confirmation).
  if (d.status === "Approved" && ocAccountKey(d.platform)) {
    const taskId = ocTaskId(d);
    const ov = openclawState.taskOverrides[taskId] || {};
    if (!ov.approval_status || ov.approval_status === OC_APPROVAL.NOT_READY) {
      if (!openclawState.taskOverrides[taskId]) openclawState.taskOverrides[taskId] = {};
      openclawState.taskOverrides[taskId].approval_status = OC_APPROVAL.READY_FOR_PREVIEW;
      saveOpenClaw();
    }
  }
  // Refresh the card's OC section in place
  const cardEl = document.querySelector(`.card[data-id="${d.id}"]`);
  if (cardEl) {
    const ocSection = cardEl.querySelector(".card-oc-section");
    if (ocSection) ocSection.outerHTML = renderCardOCSection(d);
  }
}

function onCardClick(e) {
  // OpenClaw approve button (on deliverable cards)
  const ocApproveBtn = e.target.closest("[data-oc-approve]");
  if (ocApproveBtn) {
    const d = findById(ocApproveBtn.dataset.ocApprove);
    if (d) ocOpenApprovalModal(d);
    return;
  }
  // OpenClaw revoke button (on deliverable cards)
  const ocRevokeBtn = e.target.closest("[data-oc-revoke]");
  if (ocRevokeBtn) {
    ocRevokeApproval(ocRevokeBtn.dataset.ocRevoke);
    return;
  }

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

  initTabs();

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
      updateMachineReadableState();
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
    updateMachineReadableState();
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

  // Short Form — Step 13
  loadFlowShortForm();
  renderFlowShortForm();
  $("#btn-fl-shortform-import").addEventListener("click", () => {
    const raw = $("#fl-shortform-box").value.trim();
    if (!raw) { showMessage("Nothing to import.", "warn"); return; }
    try {
      flowShortFormState = JSON.parse(raw);
      saveFlowShortForm();
      renderFlowShortForm();
      showMessage("Short form packet imported.", "success");
    } catch(err) {
      showMessage("Could not parse short form — check the JSON format.", "error");
    }
  });
  $("#btn-fl-shortform-clear").addEventListener("click", () => {
    if (!confirm("Clear short form packet?")) return;
    flowShortFormState = null;
    try { localStorage.removeItem(FLOW_SHORTFORM_KEY); } catch(e) {}
    $("#fl-shortform-box").value = "";
    renderFlowShortForm();
    showMessage("Short form cleared.", "info");
  });

  // OpenClaw
  loadOpenClaw();

  // Queue filter buttons
  $("#openclaw-tab-content").addEventListener("click", e => {
    // Filter buttons
    const filterBtn = e.target.closest(".oc-filter-btn");
    if (filterBtn) { ocQueueFilter = filterBtn.dataset.filter; renderOCTaskQueue(); return; }

    // Approve button in queue
    const approveBtn = e.target.closest("[data-oc-approve]");
    if (approveBtn) {
      const d = findById(approveBtn.dataset.ocApprove);
      if (d) ocOpenApprovalModal(d);
      return;
    }
    // Revoke button in queue
    const revokeBtn = e.target.closest("[data-oc-revoke]");
    if (revokeBtn) { ocRevokeApproval(revokeBtn.dataset.ocRevoke); return; }

    // Copy task packet
    const copyBtn = e.target.closest("[data-oc-copy-packet]");
    if (copyBtn) {
      const text = ocPacketCopyReg[copyBtn.dataset.ocCopyPacket];
      if (text !== undefined) copyToClipboard(text, copyBtn, "Copied");
      return;
    }
  });

  // Result import
  $("#btn-oc-result-import").addEventListener("click", () => {
    const raw = $("#oc-result-box").value.trim();
    const msgEl = $("#oc-result-message");
    msgEl.style.display = "none";
    if (!raw) { showMessage("Nothing to import.", "warn"); return; }
    try {
      const pkt = ocParseResultPacket(raw);
      const d   = ocValidateResultPacket(pkt);
      ocApplyResultPacket(pkt, d);
      renderOpenClawTab();
      renderSections();
      msgEl.className = "oc-result-message oc-result-ok";
      msgEl.textContent = "✓ RESULT_IMPORTED — " + pkt.task_id;
      msgEl.style.display = "";
      showMessage("OpenClaw result imported: " + pkt.task_id, "success");
    } catch(err) {
      msgEl.className = "oc-result-message oc-result-err";
      msgEl.textContent = "✗ " + (err.code || "RESULT_REJECTED_INVALID_PACKET") + " — " + (err.message || "Unknown error");
      msgEl.style.display = "";
      showMessage((err.code || "Import failed") + ": " + err.message, "error");
    }
  });

  $("#btn-oc-result-clear").addEventListener("click", () => {
    $("#oc-result-box").value = "";
    const msgEl = $("#oc-result-message");
    msgEl.style.display = "none";
  });

  // Clear run log
  $("#btn-oc-clear-log").addEventListener("click", () => {
    if (!confirm("Clear the entire OpenClaw run log?")) return;
    openclawState.runLog = [];
    saveOpenClaw();
    renderOCRunLog();
    showMessage("Run log cleared.", "info");
  });

  // Approval modal buttons
  $("#oc-modal-confirm").addEventListener("click", ocConfirmApproval);
  $("#oc-modal-cancel").addEventListener("click",  ocCloseModal);
  $("#oc-modal-close").addEventListener("click",   ocCloseModal);
  $("#oc-modal-revoke").addEventListener("click",  () => {
    if (!ocPendingApprovalId) return;
    const d = findById(ocPendingApprovalId);
    if (d) ocRevokeApproval(ocTaskId(d));
  });
  // Close modal on backdrop click
  $("#oc-approval-modal").addEventListener("click", e => {
    if (e.target === $("#oc-approval-modal")) ocCloseModal();
  });

  // Carousel tab
  loadCarousel();
  renderCarouselTab();

  $("#btn-cr-import").addEventListener("click", () => {
    const raw = $("#cr-import-box").value.trim();
    if (!raw) { showMessage("Nothing to import.", "warn"); return; }
    try {
      const pkt = parseCarouselPacket(raw);
      const run = {
        id: "cr_run_" + Date.now(),
        imported_at: new Date().toISOString(),
        campaign_id: pkt.campaign_id || "",
        manus_permanent_skill: pkt.manus_permanent_skill || "",
        carousel_a: pkt.carousel_a || null,
        carousel_b: pkt.carousel_b || null,
      };
      carouselRuns.unshift(run);
      saveCarousel();
      renderCarouselTab();
      updateMachineReadableState();
      $("#cr-import-box").value = "";
      const a = (run.carousel_a?.slide_map?.length || 0);
      const b = (run.carousel_b?.slide_map?.length || 0);
      showMessage(`Carousel run added: ${a + b} slides (A: ${a}, B: ${b}). ${carouselRuns.length} run${carouselRuns.length !== 1 ? "s" : ""} total.`, "success");
    } catch(err) {
      showMessage("Could not parse Carousel packet — check the JSON format.", "error");
    }
  });

  $("#btn-cr-clear").addEventListener("click", () => {
    if (!confirm("Clear ALL carousel runs?")) return;
    carouselRuns = [];
    try { localStorage.removeItem(CAROUSEL_STORAGE_KEY); } catch(e) {}
    $("#cr-import-box").value = "";
    renderCarouselTab();
    updateMachineReadableState();
    showMessage("All carousel runs cleared.", "info");
  });

  // Manus permanent skill hero copy — uses the most recently imported run
  $("#btn-cr-copy-manus-skill").addEventListener("click", e => {
    const text = carouselRuns.find(r => r.manus_permanent_skill)?.manus_permanent_skill;
    if (text) copyToClipboard(text, e.currentTarget, "Copy Manus Permanent Skill");
  });

  // Carousel tab — all interactive buttons via delegation (copy, collapse, remove)
  $("#carousels-tab-content").addEventListener("click", e => {
    // Copy buttons (data-crkb)
    const crkbBtn = e.target.closest("[data-crkb]");
    if (crkbBtn) {
      const text = crCopyReg[crkbBtn.dataset.crkb];
      if (text !== undefined) copyToClipboard(text, crkbBtn, crkbBtn.dataset.label || crkbBtn.textContent);
      return;
    }
    // Collapse/expand run card
    const colBtn = e.target.closest("[data-cr-collapse]");
    if (colBtn) {
      const card = document.querySelector(`.cr-run-card[data-crid="${colBtn.dataset.crCollapse}"]`);
      if (card) card.classList.toggle("cr-run-collapsed");
      return;
    }
    // Remove a single run
    const remBtn = e.target.closest("[data-cr-remove]");
    if (remBtn) {
      if (!confirm("Remove this carousel run?")) return;
      carouselRuns = carouselRuns.filter(r => r.id !== remBtn.dataset.crRemove);
      saveCarousel();
      renderCarouselTab();
      updateMachineReadableState();
      showMessage("Carousel run removed.", "info");
      return;
    }
  });

  // ---- Execution tab ----
  loadExecution();
  renderExecutionTab();

  // Executor selector
  $("#execution-tab-content").addEventListener("click", e => {
    const execBtn = e.target.closest(".ex-exec-btn");
    if (execBtn) {
      $all(".ex-exec-btn").forEach(b => b.classList.toggle("ex-exec-active", b === execBtn));
      exSelectedExecutor = execBtn.dataset.executor;
      if (exPacketState) renderExecutionPacketPreview(exPacketState);
      return;
    }
  });

  $("#btn-ex-import").addEventListener("click", () => {
    const raw = $("#ex-import-box").value.trim();
    if (!raw) { showMessage("Nothing to import.", "warn"); return; }
    try {
      const pkt = exParsePacket(raw);
      const errs = exValidatePacket(pkt);
      exPacketState = pkt;
      saveExecution();
      renderExecutionPacketPreview(pkt, errs);
      renderSessionApprovalConsole();
      updateMachineReadableState();
      $("#btn-ex-copy-packet").style.display = "";
      const valid = errs.length === 0;
      showMessage(valid ? `Execution packet loaded: ${pkt.task_id}` : `Packet loaded with ${errs.length} validation issue(s).`, valid ? "success" : "warn");
    } catch(err) {
      showMessage("Could not parse packet — check the JSON format. " + err.message, "error");
    }
  });

  $("#btn-ex-clear-packet").addEventListener("click", () => {
    exPacketState = null;
    saveExecution();
    updateMachineReadableState();
    $("#ex-import-box").value = "";
    $("#ex-packet-preview").style.display = "none";
    $("#btn-ex-copy-packet").style.display = "none";
    renderSessionApprovalConsole();
    showMessage("Execution packet cleared.", "info");
  });

  // RB009 — Composer Textbox Focus Stability Test
  $("#btn-ex-gen-rb009")?.addEventListener("click", () => {
    const pkt = generateRB009();
    exPacketState = pkt;
    saveExecution();
    renderExecutionPacketPreview(pkt, exValidatePacket(pkt));
    renderSessionApprovalConsole();
    updateMachineReadableState();
    $("#btn-ex-copy-packet").style.display = "";
    showMessage("RB009 loaded. Approve the session for linkedin_james_personal, then copy the Hermes prompt.", "success");
  });

  // Session approval button delegation
  $("#ex-session-approvals")?.addEventListener("click", e => {
    const btn = e.target.closest(".ex-session-btn");
    if (!btn) return;
    const key    = btn.dataset.acct;
    const action = btn.dataset.action;
    if (action === "approve") {
      exSessionApprovals[key] = { approved: true, approved_at: new Date().toISOString() };
      if (exPacketState?.account_key === key) {
        exPacketState.approval_status = "BENJAMIN_APPROVED";
        saveExecution();
        renderExecutionPacketPreview(exPacketState, exValidatePacket(exPacketState));
        updateMachineReadableState();
      }
      showMessage(`Session approved — ${key}. All packets for this account are cleared this session.`, "success");
    } else {
      delete exSessionApprovals[key];
      if (exPacketState?.account_key === key) {
        exPacketState.approval_status = "PENDING";
        saveExecution();
        renderExecutionPacketPreview(exPacketState, exValidatePacket(exPacketState));
        updateMachineReadableState();
      }
      showMessage(`Session approval revoked — ${key}.`, "info");
    }
    renderSessionApprovalConsole();
    renderAttentionBar();
  });

  $("#btn-ex-copy-packet").addEventListener("click", e => {
    if (exPacketState) copyToClipboard(JSON.stringify(exPacketState, null, 2), e.currentTarget, "Copy Packet JSON");
  });

  $("#btn-ex-copy-hermes-prompt").addEventListener("click", e => {
    if (exPacketState) copyToClipboard(exBuildHermesPrompt(exPacketState), e.currentTarget, "Copy Hermes Prompt");
  });

  $("#btn-ex-result-import").addEventListener("click", () => {
    const raw = $("#ex-result-box").value.trim();
    const msgEl = $("#ex-result-message");
    msgEl.style.display = "none";
    if (!raw) { showMessage("Nothing to import.", "warn"); return; }
    try {
      const result = exParseResult(raw);
      exAppendRunLog(result);
      saveExecution();
      renderExRunLog();
      updateMachineReadableState();
      msgEl.className = "ex-result-message ex-result-ok";
      msgEl.textContent = "✓ Result imported — " + (result.task_id || "unknown task") + " — " + (result.status || "?");
      msgEl.style.display = "";
      showMessage("Execution result imported.", "success");
    } catch(err) {
      msgEl.className = "ex-result-message ex-result-err";
      msgEl.textContent = "✗ Could not parse result: " + err.message;
      msgEl.style.display = "";
      showMessage("Result import failed: " + err.message, "error");
    }
  });

  $("#btn-ex-result-clear").addEventListener("click", () => {
    $("#ex-result-box").value = "";
    const msgEl = $("#ex-result-message");
    msgEl.style.display = "none";
  });

  $("#btn-ex-clear-log").addEventListener("click", () => {
    if (!confirm("Clear the execution run log?")) return;
    exRunLog = [];
    saveExecution();
    renderExRunLog();
    showMessage("Run log cleared.", "info");
  });

  // Sync machine-readable state tags once all state is loaded
  updateMachineReadableState();
  // Attention bar needs a second pass after all tab content is wired
  renderAttentionBar();
}


/* ---- Tab switching ---- */

function initTabs() {
  $all(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      $all(".tab-btn").forEach(b => b.classList.toggle("tab-active", b.dataset.tab === target));
      $("#deliverables-tab-content").style.display  = target === "deliverables" ? "" : "none";
      $("#flow-tab-content").style.display          = target === "flow"         ? "" : "none";
      $("#openclaw-tab-content").style.display      = target === "openclaw"     ? "" : "none";
      $("#carousels-tab-content").style.display     = target === "carousels"    ? "" : "none";
      $("#execution-tab-content").style.display     = target === "execution"    ? "" : "none";
      if (target === "openclaw")  renderOpenClawTab();
      if (target === "carousels") renderCarouselTab();
      if (target === "execution") renderExecutionTab();
    });
  });
}

/* =========================================================================
 * SOVEREIGN_FLOW_V1 — Google Flow video production dashboard
 * ========================================================================= */

const FLOW_STORAGE_KEY     = "sovereign_strategy_flow_v1";
const FLOW_TTS_KEY         = "sovereign_strategy_flow_tts_v1";
const FLOW_TITLEDESC_KEY   = "sovereign_strategy_flow_titledesc_v1";
const FLOW_SHORTFORM_KEY   = "sovereign_strategy_flow_shortform_v1";
let flowState = null;
let flowTTSState = null;
let flowTitleDescState = null;
let flowShortFormState = null;

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

const flowSFReg = {};
let flowSFSeq = 0;
function flSFReg(text) {
  const key = "fsf_" + (++flowSFSeq);
  flowSFReg[key] = String(text || "");
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
function saveFlowShortForm() {
  if (!flowShortFormState) return;
  try { localStorage.setItem(FLOW_SHORTFORM_KEY, JSON.stringify(flowShortFormState)); } catch(e) {}
}
function loadFlowShortForm() {
  try { const r = localStorage.getItem(FLOW_SHORTFORM_KEY); if (r) flowShortFormState = JSON.parse(r); } catch(e) {}
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
const FL_THUMB_FOOTER = `PURPLE COW PROTOCOL — Do NOT generate yet.

STEP 1 — RESEARCH FIRST: Before touching the generation tool, identify the top viral thumbnails in this exact niche and topic. Analyze: what emotion does the first frame trigger? What color contrast grabs attention at 120px wide? What one unexpected element makes it remarkable? Complete this analysis in full before proceeding.

STEP 2 — DESIGN LIKE A THUMBNAIL EXPERT: High contrast — typically a dark or moody environment with 1–2 bright focal points. Rule of thirds. Max 3 colors in the palette. Choose a dominant color that pops against YouTube's gray/white background. Use contrast, shadow, depth, and negative space intentionally. Think like a designer, not a prompt engineer.

STEP 3 — PHOTOREALISM IS NON-NEGOTIABLE: No AI tells — no plastic surfaces, no perfect studio lighting, no floating products, no clean white backgrounds, no fake depth-of-field blur. Real textures. Real grit. Real industrial lighting with falloff and shadow. The product exists inside a real moment, not a render. If it looks like it was generated, regenerate it.

STEP 4 — PURPLE COW TEST: Before finalizing, ask — would someone stop mid-scroll for this image before reading the title? If the title has to carry the image, it's not remarkable enough. Regenerate until the image alone stops the scroll.`;


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

  const lfRenameAppend = (flowState && flowState.file_rename_prompt)
    ? "\n\n---\n\n" + flowState.file_rename_prompt
    : "";
  const cmdText = (batch.agent_command || "") + "\n\n" + FL_CLIP_FOOTER + lfRenameAppend;
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

  // Full blueprint copy text
  const lines = [`THUMBNAIL BLUEPRINT${thumb.style ? " — Style " + thumb.style : ""}`];
  if (thumb.ref) lines.push(`REF: ${thumb.ref}${thumb.ref_file ? " | Ingredient: " + thumb.ref_file : ""}`);
  if (thumb.subject) lines.push(`SUBJECT: ${thumb.subject}`);
  if (thumb.prompt)  lines.push(`PROMPT: ${thumb.prompt}`);
  if (thumb.avoid)   lines.push(`AVOID: ${thumb.avoid}`);
  if (thumb.file)    lines.push(`FILE: ${thumb.file}`);
  if (thumb.alt)     lines.push(`ALT TEXT: ${thumb.alt}`);
  if (ov.text) {
    lines.push("", `OVERLAY TEXT: ${ov.text}`);
    if (ov.placement) lines.push(`  Placement: ${ov.placement}`);
    if (ov.size)      lines.push(`  Size: ${ov.size}`);
    if (ov.weight)    lines.push(`  Weight: ${ov.weight}`);
    if (ov.color)     lines.push(`  Color: ${ov.color}`);
    if (ov.treatment) lines.push(`  Treatment: ${ov.treatment}`);
  }
  if (thumb.verify) lines.push("", `VERIFY: ${thumb.verify}`);
  lines.push("", FL_THUMB_FOOTER);
  const blueprintKey = flowRegister(lines.join("\n"));

  const refHTML = thumb.ref ? `<div class="fl-thumb-ref">
    <span class="fl-ref-badge">REF: ${escapeHTML(thumb.ref)}</span>
    <span class="fl-ref-file-label">Ingredient: <code>${escapeHTML(thumb.ref_file || "")}</code></span>
  </div>` : "";

  return `<div class="fl-thumb-panel">
    <div class="fl-panel-header">
      <div class="fl-panel-title">Thumbnail Blueprint</div>
      <div style="display:flex;align-items:center;gap:8px;">
        ${thumb.style ? `<span class="fl-style-badge">Style ${escapeHTML(thumb.style)}</span>` : ""}
        <button class="fl-copy-btn fl-copy-btn-sm" data-flcopy="${blueprintKey}" data-label="Copy Blueprint">Copy Blueprint</button>
      </div>
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
    <div class="fl-thumb-purple-cow">
      <span class="fl-purple-cow-label">PURPLE COW PROTOCOL — appended to every blueprint copy</span>
      <ol class="fl-purple-cow-steps">
        <li><strong>Research first</strong> — identify top viral thumbnails in this exact niche. Analyze emotion, contrast, and the one unexpected element. Complete this before touching the generation tool.</li>
        <li><strong>Design like an expert</strong> — high contrast, dark/moody environment, 1–2 bright focal points, rule of thirds, max 3 colors, dominant color that pops against YouTube's background.</li>
        <li><strong>Photorealism only</strong> — no AI tells, no plastic surfaces, no studio floats, no clean white backgrounds. Real textures, real grit, real industrial lighting. If it looks generated, regenerate.</li>
        <li><strong>Purple cow test</strong> — would someone stop mid-scroll before reading the title? If the title carries the image, it's not remarkable. Regenerate until the image alone stops the scroll.</li>
      </ol>
    </div>
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
  // thumbnail lives in Title & Description box (thumbnail_a / thumbnail_b) — not in SOVEREIGN_FLOW_V1

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

function buildTDThumbHTML(thumb, label) {
  if (!thumb) return "";
  const ov = thumb.overlay || {};
  const lines = [`${label}${thumb.style ? " — Style " + thumb.style : ""}`];
  if (thumb.ref)     lines.push(`REF: ${thumb.ref}${thumb.ref_file ? " | Ingredient: " + thumb.ref_file : ""}`);
  if (thumb.subject) lines.push(`SUBJECT: ${thumb.subject}`);
  if (thumb.prompt)  lines.push(`PROMPT: ${thumb.prompt}`);
  if (thumb.avoid)   lines.push(`AVOID: ${thumb.avoid}`);
  if (thumb.file)    lines.push(`FILE: ${thumb.file}`);
  if (thumb.alt)     lines.push(`ALT TEXT: ${thumb.alt}`);
  if (ov.text) {
    lines.push("", `OVERLAY TEXT: ${ov.text}`);
    if (ov.placement) lines.push(`  Placement: ${ov.placement}`);
    if (ov.size)      lines.push(`  Size: ${ov.size}`);
    if (ov.weight)    lines.push(`  Weight: ${ov.weight}`);
    if (ov.color)     lines.push(`  Color: ${ov.color}`);
    if (ov.treatment) lines.push(`  Treatment: ${ov.treatment}`);
  }
  if (thumb.verify) lines.push("", `VERIFY: ${thumb.verify}`);
  lines.push("", FL_THUMB_FOOTER);
  const bpKey   = flMetaReg(lines.join("\n"));
  const pKey    = thumb.prompt ? flMetaReg(thumb.prompt) : null;
  const refHTML = thumb.ref ? `<div class="fl-thumb-ref">
    <span class="fl-ref-badge">REF: ${escapeHTML(thumb.ref)}</span>
    <span class="fl-ref-file-label">Ingredient: <code>${escapeHTML(thumb.ref_file || "")}</code></span>
  </div>` : "";
  function tf(lbl, val) {
    if (!val) return "";
    return `<div class="fl-thumb-field"><div class="fl-th-label">${escapeHTML(lbl)}</div><div class="fl-th-avoid">${escapeHTML(val)}</div></div>`;
  }
  return `<div class="fl-thumb-panel fl-td-thumb">
    <div class="fl-panel-header">
      <div class="fl-panel-title">${escapeHTML(label)}</div>
      <div style="display:flex;align-items:center;gap:8px;">
        ${thumb.style ? `<span class="fl-style-badge">Style ${escapeHTML(thumb.style)}</span>` : ""}
        <button class="fl-copy-btn fl-copy-btn-sm" data-flmeta="${bpKey}" data-label="Copy Blueprint">Copy Blueprint</button>
      </div>
    </div>
    ${refHTML}
    <div class="fl-thumb-fields">
      ${tf("Subject", thumb.subject)}
      ${thumb.prompt ? `<div class="fl-thumb-field">
        <div class="fl-th-label-row">
          <span class="fl-th-label">Prompt</span>
          <button class="fl-copy-btn fl-copy-btn-sm" data-flmeta="${pKey}" data-label="Copy Prompt">Copy</button>
        </div>
        <div class="fl-th-prompt">${escapeHTML(thumb.prompt)}</div>
      </div>` : ""}
      ${tf("Avoid", thumb.avoid)}
      ${thumb.file ? `<div class="fl-thumb-field"><div class="fl-th-label">File</div><code class="fl-th-file">${escapeHTML(thumb.file)}</code></div>` : ""}
      ${tf("Alt Text", thumb.alt)}
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
    <div class="fl-thumb-purple-cow">
      <span class="fl-purple-cow-label">PURPLE COW PROTOCOL — appended to every blueprint copy</span>
      <ol class="fl-purple-cow-steps">
        <li><strong>Research first</strong> — identify top viral thumbnails in this exact niche. Analyze emotion, contrast, and the one unexpected element. Complete this before touching the generation tool.</li>
        <li><strong>Design like an expert</strong> — high contrast, dark/moody environment, 1–2 bright focal points, rule of thirds, max 3 colors, dominant color that pops against YouTube's background.</li>
        <li><strong>Photorealism only</strong> — no AI tells, no plastic surfaces, no studio floats, no clean white backgrounds. Real textures, real grit, real industrial lighting. If it looks generated, regenerate.</li>
        <li><strong>Purple cow test</strong> — would someone stop mid-scroll before reading the title? If the title carries the image, it's not remarkable. Regenerate until the image alone stops the scroll.</li>
      </ol>
    </div>
  </div>`;
}

function buildManusPrompt(td) {
  const sga = td.seo_geo_aeo || {};
  const lines = ["Run the YouTube Thumbnail Gen skill on the following.", ""];

  if (sga.seo_focus && sga.seo_focus.length) {
    lines.push("SEO FOCUS:");
    (Array.isArray(sga.seo_focus) ? sga.seo_focus : [sga.seo_focus]).forEach(k => lines.push("- " + k));
    lines.push("");
  }
  if (sga.geo_focus && sga.geo_focus.length) {
    lines.push("GEO FOCUS:");
    (Array.isArray(sga.geo_focus) ? sga.geo_focus : [sga.geo_focus]).forEach(k => lines.push("- " + k));
    lines.push("");
  }
  if (sga.aeo_focus && sga.aeo_focus.length) {
    lines.push("AEO FOCUS:");
    (Array.isArray(sga.aeo_focus) ? sga.aeo_focus : [sga.aeo_focus]).forEach(k => lines.push("- " + k));
    lines.push("");
  }

  if (td.title_a) { lines.push("TITLE A:"); lines.push(td.title_a); lines.push(""); }
  if (td.title_b) { lines.push("TITLE B:"); lines.push(td.title_b); lines.push(""); }

  function thumbLines(thumb, label) {
    if (!thumb) return;
    const ov = thumb.overlay || {};
    lines.push(`${label}${thumb.style ? " — Style " + thumb.style : ""}:`);
    if (thumb.ref)     lines.push(`REF: ${thumb.ref}${thumb.ref_file ? " | Ingredient: " + thumb.ref_file : ""}`);
    if (thumb.subject) lines.push(`SUBJECT: ${thumb.subject}`);
    if (thumb.prompt)  lines.push(`PROMPT: ${thumb.prompt}`);
    if (thumb.avoid)   lines.push(`AVOID: ${thumb.avoid}`);
    if (thumb.file)    lines.push(`FILE: ${thumb.file}`);
    if (thumb.alt)     lines.push(`ALT TEXT: ${thumb.alt}`);
    if (ov.text) {
      lines.push(`OVERLAY TEXT: ${ov.text}`);
      if (ov.placement) lines.push(`  Placement: ${ov.placement}`);
      if (ov.size)      lines.push(`  Size: ${ov.size}`);
      if (ov.weight)    lines.push(`  Weight: ${ov.weight}`);
      if (ov.color)     lines.push(`  Color: ${ov.color}`);
      if (ov.treatment) lines.push(`  Treatment: ${ov.treatment}`);
    }
    if (thumb.verify) lines.push(`VERIFY: ${thumb.verify}`);
    lines.push("", FL_THUMB_FOOTER, "");
  }
  thumbLines(td.thumbnail_a, "THUMBNAIL A");
  thumbLines(td.thumbnail_b, "THUMBNAIL B");

  return lines.join("\n").trimEnd();
}

function renderFlowTitleDesc() {
  Object.keys(flowMetaReg).forEach(k => delete flowMetaReg[k]);
  flowMetaSeq = 0;
  const container = $("#fl-titledesc-content");
  if (!container) return;
  if (!flowTitleDescState) { container.style.display = "none"; container.innerHTML = ""; return; }
  const td = flowTitleDescState;

  const manusText = buildManusPrompt(td);
  const manusKey  = flMetaReg(manusText);

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
  function titleCard(label, val) {
    if (!val) return "";
    const k = flMetaReg(String(val));
    return `<div class="fl-td-title-card">
      <div class="fl-td-title-card-header">
        <span class="fl-td-title-card-label">${escapeHTML(label)}</span>
        <button class="fl-copy-btn fl-copy-btn-sm" data-flmeta="${k}" data-label="Copy ${label}">Copy ${label}</button>
      </div>
      <div class="fl-td-title-text">${escapeHTML(String(val))}</div>
    </div>`;
  }
  function sgaBlock() {
    const sga = td.seo_geo_aeo || {};
    if (!sga.seo_focus && !sga.geo_focus && !sga.aeo_focus) return "";
    function sgaList(label, items) {
      if (!items || !items.length) return "";
      const arr = Array.isArray(items) ? items : [items];
      return `<div class="fl-sga-group">
        <span class="fl-sga-label">${escapeHTML(label)}</span>
        <ul class="fl-sga-list">${arr.map(i => `<li>${escapeHTML(i)}</li>`).join("")}</ul>
      </div>`;
    }
    return `<div class="fl-sga-block">
      <span class="fl-td-label" style="display:block;margin-bottom:8px;">SEO / GEO / AEO Context</span>
      ${sgaList("SEO", sga.seo_focus)}
      ${sgaList("GEO", sga.geo_focus)}
      ${sgaList("AEO", sga.aeo_focus)}
    </div>`;
  }

  container.innerHTML = `<div class="fl-titledesc-panel">
    <div class="fl-td-manus-header">
      <div>
        <div class="fl-panel-title fl-td-title">Title &amp; Description</div>
        <div class="fl-batch-sub">Includes Manus trigger — copy below to run the YouTube Thumbnail Gen skill.</div>
      </div>
      <button class="fl-copy-btn fl-copy-btn-hero" data-flmeta="${manusKey}" data-label="Copy Manus Prompt">Copy Manus Prompt</button>
    </div>
    ${sgaBlock()}
    <div class="fl-td-titles-row">
      ${titleCard("Title A", td.title_a)}
      ${titleCard("Title B", td.title_b)}
    </div>
    ${tdField("YouTube Description", td.youtube_description)}
    ${tdField("Chapters", td.chapters)}
    ${tdField("Tags", td.tags)}
    ${tdField("LinkedIn Caption", td.linkedin_caption)}
    ${tdField("SEO Slug", td.seo_slug)}
    ${buildTDThumbHTML(td.thumbnail_a, "Thumbnail A")}
    ${buildTDThumbHTML(td.thumbnail_b, "Thumbnail B")}
  </div>`;
  container.style.display = "";
  container.addEventListener("click", e => {
    const btn = e.target.closest("[data-flmeta]");
    if (!btn) return;
    const text = flowMetaReg[btn.dataset.flmeta];
    if (text !== undefined) copyToClipboard(text, btn, btn.dataset.label || btn.textContent);
  });
}

function renderFlowShortForm() {
  Object.keys(flowSFReg).forEach(k => delete flowSFReg[k]);
  flowSFSeq = 0;
  const container = $("#fl-shortform-content");
  if (!container) return;
  if (!flowShortFormState) { container.style.display = "none"; container.innerHTML = ""; return; }

  function sfCopy(label, text) {
    if (!text) return "";
    const arr = Array.isArray(text) ? text.join("\n") : String(text);
    const k = flSFReg(arr);
    return `<div class="fl-sf-field">
      <div class="fl-sf-label-row">
        <span class="fl-sf-label">${escapeHTML(label)}</span>
        <button class="fl-copy-btn fl-copy-btn-xs" data-flsf="${k}" data-label="Copy">Copy</button>
      </div>
      <div class="fl-sf-value">${escapeHTML(arr)}</div>
    </div>`;
  }

  function sfMeta(label, text) {
    if (!text) return "";
    return `<div class="fl-sf-meta-row"><span class="fl-sf-meta-label">${escapeHTML(label)}</span><span class="fl-sf-meta-val">${escapeHTML(String(text))}</span></div>`;
  }

  function sfBlock(label, text) {
    if (!text) return "";
    const arr = Array.isArray(text) ? text.join("\n") : String(text);
    const k = flSFReg(arr);
    return `<div class="fl-sf-block">
      <div class="fl-sf-block-header">
        <span class="fl-sf-block-label">${escapeHTML(label)}</span>
        <button class="fl-copy-btn fl-copy-btn-sm" data-flsf="${k}" data-label="Copy">Copy</button>
      </div>
      <textarea class="fl-sf-block-textarea" readonly>${escapeHTML(arr)}</textarea>
    </div>`;
  }

  const renameAppend = flowShortFormState.file_rename_prompt
    ? "\n\n---\n\n" + flowShortFormState.file_rename_prompt
    : "";

  function buildVideoHTML(v, videoLabel) {
    if (!v) return "";
    const p = v.platforms || {};
    const ig = p.instagram || {};
    const yt = p.youtube_short || {};
    const li = p.linkedin || {};
    const agentPromptFull = (v.agent_prompt || "") + renameAppend;

    return `<div class="fl-sf-video-panel">
      <div class="fl-sf-video-header">
        <div class="fl-panel-title">${escapeHTML(videoLabel)}</div>
      </div>
      ${sfBlock(videoLabel.replace("Short Form — ", "") + " — Agent Instructions (paste into Omni Flash Instructions panel)", v.agent_instructions)}
      ${sfBlock(videoLabel.replace("Short Form — ", "") + " — Agent Prompt (paste into Omni Flash Chat — all clips)", agentPromptFull)}
      ${sfBlock(videoLabel.replace("Short Form — ", "") + " — TTS Script (paste into AI Studio)", v.tts_script)}
      <div class="fl-sf-platforms">
        <div class="fl-sf-platform-label">PLATFORMS</div>
        ${sfCopy("Instagram — Caption", ig.caption)}
        ${ig.hashtags?.length ? sfCopy("Instagram — Hashtags", ig.hashtags) : ""}
        ${sfCopy("YouTube Short — Title", yt.title)}
        ${sfCopy("YouTube Short — Description", yt.description)}
        ${yt.tags?.length ? sfCopy("YouTube Short — Tags", yt.tags) : ""}
        ${sfCopy("LinkedIn — Writeup", li.writeup)}
        ${sfMeta("CTA", v.cta)}
      </div>
    </div>`;
  }

  function sfSlug(label, slug) {
    if (!slug) return "";
    const k = flSFReg(slug);
    return `<div class="fl-sf-slug-row">
      <span class="fl-sf-slug-label">${escapeHTML(label)}</span>
      <code class="fl-sf-slug-code">${escapeHTML(slug)}</code>
      <button class="fl-copy-btn fl-copy-btn-xs" data-flsf="${k}" data-label="Copy">Copy</button>
    </div>`;
  }

  const slugA = (flowShortFormState.video_a || {}).seo_slug || "";
  const slugB = (flowShortFormState.video_b || {}).seo_slug || "";
  const seoSlugHTML = (slugA || slugB) ? `<div class="fl-sf-rename-block">
    <div class="fl-sf-slug-header">SEO Filenames</div>
    ${sfSlug("Video A", slugA)}
    ${sfSlug("Video B", slugB)}
  </div>` : "";

  container.innerHTML =
    buildVideoHTML(flowShortFormState.video_a, "Short Form — Video A") +
    buildVideoHTML(flowShortFormState.video_b, "Short Form — Video B") +
    seoSlugHTML;

  container.style.display = "";
  container.addEventListener("click", e => {
    const btn = e.target.closest("[data-flsf]");
    if (!btn) return;
    const text = flowSFReg[btn.dataset.flsf];
    if (text !== undefined) copyToClipboard(text, btn, btn.dataset.label || btn.textContent);
  });
}

/* =========================================================================
 * OPENCLAW ADAPTER LAYER — v1
 * Third tab. Machine-readable task queue, account registry, result
 * write-back (paste-back only), run log, per-card approval flow.
 * Sits on top of existing Deliverables + Flow tabs. Nothing is rebuilt.
 * ========================================================================= */

const OPENCLAW_STORAGE_KEY = "sovereign_openclaw_v1";

const OPENCLAW_ACCOUNT_REGISTRY = [
  { account_key: "linkedin_james_personal",             browser_profile: "linkedin-james",         platform: "LinkedIn",              destination_type: "personal_profile",          destination_url: "https://www.linkedin.com/in/james-riggins-494003173/", notes: "" },
  { account_key: "linkedin_libertyces_company_via_james", browser_profile: "linkedin-james",       platform: "LinkedIn",              destination_type: "company_page",              destination_url: "TBD", notes: "Uses James LinkedIn session if James is the admin." },
  { account_key: "youtube_libertyces_channel",          browser_profile: "google-libertyces",      platform: "YouTube",               destination_type: "youtube_channel_or_youtube_studio", destination_url: "https://studio.youtube.com/", notes: "OpenClaw must verify active channel is LibertyCES before uploading." },
  { account_key: "instagram_libertyces_business",       browser_profile: "meta-libertyces",        platform: "Instagram",             destination_type: "instagram_business_profile", destination_url: "https://www.instagram.com/", notes: "May route through Instagram web or Meta Business Suite depending on runbook." },
  { account_key: "meta_business_libertyces",            browser_profile: "meta-libertyces",        platform: "Meta Business Suite",   destination_type: "business_suite_account",    destination_url: "https://business.facebook.com/", notes: "Used for Instagram/Facebook publishing workflows if needed." },
  { account_key: "google_flow_libertyces",              browser_profile: "google-libertyces",      platform: "Google Flow",           destination_type: "video_generation_tool",     destination_url: "TBD", notes: "Used only for video generation prompts and downloads. OpenClaw does not invent prompts." },
  { account_key: "ai_studio_libertyces_tts",            browser_profile: "google-libertyces",      platform: "Google AI Studio",      destination_type: "tts_audio_generation",      destination_url: "https://aistudio.google.com/", notes: "Used only for TTS/audio generation. OpenClaw pastes dashboard script exactly." },
  { account_key: "chatgpt_libertyces_project",          browser_profile: "chatgpt-benjamin",       platform: "ChatGPT",               destination_type: "specific_chatgpt_project",  destination_url: "TBD", notes: "Must use the specific ChatGPT project with LibertyCES design system loaded. Not a generic chat." },
  { account_key: "manus_libertyces",                    browser_profile: "manus-benjamin",         platform: "Manus",                 destination_type: "manus_workspace",           destination_url: "TBD", notes: "Used for Manus prompts/research relay/carousel workflows. OpenClaw pastes dashboard prompts exactly." },
  { account_key: "squarespace_libertyces_site",         browser_profile: "squarespace-libertyces", platform: "Squarespace",           destination_type: "website_editor",            destination_url: "TBD", notes: "OpenClaw must verify it is editing the LibertyCES site." },
  { account_key: "gcs_libertyces_assets",               browser_profile: "google-libertyces",      platform: "Google Cloud Storage",  destination_type: "storage_bucket_folder",     destination_url: "TBD", bucket_or_folder: "headquarters_001/SovereignHeadquartersWebsite/", notes: "Used for uploading approved image assets only. OpenClaw must follow SEO filename law." }
];

const OC_PLATFORM_ACCOUNT_MAP = {
  "LinkedIn James Post":          "linkedin_james_personal",
  "LinkedIn LibertyCES Post":     "linkedin_libertyces_company_via_james",
  "LinkedIn Newsletter":          "linkedin_libertyces_company_via_james",
  "LinkedIn Carousel":            "linkedin_james_personal",
  "Instagram Video":              "instagram_libertyces_business",
  "Instagram Carousel":           "instagram_libertyces_business",
  "YouTube / NotebookLM Video":   "youtube_libertyces_channel",
  "Short Form Video":             "youtube_libertyces_channel",
  "Solutions Hub | Pillar":       "squarespace_libertyces_site",
  "Solutions Hub | Blog":         "squarespace_libertyces_site",
  "Industries Hub | Pillar":      "squarespace_libertyces_site",
  "Industries Hub | Application": "squarespace_libertyces_site",
  "Manufacturers Hub | Pillar":        "squarespace_libertyces_site",
  "Manufacturers Hub | Product Page":  "squarespace_libertyces_site",
  "Webpage":                      "squarespace_libertyces_site",
  "Product Page":                 "squarespace_libertyces_site",
  "Blog":                         "squarespace_libertyces_site"
};

const OC_PLATFORM_ACTION_MAP = {
  "LinkedIn James Post":          "publish_linkedin_post",
  "LinkedIn LibertyCES Post":     "publish_linkedin_post",
  "LinkedIn Newsletter":          "publish_linkedin_newsletter",
  "LinkedIn Carousel":            "publish_linkedin_carousel",
  "Instagram Video":              "publish_instagram_reel",
  "Instagram Carousel":           "publish_instagram_carousel",
  "YouTube / NotebookLM Video":   "upload_youtube_video",
  "Short Form Video":             "upload_youtube_short",
  "Solutions Hub | Pillar":       "publish_squarespace_html",
  "Solutions Hub | Blog":         "publish_squarespace_html",
  "Industries Hub | Pillar":      "publish_squarespace_html",
  "Industries Hub | Application": "publish_squarespace_html",
  "Manufacturers Hub | Pillar":        "publish_squarespace_html",
  "Manufacturers Hub | Product Page":  "publish_squarespace_html",
  "Webpage":                      "publish_squarespace_html",
  "Product Page":                 "publish_squarespace_html",
  "Blog":                         "publish_squarespace_html"
};

const OC_CTA_PLACEMENT_MAP = {
  "LinkedIn James Post":          "FIRST_PINNED_COMMENT_ONLY",
  "LinkedIn LibertyCES Post":     "FIRST_PINNED_COMMENT_ONLY",
  "LinkedIn Newsletter":          "FIRST_PINNED_COMMENT_ONLY",
  "LinkedIn Carousel":            "FIRST_PINNED_COMMENT_ONLY",
  "Instagram Video":              "NO_OUTBOUND_LINKS_IN_CAPTION",
  "Instagram Carousel":           "NO_OUTBOUND_LINKS_IN_CAPTION",
  "YouTube / NotebookLM Video":   "VIDEO_DESCRIPTION_ONLY",
  "Short Form Video":             "VIDEO_DESCRIPTION_ONLY",
  "Solutions Hub | Pillar":       "HERO_MIDPAGE_FOOTER",
  "Solutions Hub | Blog":         "HERO_MIDPAGE_FOOTER",
  "Industries Hub | Pillar":      "HERO_MIDPAGE_FOOTER",
  "Industries Hub | Application": "HERO_MIDPAGE_FOOTER",
  "Manufacturers Hub | Pillar":        "HERO_MIDPAGE_FOOTER",
  "Manufacturers Hub | Product Page":  "HERO_MIDPAGE_FOOTER",
  "Webpage":                      "HERO_MIDPAGE_FOOTER",
  "Product Page":                 "HERO_MIDPAGE_FOOTER",
  "Blog":                         "HERO_MIDPAGE_FOOTER"
};

/* Runbook patterns that are permitted to update session_status */
const OC_SESSION_RUNBOOK_PATTERNS = ["SESSION_HEALTH", "SESSION_PREFLIGHT", "SESSION_VERIFY", "SESSION_CHECK"];

/* Fields that OpenClaw result packets may NEVER update */
const OC_FORBIDDEN_UPDATE_FIELDS = [
  "title", "caption", "description", "post_body", "script", "prompt",
  "image_blueprint", "cta_text", "cta_url", "approval_status",
  "approved_by", "approved_at", "approval_scope", "destination_url"
];

const OC_APPROVAL = {
  NOT_READY:               "NOT_READY",
  READY_FOR_PREVIEW:       "READY_FOR_PREVIEW",
  PENDING_APPROVAL:        "PENDING_BENJAMIN_APPROVAL",
  APPROVED:                "BENJAMIN_APPROVED",
  REJECTED:                "BENJAMIN_REJECTED",
  REVOKED:                 "REVOKED"
};

/* ---- State ---- */

let openclawState = {
  taskOverrides: {},   // task_id → { approval_status, approved_by, approved_at, session_status, last_openclaw_* }
  runLog: [],          // array of run log entries, newest first
  accountSessions: {}  // account_key → { session_status, last_checked }
};

let ocQueueFilter = "ready";
const ocPacketCopyReg = {};  // packetKey → packet text, rebuilt each renderOCTaskQueue
let ocPendingApprovalId = null; // deliverable .id currently in modal

function loadOpenClaw() {
  try {
    const raw = localStorage.getItem(OPENCLAW_STORAGE_KEY);
    if (raw) openclawState = Object.assign({ taskOverrides: {}, runLog: [], accountSessions: {} }, JSON.parse(raw));
  } catch(e) {}
}

function saveOpenClaw() {
  try { localStorage.setItem(OPENCLAW_STORAGE_KEY, JSON.stringify(openclawState)); } catch(e) {}
}

/* ---- Routing helpers ---- */

function ocAccountKey(platform) { return OC_PLATFORM_ACCOUNT_MAP[platform] || null; }
function ocActionType(platform)  { return OC_PLATFORM_ACTION_MAP[platform] || "unknown"; }
function ocCTAPlacement(platform){ return OC_CTA_PLACEMENT_MAP[platform] || "UNKNOWN"; }
function ocAccountRecord(key)    { return OPENCLAW_ACCOUNT_REGISTRY.find(a => a.account_key === key) || null; }

/* ---- Stable task ID (platform + title slug) ---- */

function ocTaskId(d) {
  return "oc_" + ((d.platform || "") + "_" + (d.deliverable || ""))
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").substring(0, 72);
}

function ocFindDeliverable(taskId) {
  return state.deliverables.find(d => ocTaskId(d) === taskId) || null;
}

/* ---- Execution eligibility ---- */

function ocEligibility(d) {
  const blockers = [];
  const key = ocAccountKey(d.platform);
  if (!key) { blockers.push("No account mapping for platform: " + d.platform); return { executable: false, blockers }; }

  const ov = openclawState.taskOverrides[ocTaskId(d)] || {};
  const approval = ov.approval_status || OC_APPROVAL.NOT_READY;
  if (approval !== OC_APPROVAL.APPROVED) blockers.push("Approval required (current: " + approval + ")");

  const session = ov.session_status || "UNKNOWN";
  if (session !== "HEALTHY") blockers.push("Session not healthy (current: " + session + ")");

  if (!["Approved", "In Progress"].includes(d.status))
    blockers.push("Content status '" + d.status + "' not in executable set [Approved, In Progress]");

  return { executable: blockers.length === 0, blockers };
}

/* ---- Task packet generator ---- */

function ocBuildPacket(d) {
  const taskId = ocTaskId(d);
  const ov = openclawState.taskOverrides[taskId] || {};
  const key = ocAccountKey(d.platform);
  const acct = ocAccountRecord(key);
  const elig = ocEligibility(d);
  const campaignId = ((state.meta.project || state.meta.topic || "unknown") + "_" + (state.meta.client || ""))
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  const pkt = {
    task_id:                  taskId,
    campaign_id:              campaignId,
    platform:                 d.platform,
    account_key:              key || "UNMAPPED",
    browser_profile:          acct ? acct.browser_profile : "UNMAPPED",
    destination_url:          acct ? (acct.destination_url || "TBD") : "TBD",
    action_type:              ocActionType(d.platform),
    runbook_id:               "TBD",
    status:                   d.status,
    approval_status:          ov.approval_status || OC_APPROVAL.NOT_READY,
    approved_by:              ov.approved_by || null,
    approved_at:              ov.approved_at || null,
    session_status:           ov.session_status || "UNKNOWN",
    cta_placement:            ocCTAPlacement(d.platform),
    execution_eligible:       elig.executable,
    blocking_notes:           elig.blockers.join("; ") || "None",
    title:                    d.deliverable,
    url:                      d.url || null,
    media_assets:             [],
    last_updated_at:          new Date().toISOString(),
    last_openclaw_checked_at: ov.last_openclaw_checked_at || null,
    last_openclaw_result:     ov.last_openclaw_result || null,
    last_openclaw_runbook:    ov.last_openclaw_runbook || null,
    last_openclaw_notes:      ov.last_openclaw_notes || null,
    last_openclaw_blocker:    ov.last_openclaw_blocker || null
  };
  return "BEGIN_OPENCLAW_TASK_PACKET_V1\n" + JSON.stringify(pkt, null, 2) + "\nEND_OPENCLAW_TASK_PACKET_V1";
}

/* ---- Result packet parsing + validation ---- */

function ocParseResultPacket(raw) {
  const text = (raw || "").trim();
  const b = text.indexOf("BEGIN_OPENCLAW_RESULT_V1");
  const e = text.indexOf("END_OPENCLAW_RESULT_V1");
  if (b === -1 || e === -1 || e < b)
    throw { code: "RESULT_REJECTED_INVALID_PACKET", message: "Missing or mismatched BEGIN/END_OPENCLAW_RESULT_V1 wrapper." };
  const inner = text.slice(b + "BEGIN_OPENCLAW_RESULT_V1".length, e).trim();
  try { return JSON.parse(inner); }
  catch(err) { throw { code: "RESULT_REJECTED_INVALID_PACKET", message: "Invalid JSON: " + err.message }; }
}

function ocValidateResultPacket(pkt) {
  if (!pkt.task_id)
    throw { code: "RESULT_REJECTED_MISSING_TASK", message: "task_id is missing from result packet." };
  if (!pkt.runbook_id)
    throw { code: "RESULT_REJECTED_INVALID_PACKET", message: "runbook_id is missing from result packet." };

  const d = ocFindDeliverable(pkt.task_id);
  if (!d)
    throw { code: "RESULT_REJECTED_MISSING_TASK", message: "task_id '" + pkt.task_id + "' does not match any deliverable in the current dashboard." };

  const expectedKey = ocAccountKey(d.platform);
  if (pkt.account_key && pkt.account_key !== expectedKey)
    throw { code: "RESULT_REJECTED_ACCOUNT_MISMATCH", message: "account_key '" + pkt.account_key + "' does not match expected '" + expectedKey + "' for platform '" + d.platform + "'." };

  const acct = ocAccountRecord(expectedKey);
  if (acct && pkt.browser_profile && pkt.browser_profile !== acct.browser_profile)
    throw { code: "RESULT_REJECTED_PROFILE_MISMATCH", message: "browser_profile '" + pkt.browser_profile + "' does not match expected '" + acct.browser_profile + "'." };

  for (const field of OC_FORBIDDEN_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(pkt, field))
      throw { code: "RESULT_REJECTED_FORBIDDEN_FIELD", message: "Result packet contains forbidden field '" + field + "'. OpenClaw may not update content or approval fields." };
  }

  return d;
}

function ocApplyResultPacket(pkt, d) {
  const taskId = pkt.task_id;
  if (!openclawState.taskOverrides[taskId]) openclawState.taskOverrides[taskId] = {};
  const ov = openclawState.taskOverrides[taskId];

  if (pkt.last_openclaw_checked_at) ov.last_openclaw_checked_at = pkt.last_openclaw_checked_at;
  if (pkt.last_openclaw_result)     ov.last_openclaw_result     = pkt.last_openclaw_result;
  if (pkt.runbook_id)               ov.last_openclaw_runbook    = pkt.runbook_id;
  if (pkt.notes)                    ov.last_openclaw_notes      = pkt.notes;
  if (pkt.blocker)                  ov.last_openclaw_blocker    = pkt.blocker;

  // session_status: only permitted for session verification runbooks
  const isSessionRunbook = OC_SESSION_RUNBOOK_PATTERNS.some(p => (pkt.runbook_id || "").toUpperCase().includes(p));
  if (isSessionRunbook && (pkt.session_status || pkt.result)) {
    ov.session_status = pkt.session_status || (pkt.result === "SESSION_HEALTHY" ? "HEALTHY" : "UNKNOWN");
  }

  // Append run log entry
  const entry = {
    run_id:        pkt.run_id || ("oc_run_" + Date.now()),
    task_id:       pkt.task_id,
    runbook_id:    pkt.runbook_id,
    timestamp:     pkt.last_openclaw_checked_at || new Date().toISOString(),
    result:        pkt.result || pkt.last_openclaw_result || "UNKNOWN",
    blocker:       pkt.blocker || "None",
    notes:         pkt.notes || "",
    status_before: pkt.status_before || d.status || "",
    status_after:  pkt.status_after  || pkt.status_before || d.status || "",
    platform:      d.platform,
    account_key:   pkt.account_key || ocAccountKey(d.platform) || ""
  };
  openclawState.runLog.unshift(entry);
  if (openclawState.runLog.length > 500) openclawState.runLog.length = 500;
  saveOpenClaw();
  return entry;
}

/* ---- Approval flow ---- */

function ocOpenApprovalModal(d) {
  ocPendingApprovalId = d.id;
  const taskId = ocTaskId(d);
  const ov = openclawState.taskOverrides[taskId] || {};
  const key = ocAccountKey(d.platform);
  const acct = ocAccountRecord(key);
  const elig = ocEligibility(d);
  const isApproved = ov.approval_status === OC_APPROVAL.APPROVED;

  function row(label, val, cls) {
    return `<div class="oc-modal-field">
      <span class="oc-modal-field-label">${escapeHTML(label)}</span>
      <span class="oc-modal-field-value${cls ? " " + cls : ""}">${escapeHTML(String(val == null ? "—" : val))}</span>
    </div>`;
  }

  const blockerHTML = elig.blockers.length
    ? elig.blockers.map(b => `<div class="oc-modal-blocker">⚠ ${escapeHTML(b)}</div>`).join("")
    : `<div class="oc-modal-ok">✓ No blockers detected</div>`;

  $("#oc-modal-body").innerHTML = `
    <div class="oc-modal-section oc-modal-eligibility ${elig.executable ? "oc-elig-ok" : "oc-elig-blocked"}">
      <div class="oc-modal-section-title">Execution Eligibility</div>
      <div class="oc-elig-status">${elig.executable ? "EXECUTABLE" : "BLOCKED"}</div>
      ${blockerHTML}
    </div>
    <div class="oc-modal-section">
      <div class="oc-modal-section-title">Task</div>
      ${row("task_id", taskId)}
      ${row("action_type", ocActionType(d.platform))}
      ${row("platform", d.platform)}
      ${row("deliverable", d.deliverable)}
      ${d.url ? row("url", d.url) : ""}
    </div>
    <div class="oc-modal-section">
      <div class="oc-modal-section-title">Account & Routing</div>
      ${row("account_key", key || "UNMAPPED")}
      ${row("browser_profile", acct ? acct.browser_profile : "UNMAPPED")}
      ${row("destination_url", acct ? acct.destination_url : "UNMAPPED")}
      ${row("cta_placement", ocCTAPlacement(d.platform))}
    </div>
    <div class="oc-modal-section">
      <div class="oc-modal-section-title">Current Status</div>
      ${row("content_status", d.status)}
      ${row("approval_status", ov.approval_status || OC_APPROVAL.NOT_READY)}
      ${ov.approved_at ? row("approved_at", ov.approved_at) : ""}
      ${row("session_status", ov.session_status || "UNKNOWN")}
      ${ov.last_openclaw_result ? row("last_openclaw_result", ov.last_openclaw_result) : ""}
    </div>`;

  $("#oc-modal-confirm").textContent = isApproved ? "Re-Confirm Approval" : "Confirm Approval";
  $("#oc-modal-revoke").style.display = isApproved ? "" : "none";
  $("#oc-approval-modal").style.display = "flex";
}

function ocCloseModal() {
  $("#oc-approval-modal").style.display = "none";
  ocPendingApprovalId = null;
}

function ocConfirmApproval() {
  if (!ocPendingApprovalId) return;
  const d = findById(ocPendingApprovalId);
  if (!d) return;
  const taskId = ocTaskId(d);
  if (!openclawState.taskOverrides[taskId]) openclawState.taskOverrides[taskId] = {};
  const ov = openclawState.taskOverrides[taskId];
  ov.approval_status = OC_APPROVAL.APPROVED;
  ov.approved_by     = "Benjamin";
  ov.approved_at     = new Date().toISOString();
  ov.approval_scope  = taskId + "::" + ocActionType(d.platform);
  saveOpenClaw();
  ocCloseModal();
  renderOpenClawTab();
  renderSections();
  showMessage("OpenClaw approval granted: " + taskId, "success");
}

function ocRevokeApproval(taskId) {
  if (!openclawState.taskOverrides[taskId]) openclawState.taskOverrides[taskId] = {};
  const ov = openclawState.taskOverrides[taskId];
  ov.approval_status = OC_APPROVAL.REVOKED;
  ov.approved_by     = null;
  ov.approved_at     = null;
  saveOpenClaw();
  ocCloseModal();
  renderOpenClawTab();
  renderSections();
  showMessage("OpenClaw approval revoked.", "warn");
}

/* ---- OpenClaw tab rendering ---- */

function renderOpenClawTab() {
  renderOCAccountRegistry();
  renderOCTaskQueue();
  renderOCRunLog();
}

function renderOCAccountRegistry() {
  const el = $("#oc-account-registry");
  if (!el) return;
  const rows = OPENCLAW_ACCOUNT_REGISTRY.map(a => {
    const sess = (openclawState.accountSessions[a.account_key] || {}).session_status || "UNKNOWN";
    const sc = sess === "HEALTHY" ? "oc-sess-healthy" : sess === "UNKNOWN" ? "oc-sess-unknown" : "oc-sess-blocked";
    const urlDisplay = (!a.destination_url || a.destination_url === "TBD")
      ? `<span class="oc-tbd">TBD</span>`
      : `<a href="${escapeHTML(a.destination_url)}" target="_blank" rel="noopener">${escapeHTML(a.destination_url)}</a>`;
    return `<tr>
      <td><code class="oc-code">${escapeHTML(a.account_key)}</code></td>
      <td><code class="oc-code">${escapeHTML(a.browser_profile)}</code></td>
      <td>${escapeHTML(a.platform)}</td>
      <td class="oc-url-cell">${urlDisplay}</td>
      <td><span class="oc-sess-badge ${sc}">${escapeHTML(sess)}</span></td>
    </tr>`;
  }).join("");
  el.innerHTML = `<div class="oc-table-wrap"><table class="oc-reg-table">
    <thead><tr><th>account_key</th><th>browser_profile</th><th>platform</th><th>destination_url</th><th>session</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderOCTaskQueue() {
  const el = $("#oc-task-queue");
  if (!el) return;

  // Clear + rebuild packet copy registry
  Object.keys(ocPacketCopyReg).forEach(k => delete ocPacketCopyReg[k]);

  buildDeliverableLabelMap();
  const mapped = state.deliverables.filter(d => ocAccountKey(d.platform));
  const tasks  = mapped.map(d => ({ d, elig: ocEligibility(d), ov: openclawState.taskOverrides[ocTaskId(d)] || {} }));
  const ready   = tasks.filter(t => t.elig.executable);
  const blocked = tasks.filter(t => !t.elig.executable);
  const display = ocQueueFilter === "ready" ? ready : ocQueueFilter === "blocked" ? blocked : tasks;

  // Update filter button labels
  $all(".oc-filter-btn").forEach(btn => {
    const f = btn.dataset.filter;
    const n = f === "ready" ? ready.length : f === "blocked" ? blocked.length : tasks.length;
    const label = f === "ready" ? "Ready" : f === "blocked" ? "Blocked" : "All";
    btn.textContent = `${label} (${n})`;
    btn.classList.toggle("oc-filter-active", f === ocQueueFilter);
  });

  if (!state.deliverables.length) {
    el.innerHTML = `<p class="oc-empty">No deliverables imported yet. Import a Claude packet in the Deliverables tab first.</p>`;
    return;
  }
  if (!display.length) {
    el.innerHTML = `<p class="oc-empty">No ${ocQueueFilter === "all" ? "" : ocQueueFilter + " "}tasks.</p>`;
    return;
  }

  el.innerHTML = display.map(({ d, elig, ov }) => {
    const taskId = ocTaskId(d);
    const approval = ov.approval_status || OC_APPROVAL.NOT_READY;
    const approvalCls = approval === OC_APPROVAL.APPROVED ? "oc-appr-approved"
      : approval === OC_APPROVAL.REVOKED ? "oc-appr-revoked"
      : approval === OC_APPROVAL.REJECTED ? "oc-appr-rejected"
      : "oc-appr-pending";

    const pktKey = "ocpkt_" + taskId;
    ocPacketCopyReg[pktKey] = ocBuildPacket(d);

    const lastResult = ov.last_openclaw_result
      ? `<div class="oc-task-last">Last: <strong>${escapeHTML(ov.last_openclaw_result)}</strong>${ov.last_openclaw_checked_at ? " · " + escapeHTML(ov.last_openclaw_checked_at) : ""}</div>`
      : "";

    return `<div class="oc-task-card ${elig.executable ? "oc-task-ready" : "oc-task-blocked"}" data-task-id="${escapeHTML(taskId)}">
      <div class="oc-task-top">
        <span class="oc-task-del-label">${escapeHTML(getDeliverableLabel(d) || d.platform)}</span>
        <span class="oc-appr-badge ${approvalCls}">${escapeHTML(approval)}</span>
        <span class="oc-exec-badge ${elig.executable ? "oc-exec-yes" : "oc-exec-no"}">${elig.executable ? "EXECUTABLE" : "BLOCKED"}</span>
      </div>
      <div class="oc-task-title">${escapeHTML(d.deliverable)}</div>
      <code class="oc-task-id">${escapeHTML(taskId)}</code>
      ${elig.blockers.length ? `<div class="oc-task-blockers">${elig.blockers.map(b => `<div class="oc-blocker-line">⚠ ${escapeHTML(b)}</div>`).join("")}</div>` : ""}
      ${lastResult}
      <div class="oc-task-actions">
        <button class="btn-mini" data-oc-approve="${escapeHTML(d.id)}">${approval === OC_APPROVAL.APPROVED ? "Re-Approve / Review" : "Approve for OpenClaw"}</button>
        ${approval === OC_APPROVAL.APPROVED ? `<button class="btn-mini btn-danger" data-oc-revoke="${escapeHTML(taskId)}">Revoke</button>` : ""}
        <button class="btn-mini" data-oc-copy-packet="${escapeHTML(pktKey)}">Copy Task Packet</button>
      </div>
    </div>`;
  }).join("");
}

function renderOCRunLog() {
  const el = $("#oc-run-log");
  if (!el) return;
  if (!openclawState.runLog.length) {
    el.innerHTML = `<p class="oc-empty">No runs logged yet.</p>`;
    return;
  }
  const rows = openclawState.runLog.map(entry => {
    const rc = ["PASS","SESSION_HEALTHY","SUCCESS","COMPLETE"].includes(entry.result) ? "oc-res-pass"
      : ["FAIL","ERROR","BLOCKED"].includes(entry.result) ? "oc-res-fail" : "oc-res-unknown";
    const statusChange = entry.status_before !== entry.status_after
      ? `${escapeHTML(entry.status_before)} → ${escapeHTML(entry.status_after)}`
      : escapeHTML(entry.status_before || "—");
    return `<tr>
      <td><code class="oc-code oc-code-sm">${escapeHTML(entry.run_id)}</code></td>
      <td><code class="oc-code oc-code-sm">${escapeHTML(entry.task_id)}</code></td>
      <td>${escapeHTML(entry.runbook_id)}</td>
      <td class="oc-ts">${escapeHTML(entry.timestamp)}</td>
      <td><span class="oc-res-badge ${rc}">${escapeHTML(entry.result)}</span></td>
      <td>${statusChange}</td>
      <td>${escapeHTML(entry.blocker || "None")}</td>
      <td>${escapeHTML(entry.notes || "")}</td>
    </tr>`;
  }).join("");
  el.innerHTML = `<p class="oc-log-count">${openclawState.runLog.length} run${openclawState.runLog.length !== 1 ? "s" : ""} logged</p>
    <div class="oc-table-wrap">
      <table class="oc-log-table">
        <thead><tr><th>run_id</th><th>task_id</th><th>runbook_id</th><th>timestamp</th><th>result</th><th>status</th><th>blocker</th><th>notes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ---- Card OC section (shown on deliverable cards for mapped platforms) ---- */

function renderCardOCSection(d) {
  const key = ocAccountKey(d.platform);
  if (!key) return "";
  const taskId = ocTaskId(d);
  const ov = openclawState.taskOverrides[taskId] || {};
  const elig = ocEligibility(d);
  const approval = ov.approval_status || OC_APPROVAL.NOT_READY;
  const approvalCls = approval === OC_APPROVAL.APPROVED ? "oc-appr-approved"
    : approval === OC_APPROVAL.REVOKED ? "oc-appr-revoked"
    : "oc-appr-pending";

  return `<div class="card-oc-section">
    <div class="card-oc-row">
      <span class="card-oc-label">OpenClaw</span>
      <span class="oc-appr-badge ${approvalCls} oc-badge-sm">${escapeHTML(approval)}</span>
      <span class="oc-exec-badge ${elig.executable ? "oc-exec-yes" : "oc-exec-no"} oc-badge-sm">${elig.executable ? "EXECUTABLE" : "BLOCKED"}</span>
      <button class="btn-mini btn-oc-approve" data-oc-approve="${escapeHTML(d.id)}">${approval === OC_APPROVAL.APPROVED ? "Review / Re-Approve" : "Approve for OpenClaw"}</button>
      ${approval === OC_APPROVAL.APPROVED ? `<button class="btn-mini btn-danger btn-oc-revoke" data-oc-revoke="${escapeHTML(taskId)}">Revoke</button>` : ""}
    </div>
  </div>`;
}

/* =========================================================================
 * SOVEREIGN_CAROUSEL_V1 — Step 14 carousel production dashboard
 * Two carousel packages (A + B) plus a stable Manus permanent skill.
 * Import via BEGIN_SOVEREIGN_CAROUSEL_V1 … END_SOVEREIGN_CAROUSEL_V1.
 * ========================================================================= */

const CAROUSEL_STORAGE_KEY = "sovereign_carousel_v2";
let   carouselRuns         = [];   // array of { id, imported_at, campaign_id, manus_permanent_skill, carousel_a, carousel_b }
let   crCopyReg            = {};
let   crKeySeq             = 0;

function crReg(content) {
  const k = "cr_" + (++crKeySeq);
  crCopyReg[k] = content;
  return k;
}

function parseCarouselPacket(raw) {
  const OPEN  = "BEGIN_SOVEREIGN_CAROUSEL_V1";
  const CLOSE = "END_SOVEREIGN_CAROUSEL_V1";
  let text = raw.trim();
  const s = text.indexOf(OPEN);
  const e = text.indexOf(CLOSE);
  if (s !== -1 && e !== -1) text = text.slice(s + OPEN.length, e).trim();
  return JSON.parse(text);
}

function saveCarousel() {
  try { localStorage.setItem(CAROUSEL_STORAGE_KEY, JSON.stringify(carouselRuns)); } catch(err) {}
}
function loadCarousel() {
  try {
    const r = localStorage.getItem(CAROUSEL_STORAGE_KEY);
    if (r) {
      const parsed = JSON.parse(r);
      carouselRuns = Array.isArray(parsed) ? parsed : [];
    }
  } catch(err) {}
}

/* ---- Carousel render helpers ---- */

function crBlock(label, text, large) {
  if (!text) return "";
  const str = Array.isArray(text) ? text.join("\n") : String(text);
  const k = crReg(str);
  return `<div class="cr-block">
    <div class="cr-block-header">
      <span class="cr-block-label">${escapeHTML(label)}</span>
      <button class="fl-copy-btn fl-copy-btn-sm" data-crkb="${k}" data-label="Copy">Copy</button>
    </div>
    <textarea class="cr-block-textarea${large ? " cr-block-textarea-lg" : ""}" readonly>${escapeHTML(str)}</textarea>
  </div>`;
}

function crChip(label, text) {
  if (!text) return "";
  const str = Array.isArray(text) ? text.join("  ") : String(text);
  const k = crReg(str);
  return `<div class="cr-chip-row">
    <span class="cr-chip-label">${escapeHTML(label)}</span>
    <code class="cr-chip-code">${escapeHTML(str)}</code>
    <button class="fl-copy-btn fl-copy-btn-xs" data-crkb="${k}" data-label="Copy">Copy</button>
  </div>`;
}

const CR_VT_CLASS = {
  PRODUCT_REF:        "cr-vt-product",
  FAILURE_UNBRANDED:  "cr-vt-failure",
  DIAGRAM:            "cr-vt-diagram",
  CAD_3D:             "cr-vt-diagram",
  TABLE_MATRIX:       "cr-vt-matrix",
  BLUEPRINT_CARD:     "cr-vt-matrix",
  SPEC_CROP:          "cr-vt-matrix",
  ANNOTATED_PHOTO:    "cr-vt-annotated",
  TEXT_POSTER:        "cr-vt-text",
};

function renderCarouselSlide(s) {
  if (!s) return "";
  const vt = (s.visual_type || "").toUpperCase();
  const vtClass = CR_VT_CLASS[vt] || "";
  const vtBadge = vt ? `<span class="cr-visual-badge ${vtClass}">${escapeHTML(s.visual_type)}</span>` : "";
  const refInfo = s.ref
    ? `<div class="cr-slide-ref">Ref: <strong>${escapeHTML(s.ref)}</strong>${s.ref_file ? ` — ${escapeHTML(s.ref_file)}` : ""}</div>`
    : "";
  const bpKey  = s.image_blueprint ? crReg(s.image_blueprint) : "";
  const bpHTML = s.image_blueprint ? `<div class="cr-block cr-bp-block">
    <div class="cr-block-header">
      <span class="cr-block-label">Image Blueprint</span>
      <button class="fl-copy-btn fl-copy-btn-xs" data-crkb="${bpKey}" data-label="Copy">Copy</button>
    </div>
    <textarea class="cr-block-textarea cr-bp-textarea" readonly>${escapeHTML(s.image_blueprint)}</textarea>
  </div>` : "";
  const standAlone = s.standalone_statement
    ? `<div class="cr-standalone"><span class="cr-standalone-label">Standalone:</span> ${escapeHTML(s.standalone_statement)}</div>`
    : "";

  return `<div class="cr-slide-card">
    <div class="cr-slide-card-header">
      <span class="cr-slide-num">Slide ${s.slide ?? "?"}</span>
      <span class="cr-slide-job">${escapeHTML(s.job || "")}</span>
      ${vtBadge}
    </div>
    <div class="cr-slide-headline">${escapeHTML(s.headline || "")}</div>
    ${s.copy ? `<div class="cr-slide-copy">${escapeHTML(s.copy)}</div>` : ""}
    ${refInfo}
    ${bpHTML}
    ${standAlone}
  </div>`;
}

function renderCarouselBox(c, label) {
  if (!c) return "";
  const typeBadge   = c.carousel_type ? `<span class="cr-type-badge">${escapeHTML(c.carousel_type)}</span>` : "";
  const viralFilter = c.viral_filter  ? `<div class="cr-viral-filter">${escapeHTML(c.viral_filter)}</div>`  : "";
  const hook        = c.hook          ? `<blockquote class="cr-hook">${escapeHTML(c.hook)}</blockquote>`     : "";
  const slides      = (c.slide_map || []);
  const slidesHTML  = slides.map(renderCarouselSlide).join("");
  const igHashtags  = Array.isArray(c.instagram_hashtags)
    ? c.instagram_hashtags.join("  ")
    : (c.instagram_hashtags || "");

  return `<div class="cr-carousel-box">
    <div class="cr-carousel-box-header">
      <span class="cr-carousel-box-label">${escapeHTML(label)}</span>
      ${typeBadge}
    </div>
    ${viralFilter}
    ${hook}

    <div class="cr-slides-section">
      <div class="cr-slides-section-label">Slide Map — ${slides.length} slide${slides.length !== 1 ? "s" : ""}</div>
      <div class="cr-slide-map">${slidesHTML}</div>
    </div>

    <div class="cr-production-section">
      ${crBlock("Reference Image Sourcing Brief — gather these before running Manus", c.reference_image_brief, true)}
      ${crBlock("Manus Prompt — paste into Manus Chat (all slides sequential)", c.manus_prompt, true)}
    </div>

    <div class="cr-platform-section">
      <div class="cr-platform-header">Instagram</div>
      ${crBlock("Instagram Caption", c.instagram_caption)}
      ${igHashtags ? crChip("Instagram Hashtags", igHashtags) : ""}
    </div>

    <div class="cr-platform-section">
      <div class="cr-platform-header">LinkedIn</div>
      ${crBlock("LinkedIn Writeup", c.linkedin_writeup)}
    </div>

    <div class="cr-chips-row">
      ${c.pdf_title ? crChip("PDF Title for LinkedIn", c.pdf_title) : ""}
      ${c.seo_slug  ? crChip("SEO Slug", c.seo_slug)               : ""}
    </div>
  </div>`;
}

function renderCarouselTab() {
  const manusPanel = $("#cr-manus-skill-panel");
  const content    = $("#cr-content");

  if (!carouselRuns || carouselRuns.length === 0) {
    if (manusPanel) manusPanel.style.display = "none";
    if (content)  { content.style.display = "none"; content.innerHTML = ""; }
    return;
  }

  // Manus permanent skill — use most recently imported run's skill
  const latestSkill = carouselRuns.find(r => r.manus_permanent_skill)?.manus_permanent_skill;
  if (latestSkill && manusPanel) {
    const ta = $("#cr-manus-skill-textarea");
    if (ta) ta.value = latestSkill;
    manusPanel.style.display = "";
  }

  // Reset copy registry before re-rendering
  Object.keys(crCopyReg).forEach(k => delete crCopyReg[k]);
  crKeySeq = 0;

  content.innerHTML = carouselRuns.map(run => {
    const ts       = run.imported_at ? new Date(run.imported_at).toLocaleString() : "";
    const campaign = run.campaign_id || "Untitled Campaign";
    const aCount   = run.carousel_a?.slide_map?.length || 0;
    const bCount   = run.carousel_b?.slide_map?.length || 0;
    return `<div class="cr-run-card" data-crid="${escapeHTML(run.id)}">
      <div class="cr-run-header">
        <button class="cr-run-collapse-btn" data-cr-collapse="${escapeHTML(run.id)}" title="Collapse / expand">▼</button>
        <div class="cr-run-meta">
          <span class="cr-run-campaign">${escapeHTML(campaign)}</span>
          <span class="cr-run-slide-count">${aCount + bCount} slides</span>
          <span class="cr-run-ts">${escapeHTML(ts)}</span>
        </div>
        <button class="cr-run-remove-btn" data-cr-remove="${escapeHTML(run.id)}">× Remove</button>
      </div>
      <div class="cr-run-body">
        ${renderCarouselBox(run.carousel_a, "Carousel A")}
        ${renderCarouselBox(run.carousel_b, "Carousel B")}
      </div>
    </div>`;
  }).join("");
  content.style.display = "";
}

/* =========================================================================
 * TAB SWITCHING HELPER
 * ========================================================================= */

function switchTab(target) {
  const btn = document.querySelector(`.tab-btn[data-tab="${target}"]`);
  if (btn) btn.click();
}

/* =========================================================================
 * GLOBAL ATTENTION BAR
 * Always visible above the tab nav. Shows Benjamin what needs his attention
 * right now — Hermes blockers and tasks awaiting approval — regardless of
 * which tab is active. Updated after every state change.
 * ========================================================================= */

function renderAttentionBar() {
  const bar = document.getElementById("global-attention-bar");
  if (!bar) return;

  const items = [];

  // ── Hermes blockers ──────────────────────────────────────────────────────
  // Find task_ids where the most recent run log entry is blocked/failed/needs_input
  // (i.e., not subsequently resolved by a success entry).
  const latestByTask = new Map();
  [...exRunLog].reverse().forEach(r => {
    if (r.task_id && !latestByTask.has(r.task_id)) latestByTask.set(r.task_id, r);
  });
  const activeBlockers = [...latestByTask.values()].filter(
    r => r.status === "blocked" || r.status === "failed" || r.status === "needs_input"
  );

  if (activeBlockers.length > 0) {
    const b = activeBlockers[0];
    const more = activeBlockers.length > 1 ? ` +${activeBlockers.length - 1} more` : "";
    items.push(`
      <div class="gab-item gab-blocker">
        <span class="gab-dot gab-dot-blocked"></span>
        <div class="gab-text">
          <span class="gab-label">Hermes blocked — your action needed${escapeHTML(more)}</span>
          <span class="gab-detail">${escapeHTML(b.blocking_reason || b.notes || "No reason specified")} · ${escapeHTML(b.task_id || "")}</span>
        </div>
        <button class="btn btn-sm gab-action" data-gab-goto="execution">View</button>
      </div>`);
  }

  // ── Pending approvals ─────────────────────────────────────────────────────
  // Deliverables with an account mapping that Benjamin hasn't approved yet.
  const pendingApprovals = (state.deliverables || []).filter(d => {
    if (!ocAccountKey(d.platform)) return false;
    const ov = openclawState.taskOverrides[ocTaskId(d)] || {};
    return ov.approval_status !== OC_APPROVAL.APPROVED;
  });

  if (pendingApprovals.length > 0) {
    items.push(`
      <div class="gab-item gab-approval">
        <span class="gab-dot gab-dot-approval"></span>
        <div class="gab-text">
          <span class="gab-label">${pendingApprovals.length} task${pendingApprovals.length !== 1 ? "s" : ""} awaiting your approval</span>
          <span class="gab-detail">Approve in the OpenClaw tab to authorize Hermes to execute</span>
        </div>
        <button class="btn btn-sm gab-action" data-gab-goto="openclaw">Approve</button>
      </div>`);
  }

  // ── Pending session approval for loaded packet ────────────────────────────
  if (exPacketState?.account_key && exPacketState.approval_policy === "SESSION_ACCOUNT") {
    const key  = exPacketState.account_key;
    const appr = exSessionApprovals[key];
    if (!appr?.approved) {
      items.push(`
        <div class="gab-item gab-approval">
          <span class="gab-dot gab-dot-approval"></span>
          <div class="gab-text">
            <span class="gab-label">Session approval needed: ${escapeHTML(key)}</span>
            <span class="gab-detail">Approve once this session to clear all packets for this account</span>
          </div>
          <button class="btn btn-sm gab-action" data-gab-goto="execution">Approve</button>
        </div>`);
    }
  }

  if (items.length === 0) {
    bar.style.display = "none";
    bar.innerHTML = "";
    return;
  }

  bar.innerHTML = items.join("");
  bar.style.display = "";

  bar.querySelectorAll("[data-gab-goto]").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.gabGoto));
  });
}

/* =========================================================================
 * MANUAL HANDOFF CHECKLIST
 * Shown in the Execution tab prompt panel when executor = "manual".
 * Benjamin follows these steps himself instead of Hermes.
 * ========================================================================= */

function buildManualHandoffChecklist(pkt) {
  const lines = [
    "MANUAL HANDOFF — Complete this task yourself",
    "=".repeat(52),
    "",
    `Task:      ${pkt.task_id    || "—"}`,
    `Platform:  ${pkt.platform   || "—"}`,
    `Action:    ${pkt.action_type|| "—"}`,
    "",
    "ACCOUNT",
    `  Key:     ${pkt.account_key     || "—"}`,
    `  Profile: ${pkt.browser_profile || "—"}`,
    "",
    "STEPS",
    `  1. Go to: ${pkt.destination_url || "[destination]"}`,
    `  2. Confirm you are logged in as: ${pkt.account_key || "[account]"}`,
    "  3. Open the post composer.",
  ];

  if (pkt.post_body_source) {
    lines.push("  4. Paste this content VERBATIM — do not change a single character:");
    lines.push("");
    lines.push("---");
    lines.push(pkt.post_body_source);
    lines.push("---");
    lines.push("");
  } else {
    lines.push("  4. Paste your approved content.");
  }

  const cta = pkt.cta_placement || "";
  if (cta) {
    lines.push(`  5. CTA rule: ${cta}`);
    if (cta.includes("PINNED_COMMENT"))      lines.push("     → After posting, paste the lead magnet URL as the FIRST pinned comment.");
    if (cta.includes("VIDEO_DESCRIPTION"))   lines.push("     → Include the lead magnet URL in the video description.");
    if (cta.includes("HERO_MIDPAGE_FOOTER")) lines.push("     → Lead magnet CTA must appear in hero, mid-page, and footer.");
  }

  lines.push("  6. Do NOT alter any content — post verbatim.");
  lines.push("  7. Publish.");
  lines.push("");

  if (Array.isArray(pkt.hard_stop) && pkt.hard_stop.length > 0) {
    lines.push("HARD STOPS — obey all:");
    pkt.hard_stop.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
    lines.push("");
  }

  lines.push("WHEN DONE");
  lines.push("  Return a BEGIN_EXECUTION_RESULT_V1 packet to the dashboard with the live post URL.");

  return lines.join("\n");
}

/* =========================================================================
 * MACHINE-READABLE STATE + SOVEREIGN DASHBOARD API
 * Keeps the <script type="application/json"> tags in sync after every
 * state change so Hermes (and any executor) can read the full dashboard
 * state via document.getElementById(id).textContent without touching the UI.
 * ========================================================================= */

function updateMachineReadableState() {
  function setTag(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = JSON.stringify(val, null, 2);
  }

  // Execution packet — the current task Hermes should run
  setTag("execution-packet", exPacketState || {});

  // Carousel runs — summary per run (full data available via carouselRuns JS var)
  setTag("carousel-data", (carouselRuns || []).map(r => ({
    id:              r.id,
    imported_at:     r.imported_at,
    campaign_id:     r.campaign_id || "",
    carousel_a_type: r.carousel_a?.carousel_type || null,
    carousel_a_slides: r.carousel_a?.slide_map?.length || 0,
    carousel_b_type: r.carousel_b?.carousel_type || null,
    carousel_b_slides: r.carousel_b?.slide_map?.length || 0,
  })));

  // Deliverables summary
  const dels = state?.deliverables || [];
  setTag("deliverables-data", {
    total:       dels.length,
    published:   dels.filter(d => d.status === "published").length,
    unpublished: dels.filter(d => d.status !== "published").length,
    platforms:   [...new Set(dels.map(d => d.platform).filter(Boolean))],
  });

  // Flow summary
  setTag("flow-data", flowState ? {
    loaded:     true,
    campaign_id: flowState.campaign_id || null,
    video_title: flowState.video_title || null,
    batch_count: (flowState.batches || []).length,
  } : { loaded: false });

  // Keep the attention bar in sync on every state change
  renderAttentionBar();

  // Dashboard manifest — everything Hermes needs to orient itself
  setTag("dashboard-manifest", {
    schema_version: "SOVEREIGN_DASHBOARD_MANIFEST_V1",
    updated_at: new Date().toISOString(),
    tabs: {
      execution: {
        packet_loaded:   !!exPacketState,
        task_id:         exPacketState?.task_id         || null,
        approval_status: exPacketState?.approval_status || null,
        run_mode:        exPacketState?.run_mode        || null,
        executor:        exPacketState?.executor        || null,
        platform:        exPacketState?.platform        || null,
      },
      carousels: {
        run_count: (carouselRuns || []).length,
        campaigns: (carouselRuns || []).map(r => r.campaign_id).filter(Boolean),
      },
      deliverables: {
        total:     dels.length,
        published: dels.filter(d => d.status === "published").length,
      },
      flow: { loaded: !!flowState },
    },
    hermes_interface: {
      note: "Hermes has two interaction paths: JS API (preferred) or UI selectors (fallback).",
      js_api: "window.SovereignDashboard",
      read_tags: {
        manifest:          "document.getElementById('dashboard-manifest').textContent",
        execution_packet:  "document.getElementById('execution-packet').textContent",
        carousel_data:     "document.getElementById('carousel-data').textContent",
        deliverables_data: "document.getElementById('deliverables-data').textContent",
        flow_data:         "document.getElementById('flow-data').textContent",
      },
      ui_selectors: {
        execution_packet:  { textarea: "#ex-import-box",   button: "#btn-ex-import" },
        execution_result:  { textarea: "#ex-result-box",   button: "#btn-ex-result-import" },
        carousel:          { textarea: "#cr-import-box",   button: "#btn-cr-import" },
        deliverables:      { textarea: "#import-box",      button: "#btn-import" },
        flow:              { textarea: "#fl-import-box",   button: "#btn-fl-import" },
      },
    },
  });
}

/* ---- SovereignDashboard JS API — preferred Hermes interface ---- */
window.SovereignDashboard = {
  version: "1.0",

  /* Read the full manifest */
  getManifest() {
    try { return JSON.parse(document.getElementById("dashboard-manifest").textContent); } catch(e) { return null; }
  },

  /* Import an execution packet (replaces current) */
  importExecutionPacket(text) {
    try {
      const pkt  = exParsePacket(text);
      const errs = exValidatePacket(pkt);
      exPacketState = pkt;
      saveExecution();
      renderExecutionPacketPreview(pkt, errs);
      updateMachineReadableState();
      return { ok: true, task_id: pkt.task_id, warnings: errs };
    } catch(err) { return { ok: false, error: err.message }; }
  },

  /* Import a carousel packet (appends a new run) */
  importCarouselPacket(text) {
    try {
      const pkt = parseCarouselPacket(text);
      const run = {
        id: "cr_run_" + Date.now(),
        imported_at: new Date().toISOString(),
        campaign_id: pkt.campaign_id || "",
        manus_permanent_skill: pkt.manus_permanent_skill || "",
        carousel_a: pkt.carousel_a || null,
        carousel_b: pkt.carousel_b || null,
      };
      carouselRuns.unshift(run);
      saveCarousel();
      renderCarouselTab();
      updateMachineReadableState();
      return { ok: true, run_id: run.id, campaign_id: run.campaign_id };
    } catch(err) { return { ok: false, error: err.message }; }
  },

  /* Import an execution result (appends to run log) */
  importExecutionResult(text) {
    try {
      const result = exParseResult(text);
      exAppendRunLog(result);
      saveExecution();
      renderExRunLog();
      updateMachineReadableState();
      return { ok: true, task_id: result.task_id, status: result.status };
    } catch(err) { return { ok: false, error: err.message }; }
  },

  /* Clear the current execution packet */
  clearExecutionPacket() {
    exPacketState = null;
    saveExecution();
    updateMachineReadableState();
    return { ok: true };
  },

  /* Clear all carousel runs */
  clearAllCarousels() {
    carouselRuns = [];
    saveCarousel();
    renderCarouselTab();
    updateMachineReadableState();
    return { ok: true };
  },
};

/* Expose for external callers (future direct-injection path) */
window.SovereignOpenClaw = {
  importResultPacket: function(text) {
    try {
      const pkt = ocParseResultPacket(text);
      const d   = ocValidateResultPacket(pkt);
      ocApplyResultPacket(pkt, d);
      renderOpenClawTab();
      renderSections();
      return { ok: true, code: "RESULT_IMPORTED" };
    } catch(err) {
      return { ok: false, code: err.code || "RESULT_REJECTED_INVALID_PACKET", message: err.message };
    }
  }
};

document.addEventListener("DOMContentLoaded", init);

/* =========================================================================
 * SOVEREIGN EXECUTION LAYER — v1
 * Executor-agnostic task runner. Hermes is primary. OpenClaw is legacy.
 * Reads SOVEREIGN_EXECUTION_PACKET_V1. Imports BEGIN_EXECUTION_RESULT_V1.
 * Benjamin is the only approval authority. No live posting without gate.
 * ========================================================================= */

const EXEC_STORAGE_KEY = "sovereign_execution_v1";

let exPacketState    = null;
let exRunLog         = [];
let exSelectedExecutor = "hermes";
let exSessionApprovals = {}; // account_key → { approved: bool, approved_at: ISO } — in-memory only, resets on reload

/* ---- Storage ---- */
function saveExecution() {
  try {
    localStorage.setItem(EXEC_STORAGE_KEY, JSON.stringify({
      packet: exPacketState,
      runLog: exRunLog,
      executor: exSelectedExecutor
    }));
  } catch(e) {}
}
function loadExecution() {
  try {
    const raw = localStorage.getItem(EXEC_STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    exPacketState      = s.packet   || null;
    exRunLog           = s.runLog   || [];
    exSelectedExecutor = s.executor || "hermes";
  } catch(e) {}
}

/* ---- Parse ---- */
function exParsePacket(raw) {
  const OPEN  = "BEGIN_SOVEREIGN_EXECUTION_PACKET_V1";
  const CLOSE = "END_SOVEREIGN_EXECUTION_PACKET_V1";
  let text = raw.trim();
  const s = text.indexOf(OPEN);
  const e = text.indexOf(CLOSE);
  if (s !== -1 && e !== -1) text = text.slice(s + OPEN.length, e).trim();
  return JSON.parse(text);
}

function exParseResult(raw) {
  const OPEN  = "BEGIN_EXECUTION_RESULT_V1";
  const CLOSE = "END_EXECUTION_RESULT_V1";
  let text = raw.trim();
  const s = text.indexOf(OPEN);
  const e = text.indexOf(CLOSE);
  if (s !== -1 && e !== -1) text = text.slice(s + OPEN.length, e).trim();
  const result = JSON.parse(text);
  if (!result.task_id) throw new Error("Missing task_id in result packet.");
  if (!result.status)  throw new Error("Missing status in result packet.");
  return result;
}

/* ---- Validate ---- */
const EX_REQUIRED_FIELDS = [
  "schema","task_id","campaign_id","platform","action_type",
  "account_key","browser_profile","destination_url",
  "approval_status","run_mode","executor","hard_stop","result_import_mode",
  "runbook_id","start_page","action_mask","approval_policy"
];

function exValidatePacket(pkt) {
  const errs = [];
  EX_REQUIRED_FIELDS.forEach(f => {
    if (pkt[f] === undefined || pkt[f] === null || pkt[f] === "") {
      errs.push(`Missing required field: ${f}`);
    }
  });
  if (pkt.schema && pkt.schema !== "SOVEREIGN_EXECUTION_PACKET_V1") {
    errs.push(`schema must be SOVEREIGN_EXECUTION_PACKET_V1, got: ${pkt.schema}`);
  }
  if (pkt.hard_stop && !Array.isArray(pkt.hard_stop)) {
    errs.push("hard_stop must be an array.");
  }
  return errs;
}

/* ---- Run modes ---- */
const EX_RUN_MODES = {
  READ_ONLY_PACKET_TEST:   { label: "READ ONLY — Packet Test",      cls: "ex-rm-read",     desc: "Validate packet only. No browser. No navigation." },
  DRY_RUN_READINESS_ONLY:  { label: "DRY RUN — Readiness Only",     cls: "ex-rm-dry",      desc: "Navigate to destination. Read page state. Do NOT interact." },
  NAVIGATION_DRY_RUN:      { label: "DRY RUN — Navigation",         cls: "ex-rm-nav",      desc: "Navigate and locate target element. Do NOT type or submit." },
  COMPOSER_DRY_RUN:        { label: "DRY RUN — Composer",           cls: "ex-rm-composer", desc: "Open composer. Type content verbatim. Do NOT click Submit or Post." },
  LIVE_EXECUTION_APPROVED: { label: "LIVE EXECUTION — AUTHORIZED",  cls: "ex-rm-live",     desc: "Full execution. Requires BENJAMIN_APPROVED + live_execution_explicit_flag: true." },
};

/* ---- RB009 — Composer Textbox Focus Stability Test ---- */
function generateRB009() {
  return {
    schema:                     "SOVEREIGN_EXECUTION_PACKET_V1",
    runbook_id:                 "RB009_COMPOSER_TEXTBOX_FOCUS_STABILITY",
    task_id:                    `RB009_${Date.now()}`,
    campaign_id:                "SYSTEM_TEST",
    platform:                   "LinkedIn James Post",
    action_type:                "composer_focus_stability_test",
    account_key:                "linkedin_james_personal",
    browser_profile:            "linkedin-james",
    start_page:                 "https://www.linkedin.com/feed/",
    destination_url:            "https://www.linkedin.com/feed/",
    approval_status:            "PENDING",
    approval_policy:            "SESSION_ACCOUNT",
    run_mode:                   "NAVIGATION_DRY_RUN",
    executor:                   "hermes",
    live_execution_explicit_flag: false,
    action_mask: {
      allow:    ["navigate", "click", "screenshot", "read_dom", "verify_focus"],
      disallow: ["paste", "type", "post", "schedule", "upload", "comment", "send", "delete"]
    },
    identity_target: {
      expected_account_name:           "James Riggins",
      expected_profile_behavior:       "LinkedIn feed loads showing James Riggins identity in top nav",
      expected_verification_indicator: "Profile name or avatar visible in LinkedIn top navigation bar"
    },
    composer_target: {
      control_text:             "Start a post",
      start_page:               "https://www.linkedin.com/feed/",
      textbox_hint:             "What do you want to talk about?",
      focus_verification_method:"document.activeElement must be inside .ql-editor or [role=textbox] after click",
      allowed_actions:          ["click", "verify_focus", "screenshot", "read_dom"],
      disallowed_actions:       ["paste", "type"]
    },
    preconditions: [
      "Browser profile 'linkedin-james' is running with CDP attached to localhost:9222",
      "James Riggins is logged in — not on an authwall or CAPTCHA",
      "LinkedIn feed home (linkedin.com/feed/) is accessible"
    ],
    hard_stop: [
      "DO NOT paste or type any content into the composer",
      "DO NOT click Post, Submit, Share, or Send",
      "DO NOT upload any media or files",
      "DO NOT schedule anything",
      "If James Riggins identity cannot be verified, report BLOCKED immediately",
      "If focus cannot be verified deterministically, report focus_result: UNRELIABLE with DOM evidence",
      "Return focus_result field in result packet: DETERMINISTIC | UNRELIABLE | BLOCKED"
    ],
    result_import_mode: "PASTE",
    post_packet:        null,
    post_body_source:   null,
    cta_placement:      null,
    media_source:       null,
    schedule_time:      null
  };
}

/* ---- Hermes prompt builder / Manual checklist ---- */
function exBuildHermesPrompt(pkt) {
  if (exSelectedExecutor === "manual") return buildManualHandoffChecklist(pkt);
  // ── Hermes paths below ──
  const rm = pkt.run_mode || "DRY_RUN_READINESS_ONLY";
  const url = pkt.destination_url || "[destination_url]";
  const profile = pkt.browser_profile || "[browser_profile]";
  const tid = pkt.task_id || "[task_id]";

  const packetBlock = `Execution packet (task_id: ${tid}):\n${JSON.stringify(pkt, null, 2)}`;

  // ── Browser/CDP execution path (all actions via Chrome CDP) ──────────────
  let actionBlock = "";
  if (rm === "READ_ONLY_PACKET_TEST") {
    actionBlock = `Read and validate the execution packet above.\nConfirm all required fields are present.\nDo NOT open a browser. Do NOT navigate anywhere.\nReturn a BEGIN_EXECUTION_RESULT_V1 packet with your validation findings.`;
  } else if (rm === "DRY_RUN_READINESS_ONLY") {
    actionBlock = `Connect to the browser profile: ${profile}.\nNavigate to: ${url}\nRead the page state. Report what you see.\nDo NOT interact with page content. Do NOT click anything except navigation.\nIf you see an authwall or login wall, report BLOCKED and stop.\nReturn a complete BEGIN_EXECUTION_RESULT_V1 packet.`;
  } else if (rm === "NAVIGATION_DRY_RUN") {
    const sp = pkt.start_page || url;
    const it = pkt.identity_target || {};
    const ct = pkt.composer_target || {};
    const am = pkt.action_mask || {};
    const allowList  = (am.allow    || []).join(", ") || "—";
    const blockList  = (am.disallow || []).join(", ") || "—";
    let navBlock = `Connect to browser profile: ${profile}.\nNavigate to start_page: ${sp}\n`;
    if (it.expected_account_name) {
      navBlock += `\nVerify identity:\n  Expected account: ${it.expected_account_name}\n  Verification indicator: ${it.expected_verification_indicator || "visible in nav"}\n  Profile behavior: ${it.expected_profile_behavior || "normal"}\nIf identity cannot be verified, report BLOCKED immediately — do not proceed.\n`;
    }
    if (ct.control_text) {
      navBlock += `\nComposer focus test:\n  Locate control: "${ct.control_text}"\n  Click to open the composer.\n  Locate textbox: "${ct.textbox_hint || "post textbox"}"\n  Attempt focus.\n  Verify focus using: ${ct.focus_verification_method || "DOM activeElement check"}\n  Report focus_result: DETERMINISTIC | UNRELIABLE | BLOCKED\n  Capture DOM evidence in notes field of result packet.\n  DO NOT type, paste, or submit anything.\n`;
    } else {
      navBlock += `\nLocate target element for action type: ${pkt.action_type || ""}\nDo NOT click, type, or interact with it.\nReport what you found and where it is on the page.\n`;
    }
    navBlock += `\nAction mask — obey strictly:\n  Allowed:    ${allowList}\n  Disallowed: ${blockList}`;
    actionBlock = navBlock;
  } else if (rm === "COMPOSER_DRY_RUN") {
    const body = pkt.post_body_source ? `\n\nPost body to type verbatim:\n---\n${pkt.post_body_source}\n---` : "";
    actionBlock = `Connect to the browser profile: ${profile}.\nNavigate to: ${url}\nOpen the post composer.\nType the following content VERBATIM — do not alter a single character:${body}\n\nDO NOT click Post, Submit, Share, or Send.\nTake a screenshot of the composer with the typed text visible.\nClose the composer WITHOUT submitting.\nReturn a BEGIN_EXECUTION_RESULT_V1 packet confirming what you typed and that nothing was posted.`;
  } else if (rm === "LIVE_EXECUTION_APPROVED") {
    const liveBody    = pkt.post_body_source || pkt.post_packet?.body || "[MISSING — post_body_source required]";
    const liveComment = pkt.post_packet?.first_comment || null;
    const liveAlt     = pkt.post_packet?.alt_text || null;
    const liveMedia   = pkt.media_source || null;
    const liveSched   = pkt.post_packet?.scheduled_time || pkt.schedule_time || null;
    const schedLine   = liveSched
      ? `Schedule for: ${liveSched}. Confirm the time is set correctly before closing.`
      : `Click Post/Share to publish immediately.`;
    const mediaLine   = liveMedia
      ? `Upload image: ${liveMedia}.${liveAlt ? ` Set alt text verbatim: "${liveAlt}".` : ""}`
      : "(No image for this post.)";
    const commentBlock = liveComment
      ? `\n7. After the post goes live: add the first comment VERBATIM — do not change one character:\n---\n${liveComment}\n---`
      : "";
    actionBlock = `⚠ LIVE EXECUTION AUTHORIZED — BROWSER WORKFLOW\nVerify: approval_status = BENJAMIN_APPROVED ✓, live_execution_explicit_flag = true ✓\nRead all hard_stop rules. If any condition fails, BLOCK immediately.\n\nConnect to browser profile: ${profile}.\nNavigate to: ${url}\n\nStep-by-step:\n1. Open the post composer ("Start a post" button).\n2. ${mediaLine}\n3. Click into the post body textbox. Paste the following VERBATIM — do not change one character:\n---\n${liveBody}\n---\n4. ${schedLine}\n5. Take a screenshot of the scheduled/published confirmation.\n6. Capture the post URL or URN from the confirmation screen.${commentBlock}\n8. Navigate to LinkedIn Messages and begin monitoring for new DMs.`;
  }

  const hardStopBlock = Array.isArray(pkt.hard_stop)
    ? "\n\nHard stops — obey all:\n" + pkt.hard_stop.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "";

  return `You are the Sovereign Strategy Execution Agent.\n\n${packetBlock}\n\n${actionBlock}${hardStopBlock}\n\nReturn a complete BEGIN_EXECUTION_RESULT_V1 packet when done.`;
}

/* ---- Run log ---- */
function exAppendRunLog(result) {
  exRunLog.unshift({
    timestamp:         new Date().toISOString(),
    executor:          result.executor    || "unknown",
    task_id:           result.task_id     || "unknown",
    campaign_id:       result.campaign_id || "",
    platform:          result.platform    || "",
    account_key:       result.account_key || "",
    run_mode:          result.run_mode    || "",
    status:            result.status      || "unknown",
    actions_completed: result.actions_completed || [],
    blocking_reason:   result.blocking_reason   || "",
    result_urls:       result.result_urls        || [],
    notes:             result.notes              || "",
  });
  if (exRunLog.length > 200) exRunLog = exRunLog.slice(0, 200);
}

/* ---- Session Approval Console ---- */
function renderSessionApprovalConsole() {
  const container = $("#ex-session-approvals");
  if (!container) return;
  const accounts = new Set();
  if (exPacketState?.account_key) accounts.add(exPacketState.account_key);
  exRunLog.slice(0, 20).forEach(r => { if (r.account_key) accounts.add(r.account_key); });
  if (accounts.size === 0) {
    container.innerHTML = `<div class="ex-session-empty">No accounts seen yet — load a packet or paste a result to populate.</div>`;
    return;
  }
  container.innerHTML = [...accounts].map(key => {
    const appr = exSessionApprovals[key];
    const approved = appr?.approved;
    const ts = approved ? new Date(appr.approved_at).toLocaleTimeString() : null;
    return `<div class="ex-session-acct ${approved ? "ex-session-acct-approved" : "ex-session-acct-pending"}">
      <span class="ex-session-acct-key">${escapeHTML(key)}</span>
      <span class="ex-session-acct-status">${approved ? `✅ Approved ${escapeHTML(ts)}` : "⏸ Pending"}</span>
      <button class="btn btn-sm ex-session-btn" data-acct="${escapeHTML(key)}" data-action="${approved ? "revoke" : "approve"}">
        ${approved ? "Revoke" : "Approve Session"}
      </button>
    </div>`;
  }).join("");
}

/* ---- Render ---- */
function renderExecutionTab() {
  $all(".ex-exec-btn").forEach(b => b.classList.toggle("ex-exec-active", b.dataset.executor === exSelectedExecutor));
  renderSessionApprovalConsole();
  if (exPacketState) {
    const errs = exValidatePacket(exPacketState);
    renderExecutionPacketPreview(exPacketState, errs);
    $("#btn-ex-copy-packet").style.display = "";
  }
  renderExRunLog();
}

function renderExecutionPacketPreview(pkt, errs = []) {
  const preview = $("#ex-packet-preview");
  if (!preview) return;

  const approved = pkt.approval_status === "BENJAMIN_APPROVED";
  const liveMode = pkt.run_mode === "LIVE_EXECUTION_APPROVED";
  const liveFlag = pkt.live_execution_explicit_flag === true;
  const liveOk   = liveMode && liveFlag && approved;

  /* Approval gate */
  const gate = $("#ex-approval-gate");
  const gateIcon  = $("#ex-gate-icon");
  const gateTitle = $("#ex-gate-title");
  const gateDesc  = $("#ex-gate-desc");
  if (approved) {
    gate.className = "ex-gate ex-gate-approved";
    gateIcon.textContent = "✅";
    gateTitle.textContent = "BENJAMIN_APPROVED";
    gateDesc.textContent = liveMode
      ? (liveFlag ? "Live execution is authorized. All hard stops still apply."
                  : "⚠ LIVE mode but live_execution_explicit_flag is not true — posting is BLOCKED.")
      : "Execution authorized within the limits of the selected run mode.";
  } else {
    gate.className = "ex-gate ex-gate-blocked";
    gateIcon.textContent = "🚫";
    gateTitle.textContent = "NOT APPROVED — Execution Blocked";
    gateDesc.textContent = `approval_status is "${pkt.approval_status || "missing"}". Must be BENJAMIN_APPROVED. No executor may proceed.`;
  }

  /* Run mode */
  const rmKey  = pkt.run_mode || "";
  const rmInfo = EX_RUN_MODES[rmKey] || { label: rmKey || "Unknown", cls: "ex-rm-read", desc: "Unknown run mode." };
  const rmBox  = $("#ex-run-mode-box");
  rmBox.className = `ex-run-mode-box ${rmInfo.cls}`;
  $("#ex-run-mode-badge").textContent = rmInfo.label;
  $("#ex-run-mode-desc").textContent  = rmInfo.desc;

  /* Routing grid */
  const routingFields = [
    ["Runbook",        pkt.runbook_id     || "—", "mono"],
    ["Approval Policy",pkt.approval_policy|| "—", ""],
    ["Task ID",        pkt.task_id,          "mono"],
    ["Campaign",       pkt.campaign_id,       ""],
    ["Platform",       pkt.platform,          "badge"],
    ["Action",         pkt.action_type,       "mono"],
    ["Executor",       pkt.executor || exSelectedExecutor, "badge-exec"],
    ["Account Key",    pkt.account_key,       "mono"],
    ["Browser Profile",pkt.browser_profile,   "mono"],
    ["Start Page",     pkt.start_page     || "—", "mono"],
    ["Destination",    pkt.destination_url,   "mono"],
    ["CTA Placement",  pkt.cta_placement  || "—", ""],
    ["Media Source",   pkt.media_source   || "—", ""],
    ["Schedule",       pkt.schedule_time  || "Immediate", ""],
  ];
  $("#ex-routing-grid").innerHTML = routingFields.map(([label, val, cls]) => {
    let valHTML = escapeHTML(String(val || "—"));
    if (cls === "mono")      valHTML = `<span class="ex-mono">${escapeHTML(String(val || "—"))}</span>`;
    if (cls === "badge")     valHTML = `<span class="ex-platform-badge">${escapeHTML(String(val || "—"))}</span>`;
    if (cls === "badge-exec") valHTML = `<span class="ex-executor-badge ex-exec-badge-${escapeHTML(String(val || ""))}">${escapeHTML(String(val || "—"))}</span>`;
    return `<div class="ex-field-label">${escapeHTML(label)}</div><div class="ex-field-value">${valHTML}</div>`;
  }).join("");

  /* Validation list */
  const allFieldsOk = errs.length === 0;
  $("#ex-validation-list").innerHTML = EX_REQUIRED_FIELDS.map(f => {
    const present = pkt[f] !== undefined && pkt[f] !== null && pkt[f] !== "";
    return `<div class="ex-val-row">
      <span class="ex-val-icon">${present ? "✅" : "❌"}</span>
      <span class="ex-val-label">${escapeHTML(f)}</span>
      <span class="ex-val-value">${present ? escapeHTML(String(Array.isArray(pkt[f]) ? `[${pkt[f].length} items]` : pkt[f]).slice(0, 60)) : "MISSING"}</span>
    </div>`;
  }).join("") + (errs.length > 0
    ? `<div class="ex-val-errors">${errs.map(e => `<div class="ex-val-err">⚠ ${escapeHTML(e)}</div>`).join("")}</div>`
    : `<div class="ex-val-ok">All required fields present.</div>`);

  /* Hard stops */
  const hsPanel = $("#ex-hard-stops-panel");
  const hsList  = $("#ex-hard-stops-list");
  if (Array.isArray(pkt.hard_stop) && pkt.hard_stop.length > 0) {
    hsList.innerHTML = pkt.hard_stop.map(s => `<li>${escapeHTML(s)}</li>`).join("");
    hsPanel.style.display = "";
  } else {
    hsPanel.style.display = "none";
  }

  /* Preconditions */
  const prePanel = $("#ex-preconditions-panel");
  if (prePanel) {
    const preList = $("#ex-preconditions-list");
    if (Array.isArray(pkt.preconditions) && pkt.preconditions.length > 0) {
      preList.innerHTML = pkt.preconditions.map(p => `<li>${escapeHTML(p)}</li>`).join("");
      prePanel.style.display = "";
    } else { prePanel.style.display = "none"; }
  }

  /* Identity Target */
  const idPanel = $("#ex-identity-target-panel");
  if (idPanel) {
    const idDisplay = $("#ex-identity-target-display");
    if (pkt.identity_target && typeof pkt.identity_target === "object") {
      const it = pkt.identity_target;
      idDisplay.innerHTML = [
        ["Expected Account",       it.expected_account_name],
        ["Profile Behavior",       it.expected_profile_behavior],
        ["Verification Indicator", it.expected_verification_indicator],
      ].filter(([,v]) => v).map(([l,v]) =>
        `<div class="ex-field-label">${escapeHTML(l)}</div><div class="ex-field-value">${escapeHTML(v)}</div>`
      ).join("");
      idPanel.style.display = "";
    } else { idPanel.style.display = "none"; }
  }

  /* Composer Target */
  const ctPanel = $("#ex-composer-target-panel");
  if (ctPanel) {
    const ctDisplay = $("#ex-composer-target-display");
    if (pkt.composer_target && typeof pkt.composer_target === "object") {
      const ct = pkt.composer_target;
      ctDisplay.innerHTML = [
        ["Control Text",       ct.control_text],
        ["Start Page",         ct.start_page],
        ["Textbox Hint",       ct.textbox_hint],
        ["Focus Verification", ct.focus_verification_method],
      ].filter(([,v]) => v).map(([l,v]) =>
        `<div class="ex-field-label">${escapeHTML(l)}</div><div class="ex-field-value ex-mono">${escapeHTML(v)}</div>`
      ).join("");
      ctPanel.style.display = "";
    } else { ctPanel.style.display = "none"; }
  }

  /* Action Mask */
  const amPanel = $("#ex-action-mask-panel");
  if (amPanel) {
    const amDisplay = $("#ex-action-mask-display");
    if (pkt.action_mask && typeof pkt.action_mask === "object") {
      const am = pkt.action_mask;
      const allowTags   = (am.allow    || []).map(a => `<span class="ex-mask-allow">${escapeHTML(a)}</span>`).join(" ");
      const disallowTags= (am.disallow || []).map(a => `<span class="ex-mask-disallow">${escapeHTML(a)}</span>`).join(" ");
      amDisplay.innerHTML = `
        <div class="ex-mask-row"><span class="ex-mask-label">Allowed</span><span class="ex-mask-tags">${allowTags || "—"}</span></div>
        <div class="ex-mask-row"><span class="ex-mask-label">Disallowed</span><span class="ex-mask-tags">${disallowTags || "—"}</span></div>`;
      amPanel.style.display = "";
    } else { amPanel.style.display = "none"; }
  }

  /* Prompt panel — label and button text reflect active executor */
  const isManual = exSelectedExecutor === "manual";
  const promptPanel = $("#ex-hermes-prompt-display")?.closest(".panel");
  if (promptPanel) {
    const lbl = promptPanel.querySelector(".panel-label");
    const copyBtn = document.getElementById("btn-ex-copy-hermes-prompt");
    if (lbl) lbl.textContent = isManual
      ? "Manual Handoff Checklist — follow these steps yourself"
      : "Hermes Prompt — paste this to start execution";
    if (copyBtn) copyBtn.textContent = isManual ? "Copy Checklist" : "Copy Hermes Prompt";
  }
  $("#ex-hermes-prompt-display").textContent = exBuildHermesPrompt(pkt);

  preview.style.display = "";
}

function renderExRunLog() {
  const el = $("#ex-run-log");
  if (!el) return;
  if (exRunLog.length === 0) {
    el.innerHTML = `<div class="ex-empty">No runs yet. Import a result packet to populate the log.</div>`;
    return;
  }
  el.innerHTML = `<div class="oc-table-wrap"><table class="ex-log-table">
    <thead><tr>
      <th>Time</th><th>Executor</th><th>Task ID</th><th>Platform</th><th>Mode</th><th>Status</th><th>Notes</th>
    </tr></thead>
    <tbody>${exRunLog.map(r => {
      const statusCls = r.status === "success" ? "ex-status-ok"
        : r.status === "blocked" ? "ex-status-blocked"
        : r.status === "failed"  ? "ex-status-failed"
        : "ex-status-dry";
      const ts = r.timestamp ? new Date(r.timestamp).toLocaleString() : "—";
      return `<tr>
        <td class="ex-log-ts">${escapeHTML(ts)}</td>
        <td><span class="ex-executor-badge ex-exec-badge-${escapeHTML(r.executor)}">${escapeHTML(r.executor)}</span></td>
        <td class="ex-mono ex-log-tid">${escapeHTML(r.task_id)}</td>
        <td>${escapeHTML(r.platform)}</td>
        <td class="ex-mono">${escapeHTML(r.run_mode)}</td>
        <td><span class="${statusCls}">${escapeHTML(r.status)}</span></td>
        <td class="ex-log-notes">${escapeHTML(r.blocking_reason || r.notes || "—")}</td>
      </tr>`;
    }).join("")}</tbody>
  </table></div>`;
}
