import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { createWriteStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import https from "node:https";
import matter from "gray-matter";

const ARTIFACTS_DIR = path.resolve("./public/artifacts");

const BLACKLIST_TERMS = [
  "train", "locomotive", "railroad", "railway", "station", "depot", "track",
  "bus", "tram", "trolley", "highway", "bridge", "viaduct", "freeway", "airport",
  "airplane", "vehicle", "car", "truck", "police", "post_office", "stadium", "bank",
  "hotel", "motel", "commons-logo", "ambox", "portal", "disambig", "question_mark",
  "blank", "icon-", "flag-", "locator", "district", "county_courthouse", "subdivision"
];

function isBlacklisted(str) {
  if (!str) return false;
  const l = str.toLowerCase();
  return BLACKLIST_TERMS.some(term => l.includes(term));
}

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

async function searchCommonsReligiousImage(query) {
  const clean = query.replace(/\(.*?\)/g, "").trim();
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=6&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=750&format=json`;
  const json = await fetchJson(url);
  if (!json?.query?.pages) return null;
  const pages = Object.values(json.query.pages);
  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    if (!info) continue;
    const thumbUrl = info.thumburl || info.url;
    const mime = info.mime || "";
    const title = (page.title || "").replace(/^File:/i, "").replace(/\.[^/.]+$/, "");
    if (mime.includes("svg") || isBlacklisted(title) || isBlacklisted(page.title)) continue;
    return {
      title,
      thumbUrl,
      pageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      extract: info.extmetadata?.ImageDescription?.value?.replace(/<[^>]*>?/gm, "").slice(0, 180) || ""
    };
  }
  return null;
}

const CURATED_ANCHORS = {
  "jehovahs-witnesses": {
    art1: {
      title: "Kingdom Hall Worship Sanctuary",
      thumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/JW_Rocky2.jpg/960px-JW_Rocky2.jpg",
      pageUrl: "https://en.wikipedia.org/wiki/Kingdom_Hall",
      provenance: "Worldwide Jehovah's Witnesses Congregations",
      period: "Modern Era",
      description: "A Kingdom Hall is a place of worship used by Jehovah's Witnesses for weekly congregation meetings and Bible education."
    },
    art2: {
      title: "Watch Tower Society Publications & Literature Carts",
      thumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Jehovah%27s_Witnesses_literature_cart_in_France.jpg/960px-Jehovah%27s_Witnesses_literature_cart_in_France.jpg",
      pageUrl: "https://en.wikipedia.org/wiki/The_Watchtower",
      provenance: "Watch Tower Bible and Tract Society",
      period: "1879 CE to present",
      description: "Official published study literature and public Bible dissemination carts used in global ministry."
    }
  },
  "jediism": {
    art1: {
      title: "Ceremonial Lightsaber Prop & Meditation Focus",
      localFile: "jediism-lightsaber.jpg",
      pageUrl: "https://en.wikipedia.org/wiki/Lightsaber",
      provenance: "Modern Popular Mythos & Contemporary Practice",
      period: "Late 20th century CE to present",
      description: "Iconic symbolic focus device adapted from cinematic mythos into contemporary ethical and meditative ritual."
    },
    art2: {
      title: "Temple of the Jedi Order Dokuments & Teachings",
      thumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Jedi_Council_Chamber.jpg/960px-Jedi_Council_Chamber.jpg",
      pageUrl: "https://en.wikipedia.org/wiki/Jediism",
      provenance: "Worldwide Online Communities",
      period: "2005 CE - Present",
      description: "Documented 16 Teachings and 21 Maxims establishing philosophical Jediism as a lived ethical discipline."
    }
  }
};

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
  console.log(`Starting Parallel Religious Artifact Curation for all ${files.length} traditions...`);

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

  // Batch query Wikipedia canonical pages
  console.log("Batch querying Wikipedia for all 536 traditions...");
  const wikiDataMap = new Map();
  const BATCH_SIZE = 50;
  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    const batch = nodes.slice(i, i + BATCH_SIZE);
    const titlesQuery = batch.map(n => n.title.replace(/\(.*?\)/g, "").trim()).join("|");
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titlesQuery)}&prop=pageimages|extracts&exintro=1&explaintext=1&exchars=200&pithumbsize=750&redirects=1&format=json`;
    
    const json = await fetchJson(url);
    if (json?.query?.pages) {
      for (const page of Object.values(json.query.pages)) {
        if (page && !page.missing && page.title) {
          const thumb = page.thumbnail?.source;
          if (thumb && !isBlacklisted(thumb) && !isBlacklisted(page.title)) {
            wikiDataMap.set(page.title.toLowerCase(), {
              title: page.title,
              extract: page.extract || "",
              thumbUrl: thumb,
              pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`
            });
          }
        }
      }
    }
    await sleep(200);
  }
  console.log(`Matched ${wikiDataMap.size} verified Wikipedia canonical pages.`);

  let processed = 0;
  const CHUNK_SIZE = 12;

  for (let i = 0; i < nodes.length; i += CHUNK_SIZE) {
    const chunk = nodes.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map(async (node) => {
      const { filePath, data, content, title, nodeId, cluster, canonicalTexts, originPlace } = node;
      const cleanTitle = title.replace(/\(.*?\)/g, "").trim();

      if (CURATED_ANCHORS[nodeId]) {
        const anchor = CURATED_ANCHORS[nodeId];
        const art1File = `${nodeId}-1.jpg`;
        const art1Path = path.join(ARTIFACTS_DIR, art1File);
        if (anchor.art1.thumbUrl) {
          await downloadFile(anchor.art1.thumbUrl, art1Path);
        }

        const art2File = `${nodeId}-2.jpg`;
        const art2Path = path.join(ARTIFACTS_DIR, art2File);
        if (anchor.art2.thumbUrl) {
          await downloadFile(anchor.art2.thumbUrl, art2Path);
        }

        data.artifacts = [
          {
            title: anchor.art1.title,
            imageUrl: anchor.art1.localFile ? `/artifacts/${anchor.art1.localFile}` : `/artifacts/${art1File}`,
            sourceUrl: anchor.art1.pageUrl,
            provenance: anchor.art1.provenance,
            period: anchor.art1.period,
            description: anchor.art1.description
          },
          {
            title: anchor.art2.title,
            imageUrl: anchor.art2.localFile ? `/artifacts/${anchor.art2.localFile}` : `/artifacts/${art2File}`,
            sourceUrl: anchor.art2.pageUrl,
            provenance: anchor.art2.provenance,
            period: anchor.art2.period,
            description: anchor.art2.description
          }
        ];

        const updated = matter.stringify(content, data);
        await writeFile(filePath, updated, "utf8");
        processed++;
        return;
      }

      const art1File = `${nodeId}-1.jpg`;
      const art1Path = path.join(ARTIFACTS_DIR, art1File);
      let img1Ok = existsSync(art1Path) && statSync(art1Path).size > 1000;

      let wiki1 = wikiDataMap.get(cleanTitle.toLowerCase()) || null;

      if (!img1Ok) {
        let thumbUrl = wiki1?.thumbUrl;
        if (!thumbUrl) {
          const commonsRes = await searchCommonsReligiousImage(`${cleanTitle} temple OR church OR cathedral OR mosque OR shrine OR synagogue OR altar OR stupa OR monastery OR sanctuary`);
          if (commonsRes) {
            thumbUrl = commonsRes.thumbUrl;
            if (!wiki1) wiki1 = commonsRes;
          }
        }
        if (thumbUrl) {
          img1Ok = await downloadFile(thumbUrl, art1Path);
        }
      }

      const art2File = `${nodeId}-2.jpg`;
      const art2Path = path.join(ARTIFACTS_DIR, art2File);
      let img2Ok = existsSync(art2Path) && statSync(art2Path).size > 1000;

      let wiki2 = null;
      if (!img2Ok) {
        const secQuery = canonicalTexts[0] || `${cleanTitle} manuscript OR icon OR scripture OR sacred`;
        const commonsRes = await searchCommonsReligiousImage(secQuery);
        if (commonsRes) {
          wiki2 = commonsRes;
          img2Ok = await downloadFile(commonsRes.thumbUrl, art2Path);
        }
      }

      const art1 = {
        title: wiki1?.title ? `${wiki1.title} Historical Sanctuary & Records` : `${title} Historical Sanctuary & Records`,
        sourceUrl: wiki1?.pageUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanTitle.replace(/ /g, "_"))}`,
        provenance: originPlace || `${cluster} Tradition Origin`,
        period: data.era_start ? `c. ${data.era_start}` : "Formative Era to Present",
        description: wiki1?.extract?.length > 15
          ? wiki1.extract.slice(0, 180).trim() + "..."
          : `Authoritative historical records, sanctuary sites, and material culture associated with ${title}.`
      };
      if (img1Ok) art1.imageUrl = `/artifacts/${art1File}`;
      else if (img2Ok) art1.imageUrl = `/artifacts/${art2File}`;

      const art2 = {
        title: wiki2?.title ? `${wiki2.title} Canonical Scripture & Iconography` : `${title} Sacred Scripture & Art`,
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
      processed++;
    }));

    console.log(`Processed ${processed}/${nodes.length} traditions...`);
    await sleep(250);
  }

  console.log(`\n🎉 High-Accuracy Religious Curation Complete! All ${processed} traditions curated.`);
}

run().catch(console.error);
