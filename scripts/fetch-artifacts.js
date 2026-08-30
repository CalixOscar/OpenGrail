// SPDX-License-Identifier: MIT

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_MANIFEST = path.join(PROJECT_ROOT, "data", "artifact-manifest.json");
const DEFAULT_OUT_DIR = path.join(PROJECT_ROOT, "public", "artifacts");
const USER_AGENT = "OpenGrailAtlasArtifactFetcher/1.0 (https://github.com/CalixOscar/OpenGrail; contact: research@calmdownoscar.com)";
const THUMB_WIDTH = 1400;
const MAX_ATTEMPTS = 5;
const REQUEST_SPACING_MS = 250;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, isJson = false) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": USER_AGENT,
          ...(options.headers || {}),
        },
      });

      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : attempt * 1500;
        await delay(waitMs);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      if (isJson) {
        return await response.json();
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      await delay(attempt * 1200);
    }
  }
  throw new Error(`Failed to fetch ${url} after ${MAX_ATTEMPTS} attempts`);
}

function extractFileTitle(sourceUrl) {
  return decodeURIComponent(
    sourceUrl.replace(/^https:\/\/commons\.wikimedia\.org\/wiki\//, "").replace(/_/g, " ")
  );
}

let lastApiStartedAt = 0;
let apiQueue = Promise.resolve();

function serializedApiFetch(url) {
  const task = apiQueue.then(async () => {
    const waitMs = Math.max(0, REQUEST_SPACING_MS - (Date.now() - lastApiStartedAt));
    if (waitMs) await delay(waitMs);
    lastApiStartedAt = Date.now();
    return fetchWithRetry(url, {}, true);
  });
  apiQueue = task.catch(() => {});
  return task;
}

export async function resolveBatchDownloadUrls(entries) {
  const titleToEntries = new Map();
  for (const entry of entries) {
    const title = extractFileTitle(entry.sourceUrl);
    entry._fileTitle = title;
    if (!titleToEntries.has(title)) {
      titleToEntries.set(title, []);
    }
    titleToEntries.get(title).push(entry);
  }

  const titlesParam = Array.from(titleToEntries.keys()).join("|");
  const params = new URLSearchParams({
    action: "query",
    titles: titlesParam,
    prop: "imageinfo",
    iiprop: "url|size|mime",
    iiurlwidth: String(THUMB_WIDTH),
    format: "json",
    formatversion: "2",
  });

  const payload = await serializedApiFetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = payload?.query?.pages || [];

  const normMap = new Map();
  if (payload?.query?.normalized) {
    for (const n of payload.query.normalized) {
      normMap.set(n.from, n.to);
    }
  }
  if (payload?.query?.redirects) {
    for (const r of payload.query.redirects) {
      normMap.set(r.from, r.to);
    }
  }

  const pagesByTitle = new Map();
  for (const page of pages) {
    pagesByTitle.set(page.title, page);
  }

  for (const entry of entries) {
    let t = entry._fileTitle;
    let page = pagesByTitle.get(t);
    if (!page && normMap.has(t)) {
      page = pagesByTitle.get(normMap.get(t));
    }
    if (!page) {
      for (const [pt, p] of pagesByTitle.entries()) {
        if (pt.toLowerCase() === t.toLowerCase()) {
          page = p;
          break;
        }
      }
    }

    if (page && page.missing) {
      entry._resolveError = `File page is marked as missing on Wikimedia Commons`;
    } else if (page?.imageinfo?.[0]) {
      const info = page.imageinfo[0];
      entry._downloadUrl = info.thumburl || info.url;
    } else {
      entry._resolveError = `No imageinfo returned for ${entry._fileTitle}`;
    }
  }
}

async function runWorkerPool(items, concurrency, worker) {
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(workers);
}

export async function fetchArtifacts(options = {}) {
  const manifestPath = path.resolve(options.manifest || DEFAULT_MANIFEST);
  const outDir = path.resolve(options.out || DEFAULT_OUT_DIR);
  const concurrency = Number(options.concurrency) || 4;
  const batchSize = Number(options.batchSize) || 40;

  console.log(`Reading artifact manifest from: ${manifestPath}`);
  console.log(`Output directory: ${outDir}`);

  const manifestRaw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  await mkdir(outDir, { recursive: true });

  const toFetch = [];
  let skippedLocalCount = 0;
  let skippedVendoredCount = 0;

  for (const entry of manifest) {
    if (entry.source === "vendored") {
      skippedVendoredCount += 1;
      continue;
    }
    const targetFile = path.join(outDir, entry.filename);
    try {
      const existing = await readFile(targetFile);
      const existingHash = createHash("sha256").update(existing).digest("hex");
      if (existingHash === entry.sha256) {
        skippedLocalCount += 1;
        continue;
      }
    } catch {
      // File missing or unreadable -> needs fetch
    }
    toFetch.push(entry);
  }

  console.log(`Total artifacts in manifest: ${manifest.length}`);
  console.log(`Skipped (vendored / tracked): ${skippedVendoredCount}`);
  console.log(`Already present with matching sha256: ${skippedLocalCount}`);
  console.log(`Need download: ${toFetch.length}`);

  if (toFetch.length === 0) {
    console.log("All fetchable artifact images are present and verified. Nothing to download.");
    return {
      total: manifest.length,
      skippedVendored: skippedVendoredCount,
      skippedLocal: skippedLocalCount,
      skipped: skippedVendoredCount + skippedLocalCount,
      downloaded: 0,
      failed: [],
    };
  }

  console.log(`Resolving download URLs from Wikimedia Commons in batches of ${batchSize}...`);
  for (let i = 0; i < toFetch.length; i += batchSize) {
    const batch = toFetch.slice(i, i + batchSize);
    await resolveBatchDownloadUrls(batch);
    const progress = Math.min(i + batchSize, toFetch.length);
    if (progress % 200 === 0 || progress === toFetch.length) {
      console.log(`Resolved URLs for ${progress}/${toFetch.length} images...`);
    }
  }

  const failures = [];
  const readyToDownload = [];

  for (const entry of toFetch) {
    if (entry._resolveError || !entry._downloadUrl) {
      failures.push({
        filename: entry.filename,
        sourceUrl: entry.sourceUrl,
        expectedSha256: entry.sha256,
        error: entry._resolveError || "Unknown resolution failure",
      });
    } else {
      readyToDownload.push(entry);
    }
  }

  console.log(`Starting downloads for ${readyToDownload.length} files (concurrency: ${concurrency})...`);
  let downloadedCount = 0;

  await runWorkerPool(readyToDownload, concurrency, async (entry) => {
    const targetFile = path.join(outDir, entry.filename);
    try {
      const buffer = await fetchWithRetry(entry._downloadUrl);
      const actualHash = createHash("sha256").update(buffer).digest("hex");

      if (actualHash !== entry.sha256) {
        failures.push({
          filename: entry.filename,
          sourceUrl: entry.sourceUrl,
          expectedSha256: entry.sha256,
          actualSha256: actualHash,
          downloadUrl: entry._downloadUrl,
          expectedSize: entry.size,
          actualSize: buffer.length,
          error: `Checksum mismatch: expected sha256 ${entry.sha256} (${entry.size} bytes), got ${actualHash} (${buffer.length} bytes)`,
        });
        return;
      }

      await writeFile(targetFile, buffer);
      downloadedCount += 1;

      if (downloadedCount % 50 === 0 || downloadedCount === readyToDownload.length) {
        console.log(`Downloaded and verified ${downloadedCount}/${readyToDownload.length} files...`);
      }
    } catch (err) {
      failures.push({
        filename: entry.filename,
        sourceUrl: entry.sourceUrl,
        expectedSha256: entry.sha256,
        downloadUrl: entry._downloadUrl,
        error: `Download failed: ${err.message}`,
      });
    }
  });

  console.log("\n=======================================================");
  console.log("ARTIFACT FETCH SUMMARY");
  console.log("=======================================================");
  console.log(`Total in manifest:      ${manifest.length}`);
  console.log(`Skipped (vendored):     ${skippedVendoredCount}`);
  console.log(`Skipped (valid local):  ${skippedLocalCount}`);
  console.log(`Downloaded & verified:  ${downloadedCount}`);
  console.log(`Failed:                 ${failures.length}`);
  console.log("=======================================================");

  if (failures.length > 0) {
    console.error(`\nFAILED FILES (${failures.length}):`);
    failures.forEach((f, idx) => {
      console.error(`\n[${idx + 1}/${failures.length}] ${f.filename}`);
      console.error(`  Source:   ${f.sourceUrl}`);
      console.error(`  Error:    ${f.error}`);
      if (f.expectedSha256 && f.actualSha256) {
        console.error(`  Expected: ${f.expectedSha256} (${f.expectedSize} bytes)`);
        console.error(`  Actual:   ${f.actualSha256} (${f.actualSize} bytes)`);
      }
    });
    process.exitCode = 1;
  } else {
    console.log("All images fetched and verified successfully with matching sha256 checksums.");
  }

  return {
    total: manifest.length,
    skippedVendored: skippedVendoredCount,
    skippedLocal: skippedLocalCount,
    skipped: skippedVendoredCount + skippedLocalCount,
    downloaded: downloadedCount,
    failed: failures,
  };
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--out" && i + 1 < args.length) {
      options.out = args[i + 1];
      i += 1;
    } else if (args[i] === "--manifest" && i + 1 < args.length) {
      options.manifest = args[i + 1];
      i += 1;
    } else if (args[i] === "--concurrency" && i + 1 < args.length) {
      options.concurrency = Number(args[i + 1]);
      i += 1;
    }
  }
  return options;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseCliArgs();
  fetchArtifacts(options).catch((err) => {
    console.error("Artifact fetch script terminated with fatal error:", err);
    process.exit(1);
  });
}
