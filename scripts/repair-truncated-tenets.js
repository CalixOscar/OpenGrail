// SPDX-License-Identifier: MIT

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return findMarkdownFiles(entryPath);
        return entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")
          ? [entryPath]
          : [];
      }),
  );
  return nestedFiles.flat();
}

/**
 * Finds the next sentence boundary at or after fromIndex in paragraph.
 * Returns the substring from start of paragraph up to and including the terminal punctuation.
 */
export function findSentenceBoundary(paragraph, fromIndex) {
  const rest = paragraph.slice(fromIndex);
  // Match terminal punctuation [.?!] optionally followed by closing quote/bracket,
  // followed by whitespace and an uppercase letter/quote/open-paren OR end of string.
  const regex = /([.?!]["'’”)]?)(?:\s+[A-Z"'‘“(\[]|$)/g;
  let match;
  while ((match = regex.exec(rest)) !== null) {
    const candidateEnd = fromIndex + match.index + match[1].length;
    const candidateText = paragraph.slice(0, candidateEnd);
    // Check if the preceding token looks like an abbreviation (e.g., "c.", "ca.", "e.g.", "St.")
    if (/\b(?:e\.g|i\.e|c|ca|cf|vs|v|st|dr|mr|mrs|ms|prof)\.$/i.test(candidateText.replace(/["'’”)]$/, ""))) {
      continue;
    }
    return candidateText.trim();
  }
  // If no terminal punctuation followed by space+cap, look for any terminal punctuation before end
  const terminalMatch = /([.?!]["'’”)]?)\s*$/.exec(paragraph);
  if (terminalMatch) {
    return paragraph.trim();
  }
  return paragraph.trim();
}

/**
 * Formats a string as a YAML folded block scalar (>-) indented by 4 spaces.
 */
export function formatFoldedTenet(tenetText, indent = "    ", maxLen = 80) {
  const words = tenetText.split(/\s+/);
  const lines = [];
  let currentLine = "";
  for (const word of words) {
    if (!currentLine) {
      currentLine = indent + word;
    } else if (currentLine.length + 1 + word.length <= maxLen) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = indent + word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return `  - >-\n${lines.join("\n")}`;
}

export async function repairFile(filePath, dryRun = false) {
  const rawContent = await readFile(filePath, "utf8");
  const parsed = matter(rawContent);
  const { data, content: body } = parsed;

  if (!data.key_tenets || !Array.isArray(data.key_tenets)) {
    return { modified: false, repairedCount: 0, unmatched: [] };
  }

  // Check if any tenet is truncated
  const truncatedIndices = [];
  data.key_tenets.forEach((tenet, idx) => {
    if (typeof tenet === "string" && /(\.\.\.|…)\s*$/.test(tenet)) {
      truncatedIndices.push(idx);
    }
  });

  if (truncatedIndices.length === 0) {
    return { modified: false, repairedCount: 0, unmatched: [] };
  }

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#"));

  const newKeyTenets = [...data.key_tenets];
  const unmatched = [];
  let repairedCount = 0;

  for (const idx of truncatedIndices) {
    const originalTenet = data.key_tenets[idx];
    const prefixMatch = originalTenet.match(/^(Foundational Doctrine|Distinctive Practice|Core Orientation):\s*/);
    const label = prefixMatch ? prefixMatch[0] : "";
    const rawFragment = originalTenet.slice(label.length).replace(/(\.\.\.|…)\s*$/, "").trim();
    const normFragment = rawFragment.replace(/\s+/g, " ");

    let matchedParagraph = null;
    for (const p of paragraphs) {
      const normP = p.replace(/\s+/g, " ");
      if (normP.startsWith(normFragment)) {
        matchedParagraph = normP;
        break;
      }
    }

    if (!matchedParagraph) {
      unmatched.push({ tenet: originalTenet, fragment: normFragment });
      continue;
    }

    const extendedBody = findSentenceBoundary(matchedParagraph, normFragment.length);
    const repairedTenet = `${label}${extendedBody}`;
    newKeyTenets[idx] = repairedTenet;
    repairedCount++;
  }

  if (repairedCount === 0) {
    return { modified: false, repairedCount: 0, unmatched };
  }

  // Rewrite key_tenets block in rawContent preserving rest of file
  // Match key_tenets: in frontmatter
  const fmMatch = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    throw new Error(`Could not find frontmatter in ${filePath}`);
  }
  const fm = fmMatch[1];
  const ktRegex = /^key_tenets:\r?\n((?:(?: {2,}|\t)[^\r\n]*\r?\n)*)/m;
  const ktMatch = fm.match(ktRegex);
  if (!ktMatch) {
    throw new Error(`Could not find key_tenets block in frontmatter of ${filePath}`);
  }

  // Format all newKeyTenets as folded scalars
  const formattedItems = newKeyTenets.map((t) => formatFoldedTenet(t));
  const replacementKt = `key_tenets:\n${formattedItems.join("\n")}\n`;

  const newFm = fm.replace(ktRegex, replacementKt);
  const newContent = rawContent.replace(fm, newFm);

  if (!dryRun) {
    await writeFile(filePath, newContent, "utf8");
  }

  return { modified: true, repairedCount, unmatched };
}

export async function run(dryRun = false) {
  const files = await findMarkdownFiles(DATA_DIR);
  let totalRepaired = 0;
  let totalFilesModified = 0;
  const allUnmatched = [];

  for (const file of files) {
    const result = await repairFile(file, dryRun);
    if (result.modified) {
      totalFilesModified++;
      totalRepaired += result.repairedCount;
    }
    if (result.unmatched.length > 0) {
      allUnmatched.push({ file, unmatched: result.unmatched });
    }
  }

  console.log(`Phase A Repair Summary:`);
  console.log(`  Files checked: ${files.length}`);
  console.log(`  Files modified: ${totalFilesModified}`);
  console.log(`  Tenets repaired: ${totalRepaired}`);
  console.log(`  Unmatched tenets: ${allUnmatched.length}`);

  if (allUnmatched.length > 0) {
    console.error(`Unmatched details:`, JSON.stringify(allUnmatched, null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dryRun = process.argv.includes("--dry-run");
  run(dryRun);
}
