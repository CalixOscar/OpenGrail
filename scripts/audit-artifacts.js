/*
 * SPDX-License-Identifier: MIT
 *
 * Offline integrity audit for the curated artifact library.
 */

import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import matter from "gray-matter";

const ROOT = path.resolve(".");
const ARTIFACT_DIR = path.join(ROOT, "public", "artifacts");
const SELECTION_PATH = path.join(ROOT, "scripts", "artifact-curation", "selected.json");
const execFile = promisify(execFileCallback);

const REQUIRED_FIELDS = ["title", "imageUrl", "sourceUrl", "provenance", "period", "description"];
const GENERIC_PATTERNS = [
  /historical sanctuary & iconography/i,
  /& sacred relics$/i,
  /authoritative historical artifact, sanctuary site/i,
  /preserved liturgical manuscripts, canonical texts/i,
  /circa circa/i,
];

function detectMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  return "unknown";
}

async function trackedMarkdownFiles() {
  const { stdout } = await execFile("git", ["ls-files", "-z", "data/**/*.md"], { cwd: ROOT, encoding: "buffer" });
  return stdout.toString("utf8").split("\0").filter(Boolean).sort();
}

function fail(errors, message) {
  errors.push(message);
}

async function main() {
  const errors = [];
  const files = await trackedMarkdownFiles();
  const selection = JSON.parse(await readFile(SELECTION_PATH, "utf8"));
  const refs = new Set();
  const ids = new Set();
  const hashes = new Map();

  for (const relativePath of files) {
    const parsed = matter(await readFile(path.join(ROOT, relativePath), "utf8"));
    const id = parsed.data.id;
    if (!id || ids.has(id)) fail(errors, `${relativePath}: missing or duplicate id ${id}`);
    ids.add(id);
    const artifacts = parsed.data.artifacts;
    if (!Array.isArray(artifacts) || artifacts.length !== 2) {
      fail(errors, `${relativePath}: expected exactly two artifacts`);
      continue;
    }

    const selected = selection.items?.[id];
    if (!Array.isArray(selected) || selected.length !== 2) {
      fail(errors, `${relativePath}: missing exact-source manifest entries`);
      continue;
    }

    for (let index = 0; index < 2; index += 1) {
      const artifact = artifacts[index];
      for (const field of REQUIRED_FIELDS) {
        if (typeof artifact?.[field] !== "string" || !artifact[field].trim()) {
          fail(errors, `${relativePath}: artifacts[${index}].${field} is missing`);
        }
      }
      const values = REQUIRED_FIELDS.map((field) => artifact?.[field] ?? "").join(" ");
      if (GENERIC_PATTERNS.some((pattern) => pattern.test(values))) {
        fail(errors, `${relativePath}: artifacts[${index}] contains legacy boilerplate`);
      }

      const match = artifact?.imageUrl?.match(new RegExp(`^/artifacts/(${id}-${index + 1}\\.(jpg|png))$`));
      if (!match) {
        fail(errors, `${relativePath}: artifacts[${index}] violates canonical naming`);
        continue;
      }
      const fileName = match[1];
      refs.add(fileName);
      const selectedItem = selected[index];
      if (selectedItem.outputFile !== fileName || selectedItem.sourceUrl !== artifact.sourceUrl) {
        fail(errors, `${relativePath}: artifacts[${index}] diverges from selected manifest`);
      }
      if (!artifact.sourceUrl.startsWith("https://commons.wikimedia.org/wiki/File:")) {
        fail(errors, `${relativePath}: artifacts[${index}] lacks an exact Commons File page`);
      }
      if (!/public domain|cc0|creative commons|cc by/i.test(selectedItem.license ?? "")) {
        fail(errors, `${relativePath}: artifacts[${index}] has unapproved license ${selectedItem.license}`);
      }
      if (Math.max(selectedItem.sourceWidth ?? 0, selectedItem.sourceHeight ?? 0) < 520) {
        fail(errors, `${relativePath}: artifacts[${index}] source resolution is too small`);
      }

      try {
        const buffer = await readFile(path.join(ARTIFACT_DIR, fileName));
        const mime = detectMime(buffer);
        const expectedMime = match[2] === "jpg" ? "image/jpeg" : "image/png";
        if (mime !== expectedMime || mime !== selectedItem.mime) {
          fail(errors, `${relativePath}: artifacts[${index}] MIME mismatch (${mime})`);
        }
        if (buffer.length < 8_000) fail(errors, `${relativePath}: artifacts[${index}] is under 8 KB`);
        const sha256 = createHash("sha256").update(buffer).digest("hex");
        const prior = hashes.get(sha256) ?? [];
        prior.push(fileName);
        hashes.set(sha256, prior);
      } catch (error) {
        fail(errors, `${relativePath}: artifacts[${index}] file cannot be read (${error.message})`);
      }
    }

    if (selected[0]?.commonsFileTitle === selected[1]?.commonsFileTitle) {
      fail(errors, `${relativePath}: both slots use the same Commons file`);
    }
  }

  const diskFiles = (await readdir(ARTIFACT_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  const extras = diskFiles.filter((fileName) => !refs.has(fileName));
  const missing = [...refs].filter((fileName) => !diskFiles.includes(fileName));
  if (extras.length) fail(errors, `Unreferenced artifact files: ${extras.join(", ")}`);
  if (missing.length) fail(errors, `Missing artifact files: ${missing.join(", ")}`);

  if (files.length !== 573) fail(errors, `Expected 573 tracked traditions, found ${files.length}`);
  if (refs.size !== files.length * 2) fail(errors, `Expected ${files.length * 2} unique references, found ${refs.size}`);
  if (diskFiles.length !== files.length * 2) fail(errors, `Expected ${files.length * 2} disk files, found ${diskFiles.length}`);
  if (Object.keys(selection.items ?? {}).length !== files.length) {
    fail(errors, `Selected manifest covers ${Object.keys(selection.items ?? {}).length}/${files.length} traditions`);
  }

  if (errors.length) {
    console.error(`Artifact audit failed with ${errors.length} error(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  const duplicateGroups = [...hashes.values()].filter((group) => group.length > 1);
  console.log(`Artifact audit passed: ${files.length} traditions, ${refs.size} exact-source images, ${diskFiles.length} canonical files.`);
  console.log(`Global duplicate hash groups (allowed across related traditions): ${duplicateGroups.length}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
