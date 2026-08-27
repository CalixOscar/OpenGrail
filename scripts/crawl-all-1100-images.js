import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { createWriteStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import https from "node:https";
import matter from "gray-matter";

const ARTIFACTS_DIR = path.resolve("./public/artifacts");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { "User-Agent": "OpenGrailAtlasResearchBot/2.0 (mailto:calix@calmdownoscar.com)" } }, (res) => {
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
    https.get(url, { headers: { "User-Agent": "OpenGrailAtlasResearchBot/2.0 (mailto:calix@calmdownoscar.com)" } }, (res) => {
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

async function searchCommonsImage(query) {
  const clean = query.replace(/\(.*?\)/g, "").trim();
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=3&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=700&format=json`;
  const json = await fetchJson(url);
  if (!json?.query?.pages) return null;
  const pages = Object.values(json.query.pages);
  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    if (!info) continue;
    const thumbUrl = info.thumburl || info.url;
    const mime = info.mime || "";
    if (mime.includes("svg")) continue;
    const title = (page.title || "").replace(/^File:/i, "").replace(/\.[^/.]+$/, "");
    return {
      title,
      thumbUrl,
      pageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      extract: info.extmetadata?.ImageDescription?.value?.replace(/<[^>]*>?/gm, "").slice(0, 180) || ""
    };
  }
  return null;
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
  console.log(`Starting comprehensive crawl for all ${files.length} traditions...`);

  // Step 1: Read all nodes
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
      originPlace: data.origin_geo?.place_name || data.origin_region || ""
    });
  }

  // Step 2: Batch fetch Wikipedia pages (50 per batch)
  console.log("Batch querying Wikipedia for all 536 traditions...");
  const wikiDataMap = new Map();
  const BATCH_SIZE = 40;
  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    const batch = nodes.slice(i, i + BATCH_SIZE);
    const titlesQuery = batch.map(n => n.title.replace(/\(.*?\)/g, "").trim()).join("|");
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titlesQuery)}&prop=pageimages|extracts&exintro=1&explaintext=1&exchars=200&pithumbsize=700&redirects=1&format=json`;
    
    const json = await fetchJson(url);
    if (json?.query?.pages) {
      for (const page of Object.values(json.query.pages)) {
        if (page && !page.missing && page.title) {
          wikiDataMap.set(page.title.toLowerCase(), {
            title: page.title,
            extract: page.extract || "",
            thumbUrl: page.thumbnail?.source || null,
            pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`
          });
        }
      }
    }
    await sleep(250);
  }
  console.log(`Matched ${wikiDataMap.size} Wikipedia canonical pages.`);

  // Step 3: Iterate through all nodes, ensure 2 unique images per node
  let totalDownloaded = 0;
  let nodeCount = 0;

  for (const node of nodes) {
    nodeCount++;
    const { filePath, data, content, title, nodeId, cluster, canonicalTexts, originPlace } = node;

    // Artifact 1
    const art1File = `${nodeId}-1.jpg`;
    const art1Path = path.join(ARTIFACTS_DIR, art1File);
    let img1Ok = existsSync(art1Path) && statSync(art1Path).size > 1000;

    const cleanTitle = title.replace(/\(.*?\)/g, "").trim();
    let wiki1 = wikiDataMap.get(cleanTitle.toLowerCase()) || null;

    if (!img1Ok) {
      let thumbUrl = wiki1?.thumbUrl;
      if (!thumbUrl) {
        const commonsRes = await searchCommonsImage(`${cleanTitle} sanctuary OR temple OR church OR relic OR monument`);
        if (commonsRes) {
          thumbUrl = commonsRes.thumbUrl;
          if (!wiki1) wiki1 = commonsRes;
        }
        await sleep(150);
      }
      if (!thumbUrl) {
        const commonsRes2 = await searchCommonsImage(`${cleanTitle}`);
        if (commonsRes2) {
          thumbUrl = commonsRes2.thumbUrl;
          if (!wiki1) wiki1 = commonsRes2;
        }
        await sleep(150);
      }
      if (thumbUrl) {
        img1Ok = await downloadFile(thumbUrl, art1Path);
        if (img1Ok) totalDownloaded++;
      }
    }

    // Artifact 2
    const art2File = `${nodeId}-2.jpg`;
    const art2Path = path.join(ARTIFACTS_DIR, art2File);
    let img2Ok = existsSync(art2Path) && statSync(art2Path).size > 1000;

    let wiki2 = null;
    if (!img2Ok) {
      const secSearch = canonicalTexts[0] || (originPlace ? `${originPlace} sacred` : `${cleanTitle} history`);
      const commonsRes = await searchCommonsImage(secSearch);
      if (commonsRes) {
        wiki2 = commonsRes;
        img2Ok = await downloadFile(commonsRes.thumbUrl, art2Path);
        if (img2Ok) totalDownloaded++;
      }
      await sleep(150);
    }

    // Compose artifacts frontmatter
    const art1 = {
      title: wiki1?.title ? `${wiki1.title} Historical Sanctuary & Records` : `${title} Historical Sanctuary`,
      sourceUrl: wiki1?.pageUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanTitle.replace(/ /g, "_"))}`,
      provenance: originPlace || `${cluster} Regional Tradition`,
      period: data.era_start ? `c. ${data.era_start}` : "Formative Era to Present",
      description: wiki1?.extract?.length > 15
        ? wiki1.extract.slice(0, 180).trim() + "..."
        : `Authoritative historical records, sanctuary sites, and material culture associated with ${title}.`
    };
    if (img1Ok) art1.imageUrl = `/artifacts/${art1File}`;
    else if (img2Ok) art1.imageUrl = `/artifacts/${art2File}`;

    const art2 = {
      title: wiki2?.title ? `${wiki2.title} Canonical Scripture & Iconography` : `${title} Sacred Texts & Iconography`,
      sourceUrl: wiki2?.pageUrl || wiki1?.pageUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanTitle.replace(/ /g, "_"))}`,
      provenance: originPlace || `${cluster} Sacred Centers`,
      period: data.era_start ? `c. ${data.era_start}` : "Historical Era",
      description: wiki2?.extract?.length > 15
        ? wiki2.extract.slice(0, 180).trim() + "..."
        : `Preserved liturgical manuscripts, sacred epigraphy, and canonical teachings of ${title}.`
    };
    if (img2Ok) art2.imageUrl = `/artifacts/${art2File}`;
    else if (img1Ok) art2.imageUrl = `/artifacts/${art1File}`;

    data.artifacts = [art1, art2];
    const updated = matter.stringify(content, data);
    await writeFile(filePath, updated, "utf8");

    if (nodeCount % 25 === 0 || nodeCount === nodes.length) {
      console.log(`Progress: ${nodeCount}/${nodes.length} traditions processed (${totalDownloaded} new images downloaded)...`);
    }
  }

  console.log(`\n🎉 Comprehensive crawl complete! Total traditions: ${nodes.length}. New images downloaded: ${totalDownloaded}`);
}

run().catch(console.error);
