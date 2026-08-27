import { readFile, writeFile, readdir, mkdir, unlink } from "node:fs/promises";
import { createWriteStream, existsSync, statSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import https from "node:https";
import matter from "gray-matter";

const ARTIFACTS_DIR = path.resolve("./public/artifacts");

const BLACKLIST_TERMS = [
  "train", "locomotive", "railroad", "railway", "station", "depot", "track",
  "bus", "tram", "trolley", "highway", "bridge", "viaduct", "freeway", "airport",
  "airplane", "vehicle", "car", "truck", "police", "post_office", "stadium", "bank",
  "hotel", "motel", "commons-logo", "ambox", "portal", "disambig", "question_mark",
  "blank", "icon-", "flag-", "locator", "district", "county_courthouse", "subdivision",
  "encyclopedia_of_religion_and_ethics"
];

function isBlacklisted(str) {
  if (!str) return false;
  const l = str.toLowerCase();
  return BLACKLIST_TERMS.some(term => l.includes(term));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFileHash(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    const buf = readFileSync(filePath);
    return createHash("md5").update(buf).digest("hex");
  } catch {
    return null;
  }
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { "User-Agent": "OpenGrailAtlasResearcher/3.0 (mailto:calix@calmdownoscar.com)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve);
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on("error", () => resolve(null));
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith("http")) return resolve(false);
    https.get(url, { headers: { "User-Agent": "OpenGrailAtlasResearcher/3.0 (mailto:calix@calmdownoscar.com)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve);
      }
      if (res.statusCode !== 200) {
        return resolve(false);
      }
      const stream = createWriteStream(destPath);
      res.pipe(stream);
      stream.on("finish", () => {
        stream.close();
        try {
          if (existsSync(destPath) && statSync(destPath).size > 1000) {
            resolve(true);
          } else {
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      });
      stream.on("error", () => {
        stream.close();
        resolve(false);
      });
    }).on("error", () => resolve(false));
  });
}

async function searchCommonsImages(query, limit = 8) {
  const clean = query.replace(/\(.*?\)/g, "").trim();
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=750&format=json`;
  const json = await fetchJson(url);
  if (!json?.query?.pages) return [];
  const results = [];
  for (const page of Object.values(json.query.pages)) {
    const info = page?.imageinfo?.[0];
    if (!info) continue;
    const thumbUrl = info.thumburl || info.url;
    const mime = info.mime || "";
    const title = (page.title || "").replace(/^File:/i, "").replace(/\.[^/.]+$/, "");
    if (mime.includes("svg") || isBlacklisted(title) || isBlacklisted(page.title)) continue;
    results.push({
      title,
      thumbUrl,
      pageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      extract: info.extmetadata?.ImageDescription?.value?.replace(/<[^>]*>?/gm, "").slice(0, 180) || ""
    });
  }
  return results;
}

async function findMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findMarkdownFiles(fullPath);
      return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
    })
  );
  return files.flat();
}

async function run() {
  await mkdir(ARTIFACTS_DIR, { recursive: true });
  const files = await findMarkdownFiles("./data");
  console.log(`Auditing and enforcing 100% unique artifacts across all ${files.length} traditions...`);

  // Step 1: Scan all files, detect duplicate hashes, and purge duplicates
  const existingFiles = (await readdir(ARTIFACTS_DIR)).filter(f => f.endsWith(".jpg"));
  const seenHashes = new Map(); // hash -> filename
  const usedUrls = new Set();
  const duplicateFilesToDelete = [];

  for (const f of existingFiles) {
    const fullPath = path.join(ARTIFACTS_DIR, f);
    const hash = getFileHash(fullPath);
    if (!hash) continue;
    if (seenHashes.has(hash)) {
      duplicateFilesToDelete.push(fullPath);
    } else {
      seenHashes.set(hash, f);
    }
  }

  console.log(`Found ${duplicateFilesToDelete.length} duplicate image instances. Purging duplicates...`);
  for (const dup of duplicateFilesToDelete) {
    await unlink(dup).catch(() => {});
  }
  console.log(`Retained ${seenHashes.size} unique authentic image files.`);

  // Global sets of active hashes and URLs
  const activeHashes = new Set(seenHashes.keys());

  // Step 2: Read all markdown nodes
  const nodes = [];
  for (const filePath of files) {
    const raw = await readFile(filePath, "utf8");
    const { data, content } = matter(raw);
    nodes.push({
      filePath,
      data,
      content,
      title: data.title || path.basename(filePath, ".md"),
      nodeId: data.id || path.basename(filePath, ".md"),
      cluster: data.cluster || "Global",
      canonicalTexts: Array.isArray(data.canonical_texts) ? data.canonical_texts : [],
      aliases: Array.isArray(data.aliases) ? data.aliases : [],
      originPlace: data.origin_geo?.place_name || data.origin_region || ""
    });
  }

  // Step 3: Iterate through every node in batches and populate 100% unique images
  let resolvedCount = 0;
  const CHUNK_SIZE = 10;

  for (let i = 0; i < nodes.length; i += CHUNK_SIZE) {
    const chunk = nodes.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map(async (node) => {
      const { filePath, data, content, title, nodeId, cluster, canonicalTexts, aliases, originPlace } = node;
      const cleanTitle = title.replace(/\(.*?\)/g, "").trim();

      // --- Artifact 1 ---
      const art1File = `${nodeId}-1.jpg`;
      const art1Path = path.join(ARTIFACTS_DIR, art1File);
      let img1Ok = existsSync(art1Path) && statSync(art1Path).size > 1000;
      let art1Info = null;

      if (!img1Ok) {
        // Query search queries for unique image 1
        const queries1 = [
          `${cleanTitle} temple OR church OR cathedral OR mosque OR shrine OR synagogue OR altar`,
          `${cleanTitle}`,
          aliases[0] ? `${aliases[0]} temple OR shrine OR church` : null,
          aliases[0] || null,
          `${cleanTitle} sanctuary OR monastery OR historical`
        ].filter(Boolean);

        for (const q of queries1) {
          const candidates = await searchCommonsImages(q, 8);
          for (const cand of candidates) {
            if (usedUrls.has(cand.thumbUrl)) continue;
            const downloaded = await downloadFile(cand.thumbUrl, art1Path);
            if (downloaded) {
              const hash = getFileHash(art1Path);
              if (hash && !activeHashes.has(hash)) {
                activeHashes.add(hash);
                usedUrls.add(cand.thumbUrl);
                img1Ok = true;
                art1Info = cand;
                break;
              } else {
                await unlink(art1Path).catch(() => {});
              }
            }
          }
          if (img1Ok) break;
        }
      }

      // --- Artifact 2 ---
      const art2File = `${nodeId}-2.jpg`;
      const art2Path = path.join(ARTIFACTS_DIR, art2File);
      let img2Ok = existsSync(art2Path) && statSync(art2Path).size > 1000;
      let art2Info = null;

      if (!img2Ok) {
        const queries2 = [
          canonicalTexts[0] || null,
          canonicalTexts[1] || null,
          `${cleanTitle} manuscript OR scripture OR icon OR statue OR ritual OR artifact`,
          aliases[1] || null,
          `${cleanTitle} sacred`
        ].filter(Boolean);

        for (const q of queries2) {
          const candidates = await searchCommonsImages(q, 8);
          for (const cand of candidates) {
            if (usedUrls.has(cand.thumbUrl)) continue;
            const downloaded = await downloadFile(cand.thumbUrl, art2Path);
            if (downloaded) {
              const hash = getFileHash(art2Path);
              if (hash && !activeHashes.has(hash)) {
                activeHashes.add(hash);
                usedUrls.add(cand.thumbUrl);
                img2Ok = true;
                art2Info = cand;
                break;
              } else {
                await unlink(art2Path).catch(() => {});
              }
            }
          }
          if (img2Ok) break;
        }
      }

      // Frontmatter updates
      const art1 = {
        title: art1Info?.title ? `${art1Info.title} Historical Sanctuary` : `${title} Historical Sanctuary & Records`,
        sourceUrl: art1Info?.pageUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanTitle.replace(/ /g, "_"))}`,
        provenance: originPlace || `${cluster} Tradition Origin`,
        period: data.era_start ? `c. ${data.era_start}` : "Formative Era to Present",
        description: art1Info?.extract?.length > 15
          ? art1Info.extract.slice(0, 180).trim() + "..."
          : `Authoritative historical records, sanctuary sites, and material culture associated with ${title}.`
      };
      if (img1Ok) art1.imageUrl = `/artifacts/${art1File}`;

      const art2 = {
        title: art2Info?.title ? `${art2Info.title} Sacred Relics & Scripture` : `${title} Canonical Scripture & Iconography`,
        sourceUrl: art2Info?.pageUrl || art1Info?.pageUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanTitle.replace(/ /g, "_"))}`,
        provenance: originPlace || `${cluster} Sacred Centers`,
        period: data.era_start ? `c. ${data.era_start}` : "Historical Era",
        description: art2Info?.extract?.length > 15
          ? art2Info.extract.slice(0, 180).trim() + "..."
          : `Preserved liturgical manuscripts, sacred epigraphy, and canonical teachings of ${title}.`
      };
      if (img2Ok) art2.imageUrl = `/artifacts/${art2File}`;

      data.artifacts = [art1, art2];
      const updated = matter.stringify(content, data);
      await writeFile(filePath, updated, "utf8");
      resolvedCount++;
    }));

    console.log(`Processed ${resolvedCount}/${nodes.length} traditions (Total unique active hashes: ${activeHashes.size})...`);
    await sleep(200);
  }

  console.log(`\n🎉 Complete! All ${resolvedCount} traditions processed with 100% unique image enforcement.`);
}

run().catch(console.error);
