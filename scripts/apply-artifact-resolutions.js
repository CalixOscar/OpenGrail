// SPDX-License-Identifier: MIT

import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { getAllCorpusArtifacts, sourceUrlToTitle } from "./fetch-commons-metadata.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const BATCH_DIR = path.join(PROJECT_ROOT, "scripts", "batches");
const RESOLUTIONS_FILE = path.join(PROJECT_ROOT, "docs", "artifact-source-resolutions.json");
const ARTIFACTS_DIR = path.join(PROJECT_ROOT, "public", "artifacts");

function formatYamlString(str) {
  if (!str) return '""';
  const escaped = str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

export async function run() {
  const artifacts = await getAllCorpusArtifacts();
  const cache = JSON.parse(await readFile(path.join(PROJECT_ROOT, "docs", "commons-metadata-cache.json"), "utf8"));

  // Load all 12 batches
  const batchMap = new Map();
  for (let b = 1; b <= 12; b++) {
    const p = path.join(BATCH_DIR, `batch-${b}-output.json`);
    const data = JSON.parse(await readFile(p, "utf8"));
    for (const item of data) {
      batchMap.set(`${item.traditionId}:${item.slot}`, item);
    }
  }

  console.log(`Loaded ${batchMap.size} legacy artifact decisions from 12 batches.`);

  const masterResolutions = [];
  const filesToUpdate = new Map();
  const imagesToDelete = [];

  let totalSupported = 0;
  let totalUnsupported = 0;
  let totalUndetermined = 0;

  for (const item of artifacts) {
    const isLegacy = /selected as a defining visual reference for/i.test(item.artifact.description || "");
    const fileTitle = sourceUrlToTitle(item.artifact.sourceUrl);
    const meta = cache[fileTitle] || {};
    const key = `${item.traditionId}:${item.index + 1}`;

    let verdict, reason, newTitle, newProvenance;

    if (isLegacy) {
      const decision = batchMap.get(key);
      if (!decision) {
        throw new Error(`Missing batch decision for ${key}`);
      }
      verdict = decision.verdict;
      reason = decision.reason;
      newTitle = decision.newTitle;
      newProvenance = decision.newProvenance;
    } else {
      // 122 expansion artifacts: hand-verified
      verdict = "Supported";
      reason = "Hand-verified in 122-tradition expansion pass; authentic iconography, sanctuary, or documentary image.";
      newTitle = item.artifact.title;
      newProvenance = item.artifact.provenance;
    }

    if (verdict === "Supported") totalSupported++;
    else if (verdict === "Unsupported") totalUnsupported++;
    else totalUndetermined++;

    masterResolutions.push({
      traditionId: item.traditionId,
      slot: item.index + 1,
      sourceUrl: item.artifact.sourceUrl,
      imageUrl: item.artifact.imageUrl,
      commonsFileTitle: fileTitle,
      objectName: meta.objectName || null,
      commonsDescription: meta.description ? meta.description.slice(0, 300) : null,
      verdict,
      caption: newTitle,
      provenance: newProvenance,
      reason
    });

    if (!filesToUpdate.has(item.file)) {
      filesToUpdate.set(item.file, []);
    }

    if (verdict === "Supported") {
      const updatedArt = {
        ...item.artifact,
        title: newTitle || item.artifact.title,
        provenance: newProvenance || item.artifact.provenance,
      };
      // Delete boilerplate description
      if (isLegacy) {
        delete updatedArt.description;
      }
      filesToUpdate.get(item.file).push(updatedArt);
    } else {
      // Mark local webp file for deletion
      if (item.artifact.imageUrl && item.artifact.imageUrl.startsWith("/artifacts/")) {
        const filename = path.basename(item.artifact.imageUrl);
        imagesToDelete.push(filename);
      }
    }
  }

  console.log(`Resolution counts:`);
  console.log(`  Total evaluated: ${masterResolutions.length}`);
  console.log(`  Supported:       ${totalSupported}`);
  console.log(`  Unsupported:     ${totalUnsupported}`);
  console.log(`  Undetermined:    ${totalUndetermined}`);
  console.log(`  Images to delete: ${imagesToDelete.length}`);

  // Write master resolutions file
  await writeFile(RESOLUTIONS_FILE, JSON.stringify(masterResolutions, null, 2), "utf8");
  console.log(`Saved master evidence trail to ${RESOLUTIONS_FILE}`);

  // Update markdown files using line-by-line frontmatter replacement
  let modifiedFilesCount = 0;
  for (const [filePath, updatedArtifacts] of filesToUpdate.entries()) {
    const rawContent = await readFile(filePath, "utf8");
    const fmMatch = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) continue;

    const fm = fmMatch[1];
    const lines = fm.split(/\r?\n/);
    let artStartIndex = -1;
    let artEndIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (/^artifacts:/.test(lines[i])) {
        artStartIndex = i;
        for (let j = i + 1; j < lines.length; j++) {
          if (/^[a-z0-9_]+:/.test(lines[j])) {
            artEndIndex = j;
            break;
          }
        }
        if (artEndIndex === -1) {
          artEndIndex = lines.length;
        }
        break;
      }
    }

    const newArtifactLines = [];
    if (updatedArtifacts.length > 0) {
      newArtifactLines.push("artifacts:");
      for (const art of updatedArtifacts) {
        newArtifactLines.push(`  - title: ${formatYamlString(art.title)}`);
        newArtifactLines.push(`    imageUrl: ${formatYamlString(art.imageUrl)}`);
        newArtifactLines.push(`    sourceUrl: ${formatYamlString(art.sourceUrl)}`);
        newArtifactLines.push(`    provenance: ${formatYamlString(art.provenance)}`);
        if (art.period) {
          newArtifactLines.push(`    period: ${formatYamlString(art.period)}`);
        }
        if (art.description) {
          newArtifactLines.push(`    description: ${formatYamlString(art.description)}`);
        }
        if (art.detail) {
          newArtifactLines.push(`    detail: ${art.detail}`);
        }
      }
    }

    if (artStartIndex !== -1) {
      if (newArtifactLines.length > 0) {
        lines.splice(artStartIndex, artEndIndex - artStartIndex, ...newArtifactLines);
      } else {
        lines.splice(artStartIndex, artEndIndex - artStartIndex);
      }
    } else if (newArtifactLines.length > 0) {
      lines.push(...newArtifactLines);
    }

    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }

    const newFm = lines.join("\n");
    if (newFm !== fm) {
      const prefixLen = fmMatch[0].indexOf(fm);
      const fmStart = fmMatch.index + prefixLen;
      const fmEnd = fmStart + fm.length;
      const newContent = rawContent.slice(0, fmStart) + newFm + rawContent.slice(fmEnd);
      await writeFile(filePath, newContent, "utf8");
      modifiedFilesCount++;
    }
  }

  console.log(`Updated frontmatter in ${modifiedFilesCount} markdown files.`);

  // Delete orphaned images from public/artifacts/
  let deletedCount = 0;
  for (const imgName of imagesToDelete) {
    const imgPath = path.join(ARTIFACTS_DIR, imgName);
    try {
      await unlink(imgPath);
      deletedCount++;
    } catch (err) {
      // ignore if already deleted
    }
  }
  console.log(`Deleted ${deletedCount} unsupported artifact images from public/artifacts/.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
