/*
 * SPDX-License-Identifier: MIT
 *
 * Discover, stage, and apply two curator-directed Wikimedia Commons images for
 * every OpenGrail tradition. Query manifests identify the subjects; this script
 * handles source verification, metadata, download integrity, and frontmatter.
 */

import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import matter from "gray-matter";

const ROOT = path.resolve(".");
const QUERY_DIR = path.join(ROOT, "scripts", "artifact-curation");
const LIVE_DIR = path.join(ROOT, "public", "artifacts");
const STAGE_DIR = path.join("/tmp", "opengrail-artifact-curation");
const STAGE_ASSET_DIR = path.join(STAGE_DIR, "artifacts");
const STAGE_SELECTION_PATH = path.join(STAGE_DIR, "selected.json");
const COMMITTED_SELECTION_PATH = path.join(QUERY_DIR, "selected.json");
const USER_AGENT = "OpenGrailAtlasCurator/1.0 (https://github.com/CalixOscar/OpenGrail)";
const REQUEST_SPACING_MS = 275;
const MAX_ATTEMPTS = 5;
const SEARCH_LIMIT = 24;
const THUMB_WIDTH = 1400;
const CURRENT_YEAR = new Date().getUTCFullYear();
const execFile = promisify(execFileCallback);

const MEDIUM_WORDS = new Set([
  "altar", "architecture", "art", "artifact", "basilica", "book", "bronze",
  "building", "carving", "cathedral", "ceremony", "church", "codex", "deity",
  "figure", "icon", "iconography", "image", "manuscript", "mask", "monastery",
  "monument", "mosque", "museum", "painting", "portrait", "prayer", "relief",
  "ritual", "sanctuary", "sculpture", "shrine", "statue", "stupa", "symbol",
  "temple", "text", "worship", "historical", "sacred", "ancient", "traditional",
  "founder", "leader", "member", "people", "hall", "site", "center", "drawing",
  "photo", "photograph", "engraving", "plate", "stele", "tablet", "scroll",
]);

const STOP_WORDS = new Set([
  "a", "an", "and", "at", "by", "for", "from", "in", "of", "on", "or",
  "the", "to", "with", "tradition", "traditions", "religion", "religious",
  "movement", "movements", "church", "churches", "order", "faith", "group",
  "view", "interior", "exterior", "facade", "ruins", "remains",
]);

const PROHIBITED_PATTERNS = [
  /youtube/i,
  /video screenshot/i,
  /screen[ -]?shot/i,
  /lecture/i,
  /webinar/i,
  /interview/i,
  /podcast/i,
  /talking head/i,
  /subtitle/i,
  /television/i,
  /film still/i,
  /movie still/i,
  /presentation slide/i,
  /powerpoint/i,
  /generic thumbnail/i,
  /fabric (sample|texture)/i,
  /cloth texture/i,
  /paper texture/i,
  /wallpaper texture/i,
  /blank (page|image|placeholder)/i,
  /stock photo/i,
  /clip[ -]?art/i,
  /ai[ -]?generated/i,
  /artificial intelligence generated/i,
  /stable diffusion/i,
  /midjourney/i,
  /dall[ -]?e/i,
  /commons[-_ ]logo/i,
  /wikidata[-_ ]logo/i,
  /wikipedia[-_ ]logo/i,
  /disambig/i,
  /question[-_ ]mark/i,
  /locator map/i,
  /location map/i,
  /distribution map/i,
  /flag of/i,
  /internet archive.*book cover/i,
  /biodiversity heritage library/i,
];

