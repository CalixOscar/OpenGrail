// SPDX-License-Identifier: MIT

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const GRAPH_FILE = path.join(PROJECT_ROOT, "public", "graph.json");
const ARTIFACTS_DIR = path.join(PROJECT_ROOT, "public", "artifacts");
const MANIFEST_FILE = path.join(PROJECT_ROOT, "data", "artifact-manifest.json");
const UNREPRODUCIBLE_FILE = path.join(PROJECT_ROOT, "docs", "unreproducible-artifacts.txt");

export async function loadVendoredSet() {
  try {
    const raw = await readFile(UNREPRODUCIBLE_FILE, "utf8");
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
    return new Set(lines);
  } catch {
    return new Set();
  }
}

export async function generateArtifactManifest() {
  const graphRaw = await readFile(GRAPH_FILE, "utf8");
  const graph = JSON.parse(graphRaw);
  const vendoredSet = await loadVendoredSet();
  const entries = [];

  for (const node of graph.nodes) {
    if (!node.artifacts || !Array.isArray(node.artifacts)) continue;
    for (const art of node.artifacts) {
      if (!art.imageUrl) continue;
      const filename = art.imageUrl.replace(/^\/artifacts\//, "");
      const filePath = path.join(ARTIFACTS_DIR, filename);
      const fileBuffer = await readFile(filePath);
      const sha256 = createHash("sha256").update(fileBuffer).digest("hex");
      const isVendored = vendoredSet.has(filename);

      entries.push({
        filename,
        source: isVendored ? "vendored" : "fetched",
        sourceUrl: art.sourceUrl,
        sha256,
        size: fileBuffer.length,
        provenance: art.provenance,
        title: art.title,
        traditionId: node.id,
      });
    }
  }

  entries.sort((a, b) => a.filename.localeCompare(b.filename));
  return entries;
}

export async function writeArtifactManifest() {
  const manifest = await generateArtifactManifest();
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(MANIFEST_FILE, serialized, "utf8");
  console.log(`Generated artifact manifest at ${path.relative(PROJECT_ROOT, MANIFEST_FILE)} with ${manifest.length} entries.`);
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeArtifactManifest().catch((err) => {
    console.error("Failed to build artifact manifest:", err);
    process.exit(1);
  });
}
