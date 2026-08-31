// SPDX-License-Identifier: MIT
// Prints the artifact counts pinned by tests/artifact-licensing.test.js. Run after an
// artifact batch lands, then patch the pinned constants to match this output.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getArtifactEntriesFromGraphData } from "./derive-attributions.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const graph = JSON.parse(await readFile(path.join(ROOT, "public", "graph.json"), "utf8"));
const arts = getArtifactEntriesFromGraphData(graph);
const disk = await readdir(path.join(ROOT, "public", "artifacts"));

const high = arts.filter((a) => a.detail === "high").length;
const nonWebp = disk.filter((f) => !f.endsWith(".webp"));
const inGraph = new Set(arts.map((a) => a.filename));
const onDisk = new Set(disk);
const orphans = disk.filter((f) => !inGraph.has(f));
const missing = [...inGraph].filter((f) => !onDisk.has(f));

console.log(`artifacts in graph.json:      ${arts.length}`);
console.log(`files on disk:                ${disk.length}`);
console.log(`.webp files on disk:          ${disk.length - nonWebp.length}`);
console.log(`detail: high:                 ${high}`);
console.log(`standard detail:              ${arts.length - high}`);
console.log(`--`);
console.log(`orphans on disk (must be 0):  ${orphans.length}${orphans.length ? " -> " + orphans.slice(0, 5).join(", ") : ""}`);
console.log(`missing on disk (must be 0):  ${missing.length}${missing.length ? " -> " + missing.slice(0, 5).join(", ") : ""}`);
console.log(`non-webp files (must be 0):   ${nonWebp.length}${nonWebp.length ? " -> " + nonWebp.slice(0, 5).join(", ") : ""}`);