const ALLOWED_LICENSE_PATTERNS = [
  /public domain/i,
  /^cc0$/i,
  /creative commons zero/i,
  /^cc by(?: |-)/i,
  /^cc-by(?: |-)/i,
  /creative commons attribution/i,
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function meaningfulTokens(value) {
  return tokens(value).filter((word) => !MEDIUM_WORDS.has(word));
}

function yamlString(value) {
  return JSON.stringify(String(value).replace(/\s+/g, " ").trim());
}

async function loadTraditions() {
  // Finder/iCloud may materialize untracked conflict copies such as `name 2.md`.
  // The Git index is the authoritative corpus, matching the project guidance.
  const { stdout } = await execFile("git", ["ls-files", "-z", "data/**/*.md"], { cwd: ROOT, encoding: "buffer" });
  const files = stdout.toString("utf8").split("\0").filter(Boolean).map((filePath) => path.join(ROOT, filePath)).sort();
  return Promise.all(files.map(async (filePath) => {
    const raw = await readFile(filePath, "utf8");
    const parsed = matter(raw);
    return {
      filePath,
      raw,
      data: parsed.data,
      id: parsed.data.id,
      title: parsed.data.title,
    };
  }));
}

async function loadQueries(traditions) {
  const queryFiles = (await readdir(QUERY_DIR))
    .filter((name) => name.endsWith(".json") && name !== "selected.json")
    .sort();
  const merged = {};
  for (const fileName of queryFiles) {
    const payload = JSON.parse(await readFile(path.join(QUERY_DIR, fileName), "utf8"));
    for (const [id, slots] of Object.entries(payload)) {
      if (merged[id]) throw new Error(`Duplicate curation query id: ${id}`);
      merged[id] = slots;
    }
  }

  const expectedIds = new Set(traditions.map((item) => item.id));
  const missing = [...expectedIds].filter((id) => !merged[id]);
  const extra = Object.keys(merged).filter((id) => !expectedIds.has(id));
  if (missing.length || extra.length) {
    throw new Error(`Query coverage mismatch. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`);
  }

  for (const tradition of traditions) {
    const slots = merged[tradition.id];
    if (!Array.isArray(slots) || slots.length !== 2) {
      throw new Error(`${tradition.id} must have exactly two curation queries.`);
    }
    slots.forEach((slot, index) => {
      if (!slot || typeof slot.query !== "string" || !slot.query.trim()) {
        throw new Error(`${tradition.id}[${index}] is missing query.`);
      }
      if (typeof slot.intent !== "string" || !slot.intent.trim()) {
        throw new Error(`${tradition.id}[${index}] is missing intent.`);
      }
      if (slots[0].query.trim().toLowerCase() === slots[1].query.trim().toLowerCase()) {
        throw new Error(`${tradition.id} uses the same query twice.`);
      }
    });
  }
  return merged;
}

let lastApiStartedAt = 0;
let apiQueue = Promise.resolve();

function serializedApiFetch(url) {
  const task = apiQueue.then(async () => {
    const waitMs = Math.max(0, REQUEST_SPACING_MS - (Date.now() - lastApiStartedAt));
    if (waitMs) await delay(waitMs);
    lastApiStartedAt = Date.now();
    return fetchJsonWithRetry(url);
  });
  apiQueue = task.catch(() => {});
  return task;
}

async function fetchJsonWithRetry(url) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.ok) {
        const text = await response.text();
        if (/^\s*[\[{]/.test(text)) return JSON.parse(text);
        throw new Error(`Non-JSON response: ${text.slice(0, 80)}`);
      }
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`HTTP ${response.status}`);
      }
      const retryAfter = Number(response.headers.get("retry-after"));
      await delay(Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 1200);
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
      await delay(attempt * 1200);
    }
  }
  throw new Error("Unreachable retry state");
}

function metadataValue(info, key) {
  return normalizeText(info?.extmetadata?.[key]?.value);
}

function candidateHaystack(page, info) {
  return normalizeText([
    page.title,
    metadataValue(info, "ObjectName"),
    metadataValue(info, "ImageDescription"),
    metadataValue(info, "Categories"),
  ].join(" ")).toLowerCase();
}

function licenseIsAllowed(info) {
  const license = metadataValue(info, "LicenseShortName") || metadataValue(info, "UsageTerms");
  return ALLOWED_LICENSE_PATTERNS.some((pattern) => pattern.test(license));
}

