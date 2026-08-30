// SPDX-License-Identifier: MIT

import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  generateAttributionsMarkdown,
  getArtifactEntriesFromGraphData,
} from "../scripts/derive-attributions.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const GRAPH_FILE = path.join(PROJECT_ROOT, "public", "graph.json");
const ARTIFACTS_DIR = path.join(PROJECT_ROOT, "public", "artifacts");
const ATTRIBUTIONS_FILE = path.join(PROJECT_ROOT, "ATTRIBUTIONS.md");

const KNOWN_CORRUPT_NON_WEBP_EXCEPTION = "kongo-religion-2.jpg";

test("Artifact Licensing & Dimension Invariants Suite", async (t) => {
  const graphRaw = await readFile(GRAPH_FILE, "utf8");
  const graph = JSON.parse(graphRaw);
  const graphArtifacts = getArtifactEntriesFromGraphData(graph);

  await t.test("Exactly 1,146 artifacts in graph.json with valid metadata and Commons URLs", () => {
    assert.equal(graphArtifacts.length, 1146, "graph.json must contain exactly 1146 artifacts");

    const filenames = new Set();
    const duplicateFilenames = [];

    for (const art of graphArtifacts) {
      if (filenames.has(art.filename)) {
        duplicateFilenames.push(art.filename);
      }
      filenames.add(art.filename);

      assert.ok(
        typeof art.title === "string" && art.title.trim().length > 0,
        `Artifact "${art.filename}" in node "${art.traditionId}" must have a non-empty title`
      );
      assert.ok(
        typeof art.provenance === "string" && art.provenance.trim().length > 0,
        `Artifact "${art.filename}" in node "${art.traditionId}" must have a non-empty provenance`
      );
      assert.ok(
        art.filename && !art.filename.includes("/"),
        `Artifact filename must be valid: "${art.filename}"`
      );
      assert.ok(
        typeof art.sourceUrl === "string" &&
          art.sourceUrl.startsWith("https://commons.wikimedia.org/wiki/File:"),
        `Artifact "${art.filename}" in node "${art.traditionId}" must have a valid Commons File: sourceUrl, got: ${art.sourceUrl}`
      );
    }

    assert.deepEqual(duplicateFilenames, [], "No duplicate filenames should exist across graph artifacts");
  });

  await t.test("public/artifacts/ contains exactly one file per imageUrl with no orphans in either direction", async () => {
    const diskFiles = await readdir(ARTIFACTS_DIR);
    assert.equal(
      diskFiles.length,
      1146,
      `public/artifacts/ must contain exactly 1146 files on disk, found ${diskFiles.length}`
    );

    const graphFilenameSet = new Set(graphArtifacts.map((a) => a.filename));
    const diskFilenameSet = new Set(diskFiles);

    const missingOnDisk = [];
    for (const filename of graphFilenameSet) {
      if (!diskFilenameSet.has(filename)) {
        missingOnDisk.push(filename);
      }
    }
    assert.deepEqual(missingOnDisk, [], "All graph.json imageUrl filenames must exist on disk");

    const orphansOnDisk = [];
    for (const filename of diskFilenameSet) {
      if (!graphFilenameSet.has(filename)) {
        orphansOnDisk.push(filename);
      }
    }
    assert.deepEqual(orphansOnDisk, [], "No orphan files should exist in public/artifacts/");
  });

  await t.test("Every artifact file is .webp, with exactly one named exception: kongo-religion-2.jpg", async () => {
    const diskFiles = await readdir(ARTIFACTS_DIR);
    const nonWebpFiles = diskFiles.filter((f) => !f.endsWith(".webp"));

    assert.equal(
      nonWebpFiles.length,
      1,
      `Expected exactly 1 non-WebP exception, found ${nonWebpFiles.length}: ${JSON.stringify(nonWebpFiles)}`
    );
    assert.equal(
      nonWebpFiles[0],
      KNOWN_CORRUPT_NON_WEBP_EXCEPTION,
      `The only non-WebP exception must be "${KNOWN_CORRUPT_NON_WEBP_EXCEPTION}"`
    );

    const webpFiles = diskFiles.filter((f) => f.endsWith(".webp"));
    assert.equal(webpFiles.length, 1145, "Expected exactly 1145 .webp files on disk");
  });

  await t.test("Decoded dimensions are within tier (max 1600 for detail: high, max 640 for standard)", async () => {
    let highDetailCount = 0;
    let standardDetailCount = 0;
    const dimensionViolations = [];
    const decodeErrors = [];

    for (const art of graphArtifacts) {
      const isHigh = art.detail === "high";
      if (isHigh) {
        highDetailCount++;
      } else {
        standardDetailCount++;
      }

      if (art.filename === KNOWN_CORRUPT_NON_WEBP_EXCEPTION) {
        // Documented known undecodable exception
        continue;
      }

      const filePath = path.join(ARTIFACTS_DIR, art.filename);
      try {
        const meta = await sharp(filePath).metadata();
        assert.equal(meta.format, "webp", `File ${art.filename} must be WebP format`);

        const longEdge = Math.max(meta.width, meta.height);
        const maxAllowed = isHigh ? 1600 : 640;

        if (longEdge > maxAllowed) {
          dimensionViolations.push({
            filename: art.filename,
            isHigh,
            width: meta.width,
            height: meta.height,
            longEdge,
            maxAllowed,
          });
        }
      } catch (err) {
        decodeErrors.push({
          filename: art.filename,
          error: err.message,
        });
      }
    }

    assert.equal(highDetailCount, 102, "Expected exactly 102 high-detail artifacts");
    assert.equal(standardDetailCount, 1044, "Expected exactly 1044 standard-detail artifacts");
    assert.deepEqual(decodeErrors, [], "All 1,145 WebP artifacts must decode without error");
    assert.deepEqual(
      dimensionViolations,
      [],
      "No artifact decoded dimensions should exceed its tier limit"
    );
  });

  await t.test("ATTRIBUTIONS.md matches generateAttributionsMarkdown() exactly and has a row per artifact", async () => {
    const currentAttributions = await readFile(ATTRIBUTIONS_FILE, "utf8");
    const expectedAttributions = generateAttributionsMarkdown(graphArtifacts);

    assert.equal(
      currentAttributions,
      expectedAttributions,
      "ATTRIBUTIONS.md has drifted from public/graph.json. Run `npm run derive:attributions`."
    );

    for (const art of graphArtifacts) {
      const escaped = art.filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const tableRowPattern = new RegExp(`\\|\\s*\`${escaped}\`\\s*\\|`);
      assert.match(
        currentAttributions,
        tableRowPattern,
        `ATTRIBUTIONS.md must contain an attribution table row for ${art.filename}`
      );
    }
  });
});
