import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ARTIFACT_TOPICS = [
  { file: "judaism-western-wall.jpg", title: "Western_Wall" },
  { file: "judaism-torah-scroll.jpg", title: "Aleppo_Codex" },
  { file: "christianity-basilica.jpg", title: "St._Peter%27s_Basilica" },
  { file: "christianity-codex.jpg", title: "Codex_Vaticanus" },
  { file: "orthodoxy-hagia-sophia.jpg", title: "Hagia_Sophia" },
  { file: "orthodoxy-icon-pantocrator.jpg", title: "Christ_Pantocrator_(Sinai)" },
  { file: "protestantism-wittenberg.jpg", title: "All_Saints%27_Church,_Wittenberg" },
  { file: "protestantism-luther-bible.jpg", title: "Luther_Bible" },
  { file: "islam-dome-of-rock.jpg", title: "Dome_of_the_Rock" },
  { file: "islam-blue-quran.jpg", title: "Blue_Quran" },
  { file: "buddhism-mahabodhi.jpg", title: "Mahabodhi_Temple" },
  { file: "buddhism-sarnath-buddha.jpg", title: "Dharmachakra_Pravartana_Buddha_at_Sarnath" },
  { file: "hinduism-brihadisvara.jpg", title: "Brihadisvara_Temple" },
  { file: "hinduism-nataraja.jpg", title: "Nataraja" },
  { file: "sikhism-golden-temple.jpg", title: "Golden_Temple" },
  { file: "sikhism-guru-granth.jpg", title: "Guru_Granth_Sahib" },
  { file: "jainism-gommateshwara.jpg", title: "Gommateshwara_statue" },
  { file: "jainism-dilwara-temple.jpg", title: "Dilwara_Temples" },
  { file: "daoism-wudang-hall.jpg", title: "Wudang_Mountains" },
  { file: "shinto-torii-gate.jpg", title: "Itsukushima_Shrine" },
  { file: "zoroastrian-faravahar.jpg", title: "Faravahar" },
  { file: "zoroastrian-fire-temple.jpg", title: "Yazd_Atash_Behram" },
  { file: "ancient-parthenon.jpg", title: "Parthenon" },
  { file: "mesoamerican-pyramid.jpg", title: "El_Castillo,_Chichen_Itza" },
  { file: "african-ife-bronze.jpg", title: "Bronze_Head_from_Ife" }
];

const dir = "public/artifacts";
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "OpenGrailAtlasResearchBot/1.0 (https://opengrail.org; research@opengrail.org)" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`JSON error on ${url}: ${data.slice(0, 100)}`));
        }
      });
    }).on("error", reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "OpenGrailAtlasResearchBot/1.0 (https://opengrail.org; research@opengrail.org)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
    }).on("error", reject);
  });
}

async function run() {
  console.log("Fetching real Wikipedia museum photographs with calm rate limit...");
  for (const item of ARTIFACT_TOPICS) {
    const destPath = path.join(dir, item.file);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 10000) {
      console.log(`✓ Already downloaded: ${item.file}`);
      continue;
    }
    await sleep(1500);
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${item.title}&prop=pageimages&format=json&pithumbsize=800`;
    try {
      const json = await fetchJson(apiUrl);
      const pages = json?.query?.pages;
      const page = Object.values(pages || {})[0];
      const thumbUrl = page?.thumbnail?.source;
      if (thumbUrl) {
        await sleep(1200);
        await downloadFile(thumbUrl, destPath);
        console.log(`✓ Downloaded real photo: ${item.file} (${(fs.statSync(destPath).size / 1024).toFixed(1)} KB)`);
      } else {
        console.warn(`! No thumb for ${item.title}`);
      }
    } catch (err) {
      console.error(`X Error on ${item.title}:`, err.message);
    }
  }
  console.log("All real photographs saved in public/artifacts/!");
}

run();