function candidateScore(page, info, query, intent, searchIndex) {
  const mime = info.mime || info.thumbmime || "";
  if (!["image/jpeg", "image/png"].includes(mime)) return Number.NEGATIVE_INFINITY;
  if (!licenseIsAllowed(info)) return Number.NEGATIVE_INFINITY;

  const width = info.thumbwidth || info.width || 0;
  const height = info.thumbheight || info.height || 0;
  const sourceWidth = info.width || width;
  const sourceHeight = info.height || height;
  const longEdge = Math.max(sourceWidth, sourceHeight);
  const shortEdge = Math.min(sourceWidth, sourceHeight);
  if (longEdge < 520 || shortEdge < 180) return Number.NEGATIVE_INFINITY;
  const ratio = sourceWidth / Math.max(1, sourceHeight);
  if (ratio > 4.5 || ratio < 0.22) return Number.NEGATIVE_INFINITY;

  const haystack = candidateHaystack(page, info);
  if (PROHIBITED_PATTERNS.some((pattern) => pattern.test(haystack))) {
    return Number.NEGATIVE_INFINITY;
  }
  if (/\.(pdf|djvu|tiff?|svg|ogg|ogv|mp4|webm|stl)(\.jpg|\.png)?$/i.test(page.title)) {
    return Number.NEGATIVE_INFINITY;
  }

  const queryWords = [...new Set(tokens(query))];
  const subjectWords = [...new Set(meaningfulTokens(`${query} ${intent}`))];
  const matchedSubjectWords = subjectWords.filter((word) => haystack.includes(word));
  if (subjectWords.length > 0 && matchedSubjectWords.length === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = Math.max(0, 42 - searchIndex * 2.5);
  for (const word of queryWords) score += haystack.includes(word) ? 13 : -1.5;
  for (const word of meaningfulTokens(intent)) score += haystack.includes(word) ? 9 : 0;
  score += matchedSubjectWords.length * 7;
  score += Math.min(15, Math.log2(Math.max(1, sourceWidth * sourceHeight / 250_000)) * 4);

  const categories = metadataValue(info, "Categories");
  if (/featured picture|quality image|valued image/i.test(categories)) score += 12;
  if (/own work/i.test(metadataValue(info, "Credit"))) score += 2;
  if (/map|flag|coat of arms/i.test(haystack) && !/map|flag|coat of arms/i.test(`${query} ${intent}`)) score -= 45;
  if (/logo|emblem/i.test(haystack) && !/logo|emblem|seal|symbol/i.test(`${query} ${intent}`)) score -= 30;

  return score;
}

async function searchCommons(query, intent, traditionTitle) {
  const qWords = query.trim().split(/\s+/);
  const shortened = qWords.length > 3 ? qWords.slice(0, 3).join(" ") : null;
  const attempts = [...new Set([
    query.trim(),
    intent.trim(),
    shortened,
    `${query.trim()} ${intent.trim()}`,
    `${traditionTitle} ${intent.trim()}`,
    `${traditionTitle} ${query.trim()}`,
  ].filter(Boolean))];
  const allCandidates = [];

  for (const searchText of attempts) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrnamespace: "6",
      gsrsearch: searchText,
      gsrlimit: String(SEARCH_LIMIT),
      prop: "imageinfo",
      iiprop: "url|mime|thumbmime|size|sha1|extmetadata",
      iiextmetadatafilter: [
        "ObjectName", "ImageDescription", "Artist", "Credit", "Institution",
        "DateTimeOriginal", "DateTime", "LicenseShortName", "LicenseUrl",
        "UsageTerms", "AttributionRequired", "Copyrighted", "Restrictions",
        "Categories",
      ].join("|"),
      iiextmetadatalanguage: "en",
      iiurlwidth: String(THUMB_WIDTH),
      maxlag: "5",
      format: "json",
      formatversion: "2",
      origin: "*",
    });
    const payload = await serializedApiFetch(`https://commons.wikimedia.org/w/api.php?${params}`);
    const pages = payload?.query?.pages ?? [];
    pages.forEach((page, index) => {
      const info = page.imageinfo?.[0];
      if (!info) return;
      const score = candidateScore(page, info, query, intent, index);
      if (!Number.isFinite(score)) return;
      allCandidates.push({ page, info, score, searchText });
    });
    if (allCandidates.length >= 1) break;
  }

  allCandidates.sort((a, b) => b.score - a.score);
  return allCandidates;
}

