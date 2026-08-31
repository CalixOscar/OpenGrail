// SPDX-License-Identifier: MIT
// Prints the canonical corpus counts pinned by tests/data-invariants.test.js and
// tests/count-agreement.test.js. Run after `npm run build:graph` when a batch of new
// nodes has landed, then patch the pinned constants to match this output.

import { readFile } from "node:fs/promises";
import { isNodeTemporallyVisible, isLinkTemporallyVisible } from "../src/state/temporalVisibility.ts";
import { OUTPUT_FILE } from "./build-graph.js";

const { nodes, links } = JSON.parse(await readFile(OUTPUT_FILE, "utf8"));
const nodeById = new Map(nodes.map((n) => [n.id, n]));

const visibleAt = (mode) => {
  const ns = nodes.filter((n) => isNodeTemporallyVisible(n, 2026, mode));
  const ids = new Set(ns.map((n) => n.id));
  const ls = links.filter(
    (l) =>
      ids.has(l.source) &&
      ids.has(l.target) &&
      isLinkTemporallyVisible(nodeById.get(l.source), nodeById.get(l.target), 2026, mode),
  );
  return { nodes: ns.length, links: ls.length };
};

const emergent = visibleAt("emergent");
const active = visibleAt("active");
const extinct = emergent.nodes - active.nodes;

console.log(`corpus nodes (data-invariants seenIds.size / nodes.length):  ${nodes.length}`);
console.log(`corpus links (data-invariants links.length):                ${links.length}`);
console.log(`year-2026 emergent nodes:                                   ${emergent.nodes}`);
console.log(`year-2026 emergent links:                                   ${emergent.links}`);
console.log(`year-2026 active nodes  (${emergent.nodes} - ${extinct} extinct):${" ".repeat(Math.max(1, 20 - String(extinct).length))}${active.nodes}`);
console.log(`year-2026 active links:                                     ${active.links}`);
console.log(`extinct count (for the inline comment):                     ${extinct}`);
