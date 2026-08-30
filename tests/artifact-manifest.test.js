// SPDX-License-Identifier: MIT

import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAttributionsMarkdown } from "../scripts/derive-attributions.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const GRAPH_FILE = path.join(PROJECT_ROOT, "public", "graph.json");
const MANIFEST_FILE = path.join(PROJECT_ROOT, "data", "artifact-manifest.json");
const ARTIFACTS_DIR = path.join(PROJECT_ROOT, "public", "artifacts");
const ATTRIBUTIONS_FILE = path.join(PROJECT_ROOT, "ATTRIBUTIONS.md");
const UNREPRODUCIBLE_FILE = path.join(PROJECT_ROOT, "docs", "unreproducible-artifacts.txt");

test("Artifact Manifest & Licensing Invariants Suite", async (t) => {
  const graphRaw = await readFile(GRAPH_FILE, "utf8");
  const graph = JSON.parse(graphRaw);

  const manifestRaw = await readFile(MANIFEST_FILE, "utf8");
  const manifest = JSON.parse(manifestRaw);

  const graphArtifacts = [];
  for (const node of graph.nodes) {
    if (node.artifacts && Array.isArray(node.artifacts)) {
      for (const art of node.artifacts) {
        if (art.imageUrl) {
          graphArtifacts.push({
            nodeId: node.id,
            filename: art.imageUrl.replace(/^\/artifacts\//, ""),
            sourceUrl: art.sourceUrl,
            provenance: art.provenance,
            title: art.title,
          });
        }
      }
    }
  }

  await t.test("Every artifact in graph.json has a manifest entry, and vice versa", () => {
    assert.equal(graphArtifacts.length, 1146, "graph.json must contain exactly 1146 artifacts");
    assert.equal(manifest.length, 1146, "artifact-manifest.json must contain exactly 1146 entries");

    const manifestMap = new Map();
    const duplicateFilenames = [];
    for (const entry of manifest) {
      if (manifestMap.has(entry.filename)) {
        duplicateFilenames.push(entry.filename);
      }
      manifestMap.set(entry.filename, entry);
    }
    assert.deepEqual(duplicateFilenames, [], "No duplicate filenames should exist in artifact manifest");

    const missingInManifest = [];
    for (const art of graphArtifacts) {
      if (!manifestMap.has(art.filename)) {
        missingInManifest.push(art.filename);
      }
    }
    assert.deepEqual(missingInManifest, [], "All graph.json artifacts must exist in manifest");

    const graphFilenameSet = new Set(graphArtifacts.map((a) => a.filename));
    const missingInGraph = [];
    for (const entry of manifest) {
      if (!graphFilenameSet.has(entry.filename)) {
        missingInGraph.push(entry.filename);
      }
    }
    assert.deepEqual(missingInGraph, [], "All manifest entries must exist in graph.json");
  });

  await t.test("Every manifest entry has a non-empty sha256, size, sourceUrl, provenance, and valid source", () => {
    const sha256Regex = /^[a-f0-9]{64}$/;
    for (const entry of manifest) {
      assert.ok(
        entry.filename && entry.filename.length > 0,
        `Manifest entry missing filename: ${JSON.stringify(entry)}`
      );
      assert.match(
        entry.filename,
        /\.(?:jpg|png)$/i,
        `Manifest entry "${entry.filename}" must be a .jpg or .png file`
      );
      assert.ok(
        entry.source === "vendored" || entry.source === "fetched",
        `Manifest entry "${entry.filename}" must have source "vendored" or "fetched", got: ${entry.source}`
      );
      assert.ok(
        typeof entry.size === "number" && entry.size > 0,
        `Manifest entry "${entry.filename}" must have a positive size in bytes`
      );
      assert.match(
        entry.sha256,
        sha256Regex,
        `Manifest entry "${entry.filename}" must have a valid 64-char lowercase sha256 hash`
      );
      assert.ok(
        typeof entry.sourceUrl === "string" &&
          entry.sourceUrl.startsWith("https://commons.wikimedia.org/wiki/File:"),
        `Manifest entry "${entry.filename}" must have a valid Wikimedia Commons File URL: ${entry.sourceUrl}`
      );
      assert.ok(
        typeof entry.provenance === "string" && entry.provenance.trim().length > 0,
        `Manifest entry "${entry.filename}" must have a non-empty provenance string`
      );
      assert.ok(
        typeof entry.title === "string" && entry.title.trim().length > 0,
        `Manifest entry "${entry.filename}" must have a non-empty title string`
      );
      assert.ok(
        typeof entry.traditionId === "string" && entry.traditionId.trim().length > 0,
        `Manifest entry "${entry.filename}" must have a non-empty traditionId string`
      );
    }
  });

  await t.test("Manifest source classification has exactly 121 vendored and 1,025 fetched entries matching unreproducible list", async () => {
    const unreproducibleRaw = await readFile(UNREPRODUCIBLE_FILE, "utf8");
    const unreproducibleList = unreproducibleRaw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));

    assert.equal(unreproducibleList.length, 121, "docs/unreproducible-artifacts.txt must contain exactly 121 filenames");

    const manifestMap = new Map(manifest.map((e) => [e.filename, e]));
    const vendoredEntries = manifest.filter((e) => e.source === "vendored");
    const fetchedEntries = manifest.filter((e) => e.source === "fetched");

    assert.equal(vendoredEntries.length, 121, "Manifest must contain exactly 121 vendored entries");
    assert.equal(fetchedEntries.length, 1025, "Manifest must contain exactly 1025 fetched entries");
    assert.equal(manifest.length, 1146, "Manifest total must be exactly 1146 entries");

    for (const filename of unreproducibleList) {
      const entry = manifestMap.get(filename);
      assert.ok(entry, `Unreproducible file "${filename}" missing from manifest`);
      assert.equal(entry.source, "vendored", `File "${filename}" in unreproducible list must have source "vendored"`);
    }

    const unreproducibleSet = new Set(unreproducibleList);
    for (const entry of manifest) {
      if (entry.source === "vendored") {
        assert.ok(
          unreproducibleSet.has(entry.filename),
          `Manifest entry "${entry.filename}" is marked vendored but not present in docs/unreproducible-artifacts.txt`
        );
      } else {
        assert.equal(entry.source, "fetched", `Manifest entry "${entry.filename}" must be fetched`);
        assert.ok(
          !unreproducibleSet.has(entry.filename),
          `Manifest entry "${entry.filename}" is marked fetched but present in docs/unreproducible-artifacts.txt`
        );
      }
    }
  });

  await t.test("Every vendored file exists on disk and matches its recorded sha256 and size", async () => {
    const vendoredEntries = manifest.filter((e) => e.source === "vendored");
    assert.equal(vendoredEntries.length, 121, "Must verify exactly 121 vendored files");

    for (const entry of vendoredEntries) {
      const filePath = path.join(ARTIFACTS_DIR, entry.filename);
      const fileBuffer = await readFile(filePath);
      assert.equal(
        fileBuffer.length,
        entry.size,
        `Vendored file size mismatch for ${entry.filename}: expected ${entry.size}, got ${fileBuffer.length}`
      );

      const actualSha256 = createHash("sha256").update(fileBuffer).digest("hex");
      assert.equal(
        actualSha256,
        entry.sha256,
        `Vendored file checksum mismatch for ${entry.filename}: expected ${entry.sha256}, got ${actualSha256}`
      );
    }
  });

  await t.test(".gitignore rules correctly ignore fetched artifacts and retain all vendored artifacts", () => {
    const vendoredEntries = manifest.filter((e) => e.source === "vendored");
    const fetchedEntries = manifest.filter((e) => e.source === "fetched");

    const sampleFetched = [
      fetchedEntries[0].filename,
      fetchedEntries[Math.floor(fetchedEntries.length / 2)].filename,
      fetchedEntries[fetchedEntries.length - 1].filename,
    ];

    for (const filename of sampleFetched) {
      const targetPath = `public/artifacts/${filename}`;
      let isIgnored = false;
      try {
        const out = execFileSync("git", ["check-ignore", "--no-index", targetPath], {
          cwd: PROJECT_ROOT,
          encoding: "utf8",
        });
        isIgnored = out.trim().length > 0;
      } catch {
        isIgnored = false;
      }
      assert.ok(isIgnored, `Fetched artifact "${targetPath}" must be ignored by .gitignore`);
    }

    for (const entry of vendoredEntries) {
      const targetPath = `public/artifacts/${entry.filename}`;
      let isIgnored = false;
      try {
        const out = execFileSync("git", ["check-ignore", "--no-index", targetPath], {
          cwd: PROJECT_ROOT,
          encoding: "utf8",
        });
        isIgnored = out.trim().length > 0;
      } catch {
        isIgnored = false;
      }
      assert.equal(
        isIgnored,
        false,
        `Vendored artifact "${targetPath}" must NOT be ignored by .gitignore (must be re-included via ! pattern)`
      );
    }
  });

  await t.test("ATTRIBUTIONS.md has a row for every manifest entry and matches generator without drift", async () => {
    const currentAttributions = await readFile(ATTRIBUTIONS_FILE, "utf8");
    const expectedAttributions = generateAttributionsMarkdown(manifest);

    assert.equal(
      currentAttributions,
      expectedAttributions,
      "ATTRIBUTIONS.md has drifted from data/artifact-manifest.json. Run `npm run derive:attributions`."
    );

    for (const entry of manifest) {
      const tableRowPattern = new RegExp(`\\|\\s*\`${entry.filename}\`\\s*\\|`);
      assert.match(
        currentAttributions,
        tableRowPattern,
        `ATTRIBUTIONS.md must contain an attribution table row for ${entry.filename}`
      );
    }
  });

  await t.test("Every local file under public/artifacts/ matches its manifest checksum and size", async () => {
    const diskFiles = await readdir(ARTIFACTS_DIR);
    assert.equal(
      diskFiles.length,
      1146,
      `public/artifacts/ directory must contain exactly 1146 files on disk, found ${diskFiles.length}`
    );

    const manifestMap = new Map(manifest.map((e) => [e.filename, e]));

    for (const filename of diskFiles) {
      const expected = manifestMap.get(filename);
      assert.ok(expected, `Untracked / unexpected file on disk: ${filename}`);

      const filePath = path.join(ARTIFACTS_DIR, filename);
      const fileBuffer = await readFile(filePath);
      assert.equal(
        fileBuffer.length,
        expected.size,
        `File size mismatch for ${filename}: expected ${expected.size}, got ${fileBuffer.length}`
      );

      const actualSha256 = createHash("sha256").update(fileBuffer).digest("hex");
      assert.equal(
        actualSha256,
        expected.sha256,
        `Checksum mismatch for ${filename}: expected ${expected.sha256}, got ${actualSha256}`
      );
    }
  });
});