function cleanPeriod(info) {
  const objectText = `${metadataValue(info, "ObjectName")} ${metadataValue(info, "ImageDescription")}`;
  const century = objectText.match(/\b(?:c\.\s*)?\d{1,2}(?:st|nd|rd|th)[ -]century(?:\s*(?:BCE|BC|CE|AD))?/i);
  if (century) return normalizeText(century[0]);
  const eraDate = objectText.match(/\b(?:c\.\s*)?\d{1,4}\s*(?:BCE|BC|CE|AD)\b/i);
  if (eraDate) return normalizeText(eraDate[0]);

  const original = metadataValue(info, "DateTimeOriginal").replace(/\s*date QS:.*$/i, "").trim();
  if (/century/i.test(original)) return original;
  const originalYear = original.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  if (originalYear) return `Image dated ${originalYear[1]}`;

  const embeddedYears = [...objectText.matchAll(/\b(1[0-9]{3}|20[0-9]{2})\b/g)]
    .map((match) => Number(match[1]))
    .filter((year) => year <= CURRENT_YEAR);
  if (embeddedYears.length) return `Object or image dated ${Math.min(...embeddedYears)}`;

  const uploaded = metadataValue(info, "DateTime").match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  if (uploaded) return `Digital file published ${uploaded[1]}`;
  return "Date not specified by source";
}

function cleanProvenance(info) {
  const institution = metadataValue(info, "Institution");
  const artist = metadataValue(info, "Artist");
  const credit = metadataValue(info, "Credit");
  const license = metadataValue(info, "LicenseShortName") || metadataValue(info, "UsageTerms");
  const principal = institution || artist || (credit && credit.length <= 100 ? credit : "Wikimedia Commons");
  const compactPrincipal = normalizeText(principal).slice(0, 140) || "Wikimedia Commons";
  return license ? `${compactPrincipal}; ${license}` : compactPrincipal;
}

function fileExtensionFor(info) {
  const mime = info.thumbmime || info.mime;
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  throw new Error(`Unsupported selected MIME: ${mime}`);
}

function buildSelection(tradition, slot, querySpec, candidate) {
  const { page, info, score } = candidate;
  const extension = fileExtensionFor(info);
  const outputFile = `${tradition.id}-${slot + 1}${extension}`;
  const intent = normalizeText(querySpec.intent).replace(/[.]+$/, "");
  return {
    traditionId: tradition.id,
    traditionTitle: tradition.title,
    slot: slot + 1,
    role: slot === 0 ? "core iconography or defining figure" : "sanctuary, text, or ritual artifact",
    query: querySpec.query,
    intent,
    commonsFileTitle: page.title,
    sourceUrl: info.descriptionurl,
    originalUrl: info.url,
    downloadUrl: info.thumburl || info.url,
    mime: info.thumbmime || info.mime,
    sourceMime: info.mime,
    width: info.thumbwidth || info.width,
    height: info.thumbheight || info.height,
    sourceWidth: info.width,
    sourceHeight: info.height,
    commonsSha1: info.sha1,
    creator: metadataValue(info, "Artist"),
    credit: metadataValue(info, "Credit"),
    institution: metadataValue(info, "Institution"),
    license: metadataValue(info, "LicenseShortName") || metadataValue(info, "UsageTerms"),
    licenseUrl: metadataValue(info, "LicenseUrl"),
    sourceDescription: metadataValue(info, "ImageDescription"),
    title: intent,
    provenance: cleanProvenance(info),
    period: cleanPeriod(info),
    description: `This image shows ${intent}, selected as a defining visual reference for ${tradition.title}.`,
    outputFile,
    selectionScore: Number(score.toFixed(2)),
  };
}

