// SPDX-License-Identifier: MIT

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const CACHE_FILE = path.join(PROJECT_ROOT, "docs", "commons-metadata-cache.json");

const USER_AGENT = "OpenGrailAtlasBot/1.0 (https://calmdownoscar.com/opengrail; research@calmdownoscar.com)";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": USER_AGENT } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function sourceUrlToTitle(sourceUrl) {
  const prefix = "https://commons.wikimedia.org/wiki/";
  if (!sourceUrl.startsWith(prefix)) return null;
  const decoded = decodeURIComponent(sourceUrl.slice(prefix.length));
  return decoded.replace(/ /g, "_");
}

export async function getAllCorpusArtifacts() {
  const { readdir } = await import("node:fs/promises");
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")
          ? [full]
          : [];
      }),
    );
    return files.flat();
  }

  const files = await walk(DATA_DIR);
  const artifacts = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const { data } = matter(content);
    if (Array.isArray(data.artifacts)) {
      data.artifacts.forEach((art, idx) => {
        artifacts.push({
          traditionId: data.id,
          traditionTitle: data.title,
          cluster: data.cluster,
          summary: data.summary,
          file,
          index: idx,
          artifact: art,
        });
      });
    }
  }

  return artifacts;
}

export async function loadCache() {
  if (existsSync(CACHE_FILE)) {
    try {
      const raw = await readFile(CACHE_FILE, "utf8");
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

export async function saveCache(cache) {
  await mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
}

export async function fetchCommonsBatch(titles) {
  const encoded = titles.map((t) => encodeURIComponent(t)).join("|");
  const queryUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|user|url&format=json&titles=${encoded}`;

  const json = await fetchJson(queryUrl);
  const results = {};

  if (json?.query?.pages) {
    for (const page of Object.values(json.query.pages)) {
      const title = page.title; // e.g. "File:..."
      const normalizedTitle = title.replace(/ /g, "_");
      if (page.missing || !page.imageinfo || page.imageinfo.length === 0) {
        results[normalizedTitle] = { missing: true, title };
        continue;
      }
      const info = page.imageinfo[0];
      const ext = info.extmetadata || {};
      results[normalizedTitle] = {
        title,
        missing: false,
        objectName: ext.ObjectName?.value ? stripHtml(ext.ObjectName.value) : null,
        description: ext.ImageDescription?.value ? stripHtml(ext.ImageDescription.value) : null,
        categories: ext.Categories?.value ? ext.Categories.value.split("|").map((c) => c.trim()).filter(Boolean) : [],
        artist: ext.Artist?.value ? stripHtml(ext.Artist.value) : null,
        license: ext.LicenseShortName?.value ? stripHtml(ext.LicenseShortName.value) : null,
        dateTime: ext.DateTimeOriginal?.value || ext.DateTime?.value || null,
        credit: ext.Credit?.value ? stripHtml(ext.Credit.value) : null,
        fileUrl: info.url || null,
        descriptionUrl: info.descriptionurl || null,
      };
    }
  }

  return results;
}

export async function ensureAllMetadataCached() {
  const artifacts = await getAllCorpusArtifacts();
  const cache = await loadCache();

  const missingTitles = new Set();
  const titleToUrl = new Map();

  for (const item of artifacts) {
    const sourceUrl = item.artifact.sourceUrl;
    if (!sourceUrl) continue;
    const title = sourceUrlToTitle(sourceUrl);
    if (!title) continue;
    titleToUrl.set(title, sourceUrl);
    if (!cache[title]) {
      missingTitles.add(title);
    }
  }

  console.log(`Total artifacts in corpus: ${artifacts.length}`);
  console.log(`Unique Commons titles: ${titleToUrl.size}`);
  console.log(`Already cached: ${titleToUrl.size - missingTitles.size}`);
  console.log(`Need fetching: ${missingTitles.size}`);

  if (missingTitles.size === 0) {
    console.log("All Commons metadata is already cached.");
    return cache;
  }

  const titlesArray = Array.from(missingTitles);
  const BATCH_SIZE = 40;

  for (let i = 0; i < titlesArray.length; i += BATCH_SIZE) {
    const batch = titlesArray.slice(i, i + BATCH_SIZE);
    console.log(`Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(titlesArray.length / BATCH_SIZE)} (${batch.length} files)...`);
    try {
      const results = await fetchCommonsBatch(batch);
      for (const [title, meta] of Object.entries(results)) {
        cache[title] = meta;
      }
      // Also mark any in batch that were not returned by API
      for (const t of batch) {
        if (!cache[t]) {
          // Check if it matched under space vs underscore
          const spaceT = t.replace(/_/g, " ");
          if (results[spaceT]) {
            cache[t] = results[spaceT];
          } else {
            cache[t] = { missing: true, title: t };
          }
        }
      }
      await saveCache(cache);
      await sleep(500); // 500ms rate limit
    } catch (err) {
      console.error(`Error fetching batch: ${err.message}`);
      await sleep(2000);
    }
  }

  console.log(`Finished fetching. Cache now contains ${Object.keys(cache).length} entries.`);
  return cache;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureAllMetadataCached().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
