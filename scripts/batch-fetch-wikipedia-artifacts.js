import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { createWriteStream, existsSync } from "node:fs";
import path from "node:path";
import https from "node:https";
import matter from "gray-matter";

const ARTIFACTS_DIR = path.resolve("./public/artifacts");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "OpenGrailAtlasBot/1.0 (https://calmdownoscar.com/opengrail; research@calmdownoscar.com)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve, reject);
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on("error", reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "OpenGrailAtlasBot/1.0 (https://calmdownoscar.com/opengrail)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return resolve(false);
      }
      const stream = createWriteStream(destPath);
      res.pipe(stream);
      stream.on("finish", () => {
        stream.close();
        resolve(true);
      });
      stream.on("error", (err) => {
        stream.close();
        resolve(false);
      });
    }).on("error", () => resolve(false));
  });
}

async function getWikipediaData(searchTerm) {
  try {
    const cleanSearch = searchTerm.replace(/\(.*?\)/g, "").trim();
    const queryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanSearch)}&prop=pageimages|extracts&exintro=1&explaintext=1&exchars=240&format=json&pithumbsize=600`;
    const json = await fetchJson(queryUrl);
    if (!json?.query?.pages) return null;
    const page = Object.values(json.query.pages)[0];
    if (!page || page.missing || page.pageid === undefined) return null;
    return {
      title: page.title,
      extract: page.extract || "",
      thumbUrl: page.thumbnail?.source || null,
      pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`
    };
  } catch {
    return null;
  }
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
  console.log(`Found ${files.length} tradition files to enrich with Wikipedia artifacts & imagery.`);

  let processed = 0;
  let downloadedCount = 0;

  // Process in small parallel chunks to respect Wikipedia API limits
  const CHUNK_SIZE = 8;
  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
    const chunk = files.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map(async (filePath) => {
      const raw = await readFile(filePath, "utf8");
      const { data, content } = matter(raw);

      const title = data.title || path.basename(filePath, ".md");
      const nodeId = data.id || path.basename(filePath, ".md");
      const cluster = data.cluster || "Global";
      const canonicalTexts = Array.isArray(data.canonical_texts) ? data.canonical_texts : [];

      // Query 1: Main Tradition
      const mainWiki = await getWikipediaData(title);
      // Query 2: Canonical text or secondary keyword
      const secSearch = canonicalTexts[0] || `${title} religion`;
      const secWiki = await getWikipediaData(secSearch);

      const artifacts = [];

      // Artifact 1: Primary Tradition Photographic Record
      const art1File = `${nodeId}-1.jpg`;
      const art1Path = path.join(ARTIFACTS_DIR, art1File);
      let hasImg1 = existsSync(art1Path);

      if (!hasImg1 && mainWiki?.thumbUrl) {
        hasImg1 = await downloadFile(mainWiki.thumbUrl, art1Path);
        if (hasImg1) downloadedCount++;
      }

      artifacts.push({
        title: mainWiki ? `${mainWiki.title} Historical Sanctuary & Records` : `${title} Historical Records`,
        imageUrl: hasImg1 ? `/artifacts/${art1File}` : (data.artifacts?.[0]?.imageUrl || "/artifacts/ancient-parthenon.jpg"),
        sourceUrl: mainWiki?.pageUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
        provenance: data.origin_region || `${cluster} Tradition Origin`,
        period: data.era_start ? `c. ${data.era_start}` : "Formative Era to Present",
        description: mainWiki?.extract?.length > 20
          ? mainWiki.extract.slice(0, 180).trim() + "..."
          : `Authoritative historical records, sanctuary sites, and material culture associated with ${title}.`
      });

      // Artifact 2: Primary Canonical / Relic Record
      const art2File = `${nodeId}-2.jpg`;
      const art2Path = path.join(ARTIFACTS_DIR, art2File);
      let hasImg2 = existsSync(art2Path);

      if (!hasImg2 && secWiki?.thumbUrl) {
        hasImg2 = await downloadFile(secWiki.thumbUrl, art2Path);
        if (hasImg2) downloadedCount++;
      }

      artifacts.push({
        title: secWiki ? `${secWiki.title} Canonical Scripture & Iconography` : `${title} Sacred Texts & Material Culture`,
        imageUrl: hasImg2 ? `/artifacts/${art2File}` : (hasImg1 ? `/artifacts/${art1File}` : (data.artifacts?.[1]?.imageUrl || "/artifacts/christianity-codex.jpg")),
        sourceUrl: secWiki?.pageUrl || mainWiki?.pageUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
        provenance: data.origin_geo?.place_name || `${cluster} Regional Centers`,
        period: data.era_start ? `c. ${data.era_start}` : "Historical Era",
        description: secWiki?.extract?.length > 20
          ? secWiki.extract.slice(0, 180).trim() + "..."
          : `Preserved liturgical manuscripts, sacred epigraphy, and canonical teachings of ${title}.`
      });

      data.artifacts = artifacts;
      const updated = matter.stringify(content, data);
      await writeFile(filePath, updated, "utf8");
      processed++;
    }));

    console.log(`Processed ${processed}/${files.length} traditions (Downloaded ${downloadedCount} new images)...`);
  }

  console.log(`\n🎉 Completed! Processed ${processed} traditions. Total new images downloaded: ${downloadedCount}`);
}

run().catch(console.error);