async function loadStageSelection() {
  try {
    return JSON.parse(await readFile(STAGE_SELECTION_PATH, "utf8"));
  } catch {
    return { generatedAt: null, items: {} };
  }
}

async function saveStageSelection(selection) {
  await mkdir(STAGE_DIR, { recursive: true });
  selection.generatedAt = new Date().toISOString();
  await writeFile(STAGE_SELECTION_PATH, `${JSON.stringify(selection, null, 2)}\n`, "utf8");
}

async function discoverSelections(traditions, queries) {
  const selection = await loadStageSelection();
  selection.items ||= {};
  selection.preservationHashes = Object.fromEntries(traditions.map((tradition) => [
    tradition.id,
    hashOutsideArtifacts(tradition.raw, tradition.filePath),
  ]));
  let completed = 0;
  const failures = [];

  for (const tradition of traditions) {
    selection.items[tradition.id] ||= [];
    for (let slot = 0; slot < 2; slot += 1) {
      const spec = queries[tradition.id][slot];
      const cached = selection.items[tradition.id][slot];
      if (cached?.query === spec.query && cached?.intent === normalizeText(spec.intent).replace(/[.]+$/, "")) {
        completed += 1;
        continue;
      }

      try {
        const candidates = await searchCommons(spec.query, spec.intent, tradition.title);
        if (!candidates.length) {
          throw new Error(`No acceptable Commons candidate for query: ${spec.query}`);
        }
        const usedTitle = slot === 1 ? selection.items[tradition.id][0]?.commonsFileTitle : null;
        const chosen = candidates.find((candidate) => candidate.page.title !== usedTitle);
        if (!chosen) throw new Error("No distinct candidate for the second slot");
        selection.items[tradition.id][slot] = buildSelection(tradition, slot, spec, chosen);
        completed += 1;
      } catch (error) {
        selection.items[tradition.id][slot] = null;
        failures.push(`${tradition.id}[${slot + 1}]: ${error.message}`);
        console.warn(`Selection failed for ${failures.at(-1)}`);
      }

      if (completed % 10 === 0) {
        await saveStageSelection(selection);
        console.log(`Selected ${completed}/${traditions.length * 2} exact Commons files...`);
      }
    }
  }
  await saveStageSelection(selection);
  if (failures.length) {
    throw new Error(`Selection finished with ${failures.length} unresolved slot(s):\n${failures.join("\n")}`);
  }
  return selection;
}

function detectMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  return "unknown";
}

