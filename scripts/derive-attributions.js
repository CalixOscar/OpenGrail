// SPDX-License-Identifier: MIT

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const GRAPH_FILE = path.join(PROJECT_ROOT, "public", "graph.json");
const ATTRIBUTIONS_FILE = path.join(PROJECT_ROOT, "ATTRIBUTIONS.md");

export function parseProvenance(prov = "") {
  const lastSemi = prov.lastIndexOf(";");
  if (lastSemi === -1) {
    return {
      author: "Wikimedia Commons contributor",
      license: prov.trim() || "Unspecified",
    };
  }
  const author = prov.slice(0, lastSemi).trim();
  const license = prov.slice(lastSemi + 1).trim();
  return {
    author: author || "Wikimedia Commons contributor",
    license: license || "Unspecified",
  };
}

export function getLicenseGroup(lic) {
  if (/^public domain$/i.test(lic)) return "Public Domain";
  if (/^cc0/i.test(lic)) return "Creative Commons Zero (CC0 1.0)";
  if (/^cc by-sa 4\.0/i.test(lic)) return "Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)";
  if (/^cc by-sa 3\.0/i.test(lic)) return "Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)";
  if (/^cc by-sa 2\.5/i.test(lic)) return "Creative Commons Attribution-ShareAlike 2.5 Generic (CC BY-SA 2.5)";
  if (/^cc by-sa 2\.0/i.test(lic)) return "Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)";
  if (/^cc by 4\.0/i.test(lic)) return "Creative Commons Attribution 4.0 International (CC BY 4.0)";
  if (/^cc by 3\.0/i.test(lic)) return "Creative Commons Attribution 3.0 Unported (CC BY 3.0)";
  if (/^cc by 2\.5/i.test(lic)) return "Creative Commons Attribution 2.5 Generic (CC BY 2.5)";
  if (/^cc by 2\.1/i.test(lic)) return "Creative Commons Attribution 2.1 Japan (CC BY 2.1 JP)";
  if (/^cc by 2\.0/i.test(lic)) return "Creative Commons Attribution 2.0 Generic (CC BY 2.0)";
  return "Other Terms";
}

const ORDERED_GROUPS = [
  "Public Domain",
  "Creative Commons Zero (CC0 1.0)",
  "Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)",
  "Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)",
  "Creative Commons Attribution-ShareAlike 2.5 Generic (CC BY-SA 2.5)",
  "Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)",
  "Creative Commons Attribution 4.0 International (CC BY 4.0)",
  "Creative Commons Attribution 3.0 Unported (CC BY 3.0)",
  "Creative Commons Attribution 2.5 Generic (CC BY 2.5)",
  "Creative Commons Attribution 2.1 Japan (CC BY 2.1 JP)",
  "Creative Commons Attribution 2.0 Generic (CC BY 2.0)",
  "Other Terms",
];

function sanitizeTableText(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFileTitle(sourceUrl) {
  return decodeURIComponent(
    sourceUrl.replace(/^https:\/\/commons\.wikimedia\.org\/wiki\//, "").replace(/_/g, " ")
  );
}

export function getArtifactEntriesFromGraphData(graph) {
  const entries = [];
  for (const node of graph.nodes || []) {
    if (!Array.isArray(node.artifacts)) continue;
    for (const artifact of node.artifacts) {
      const filename = path.basename(artifact.imageUrl || artifact.url || "");
      entries.push({
        traditionId: node.id,
        filename,
        title: artifact.title || "",
        provenance: artifact.provenance || "",
        sourceUrl: artifact.sourceUrl || "",
        detail: artifact.detail,
      });
    }
  }
  entries.sort((a, b) => a.filename.localeCompare(b.filename));
  return entries;
}

export function generateAttributionsMarkdown(entries) {
  const groups = {};
  for (const groupName of ORDERED_GROUPS) {
    groups[groupName] = [];
  }

  for (const entry of entries) {
    const { author, license } = parseProvenance(entry.provenance || "");
    const groupName = getLicenseGroup(license);
    groups[groupName] = groups[groupName] || [];
    groups[groupName].push({
      ...entry,
      author,
      license,
    });
  }

  const lines = [
    "# OpenGrail Visual Artifact Attributions",
    "",
    "This document lists individual authorship, license terms, source URLs, and local filenames for all visual artifact photographic reproductions referenced in OpenGrail. It is generated deterministically from `public/graph.json`.",
    "",
    `**Total Artifacts:** ${entries.length}`,
    "",
    "---",
    "",
  ];

  for (const groupName of ORDERED_GROUPS) {
    const items = groups[groupName] || [];
    if (items.length === 0) continue;

    lines.push(`## ${groupName} (${items.length})`);
    lines.push("");
    lines.push("| Local Filename | Title / Subject | Author / Credit | License | Wikimedia Commons Source |");
    lines.push("|---|---|---|---|---|");

    // Sort items deterministically by filename
    items.sort((a, b) => a.filename.localeCompare(b.filename));

    for (const item of items) {
      const fileTitle = extractFileTitle(item.sourceUrl);
      const safeTitle = sanitizeTableText(item.title);
      const safeAuthor = sanitizeTableText(item.author);
      const safeLicense = sanitizeTableText(item.license);
      const sourceLink = `[${sanitizeTableText(fileTitle)}](${item.sourceUrl})`;

      lines.push(
        `| \`${item.filename}\` | ${safeTitle} | ${safeAuthor} | ${safeLicense} | ${sourceLink} |`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function writeAttributionsMarkdown(graphPath = GRAPH_FILE) {
  const graphRaw = await readFile(graphPath, "utf8");
  const graph = JSON.parse(graphRaw);
  const entries = getArtifactEntriesFromGraphData(graph);
  const markdown = generateAttributionsMarkdown(entries);
  await writeFile(ATTRIBUTIONS_FILE, markdown, "utf8");
  console.log(`Generated ${path.relative(PROJECT_ROOT, ATTRIBUTIONS_FILE)} with ${entries.length} artifact records.`);
  return markdown;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeAttributionsMarkdown().catch((err) => {
    console.error("Failed to derive attributions markdown:", err);
    process.exit(1);
  });
}