async function downloadWithRetry(url) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await delay(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 1500);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 8_000) throw new Error(`File too small (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      if (attempt === 8) throw error;
      await delay(attempt * 1200);
    }
  }
  throw new Error("Unreachable retry state");
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
      await delay(120);
    }
  });
  await Promise.all(workers);
}

async function stageDownloads(selection, expectedCount) {
  await mkdir(STAGE_ASSET_DIR, { recursive: true });
  const items = Object.values(selection.items).flat();
  if (items.length !== expectedCount || items.some((item) => !item)) {
    throw new Error(`Selection is incomplete: expected ${expectedCount}, found ${items.filter(Boolean).length}.`);
  }

  let downloaded = 0;
  await runPool(items, 3, async (item) => {
    const outputPath = path.join(STAGE_ASSET_DIR, item.outputFile);
    try {
      const existing = await readFile(outputPath);
      if (detectMime(existing) === item.mime && existing.length >= 8_000) {
        downloaded += 1;
        return;
      }
    } catch {
      // Download below.
    }

    const buffer = await downloadWithRetry(item.downloadUrl);
    const actualMime = detectMime(buffer);
    if (!["image/jpeg", "image/png"].includes(actualMime)) {
      throw new Error(`${item.outputFile} invalid image MIME: ${actualMime}.`);
    }
    if (actualMime !== item.mime) {
      item.mime = actualMime;
      item.outputFile = `${item.traditionId}-${item.slot}${actualMime === "image/png" ? ".png" : ".jpg"}`;
    }
    const finalOutputPath = path.join(STAGE_ASSET_DIR, item.outputFile);
    item.downloadSha256 = createHash("sha256").update(buffer).digest("hex");
    item.downloadBytes = buffer.length;
    await writeFile(finalOutputPath, buffer);
    downloaded += 1;
    if (downloaded % 25 === 0) console.log(`Staged ${downloaded}/${items.length} image files...`);
  });
  await saveStageSelection(selection);
}

function renderArtifacts(items) {
  const lines = ["artifacts:"];
  items.forEach((item) => {
    lines.push(`  - title: ${yamlString(item.title)}`);
    lines.push(`    imageUrl: ${yamlString(`/artifacts/${item.outputFile}`)}`);
    lines.push(`    sourceUrl: ${yamlString(item.sourceUrl)}`);
    lines.push(`    provenance: ${yamlString(item.provenance)}`);
    lines.push(`    period: ${yamlString(item.period)}`);
    lines.push(`    description: ${yamlString(item.description)}`);
  });
  return `${lines.join("\n")}\n`;
}

function replaceArtifactsOnly(raw, renderedArtifacts, filePath) {
  const { artifactStart, closingIndex } = locateArtifactBlock(raw, filePath);
  return `${raw.slice(0, artifactStart)}${renderedArtifacts}${raw.slice(closingIndex + 1)}`;
}

function locateArtifactBlock(raw, filePath) {
  if (!raw.startsWith("---\n")) throw new Error(`${filePath} has unsupported frontmatter opening.`);
  const closingIndex = raw.indexOf("\n---\n", 4);
  if (closingIndex < 0) throw new Error(`${filePath} has unsupported frontmatter closing.`);
  const markerIndex = raw.lastIndexOf("\nartifacts:", closingIndex);
  if (markerIndex < 0) throw new Error(`${filePath} is missing artifacts frontmatter.`);
  const artifactStart = markerIndex + 1;
  return { artifactStart, closingIndex };
}

function hashOutsideArtifacts(raw, filePath) {
  const { artifactStart, closingIndex } = locateArtifactBlock(raw, filePath);
  const preserved = `${raw.slice(0, artifactStart)}artifacts:\n${raw.slice(closingIndex + 1)}`;
  return createHash("sha256").update(preserved).digest("hex");
}

async function validateSelection(selection, traditions) {
  const ids = new Set(traditions.map((item) => item.id));
  const selectedIds = Object.keys(selection.items ?? {});
  if (selectedIds.length !== ids.size || selectedIds.some((id) => !ids.has(id))) {
    throw new Error("Selected manifest does not exactly match the tradition corpus.");
  }

  const seenOutputs = new Set();
  for (const tradition of traditions) {
    const items = selection.items[tradition.id];
    if (!Array.isArray(items) || items.length !== 2 || items.some((item) => !item)) {
      throw new Error(`${tradition.id} does not have two selected images.`);
    }
    if (items[0].commonsFileTitle === items[1].commonsFileTitle) {
      throw new Error(`${tradition.id} repeats the same Commons file.`);
    }
    for (let slot = 0; slot < 2; slot += 1) {
      const item = items[slot];
      if (!new RegExp(`^${tradition.id}-${slot + 1}\\.(?:jpg|png)$`).test(item.outputFile)) {
        throw new Error(`${tradition.id}[${slot + 1}] has invalid output filename ${item.outputFile}.`);
      }
      if (!item.sourceUrl?.startsWith("https://commons.wikimedia.org/wiki/File:")) {
        throw new Error(`${tradition.id}[${slot + 1}] lacks an exact Commons file page.`);
      }
      if (seenOutputs.has(item.outputFile)) throw new Error(`Duplicate output file ${item.outputFile}.`);
      seenOutputs.add(item.outputFile);
      const staged = await readFile(path.join(STAGE_ASSET_DIR, item.outputFile));
      if (detectMime(staged) !== item.mime) throw new Error(`Staged MIME mismatch for ${item.outputFile}.`);
      if (staged.length < 8_000) throw new Error(`Staged file is too small: ${item.outputFile}.`);
    }
  }
}

async function applySelection(selection, traditions) {
  await validateSelection(selection, traditions);
  for (const tradition of traditions) {
    const expectedHash = selection.preservationHashes?.[tradition.id];
    const actualHash = hashOutsideArtifacts(tradition.raw, tradition.filePath);
    if (!expectedHash || expectedHash !== actualHash) {
      throw new Error(`Non-artifact content changed after discovery: ${tradition.filePath}`);
    }
  }
  const liveRoot = path.resolve(LIVE_DIR);
  const expectedRoot = path.resolve(ROOT, "public", "artifacts");
  if (liveRoot !== expectedRoot || path.basename(liveRoot) !== "artifacts") {
    throw new Error(`Refusing to replace unexpected artifact directory: ${liveRoot}`);
  }

  const backupDir = path.join(STAGE_DIR, `previous-artifacts-${Date.now()}`);
  await mkdir(backupDir, { recursive: true });
  await mkdir(LIVE_DIR, { recursive: true });
  const currentFiles = await readdir(LIVE_DIR, { withFileTypes: true });
  for (const entry of currentFiles) {
    if (!entry.isFile()) throw new Error(`Unexpected non-file in ${LIVE_DIR}: ${entry.name}`);
    await copyFile(path.join(LIVE_DIR, entry.name), path.join(backupDir, entry.name));
  }

  for (const entry of currentFiles) {
    await rm(path.join(LIVE_DIR, entry.name));
  }

  const selectedItems = Object.values(selection.items).flat();
  for (const item of selectedItems) {
    await copyFile(path.join(STAGE_ASSET_DIR, item.outputFile), path.join(LIVE_DIR, item.outputFile));
  }

  for (const tradition of traditions) {
    const rendered = renderArtifacts(selection.items[tradition.id]);
    const updated = replaceArtifactsOnly(tradition.raw, rendered, tradition.filePath);
    if (hashOutsideArtifacts(updated, tradition.filePath) !== selection.preservationHashes[tradition.id]) {
      throw new Error(`Artifact replacement would alter protected content: ${tradition.filePath}`);
    }
    await writeFile(tradition.filePath, updated, "utf8");
  }

  const committed = {
    generatedAt: selection.generatedAt,
    source: "Wikimedia Commons exact file pages",
    retrievalPolicy: "Curator-directed subject queries with license, MIME, dimension, and prohibited-content gates",
    items: selection.items,
  };
  await writeFile(COMMITTED_SELECTION_PATH, `${JSON.stringify(committed, null, 2)}\n`, "utf8");
  console.log(`Applied ${selectedItems.length} curated assets. Previous files backed up at ${backupDir}`);
}

async function main() {
  const mode = process.argv[2] ?? "discover";
  if (!["discover", "apply"].includes(mode)) {
    throw new Error("Usage: node scripts/curate-iconic-artifacts.js [discover|apply]");
  }
  await mkdir(QUERY_DIR, { recursive: true });
  const traditions = await loadTraditions();
  const queries = await loadQueries(traditions);
  console.log(`Validated two curator queries for all ${traditions.length} traditions.`);

  if (mode === "discover") {
    const selection = await discoverSelections(traditions, queries);
    await stageDownloads(selection, traditions.length * 2);
    await validateSelection(selection, traditions);
    console.log(`Discovery complete: ${traditions.length * 2} licensed, exact-source images staged in ${STAGE_ASSET_DIR}`);
    return;
  }

  const selection = await loadStageSelection();
  await applySelection(selection, traditions);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
