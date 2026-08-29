// SPDX-License-Identifier: MIT

import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  CLUSTERS,
  EPISTEMIC_TIER_IDS,
  CANONICAL_RELATION_TYPES,
  EDGE_STYLES,
  parseNodeRecord,
  detectBranchCycles,
  fail,
} from "./schema.js";

export const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
export const DATA_DIR = path.join(PROJECT_ROOT, "data");
export const OUTPUT_FILE = path.join(PROJECT_ROOT, "public", "graph.json");

const CLUSTER_RANK = new Map(
  CLUSTERS.map((cluster, index) => [cluster, index]),
);

function backlinkRef(node, link) {
  const ref = {
    nodeId: node.id,
    title: node.title,
    type: link.type,
    certainty: link.certainty,
    relation_type: link.relation_type,
    relationType: link.relation_type,
    epistemic_tier: link.epistemic_tier,
    epistemicTier: link.epistemic_tier,
    style: link.style,
  };
  return link.citation ? { ...ref, citation: link.citation } : ref;
}

export async function findMarkdownFiles(directory) {
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

export async function parseNode(filePath, projectRoot = PROJECT_ROOT) {
  const source = await readFile(filePath, "utf8");
  const { data, content } = matter(source);
  return parseNodeRecord(data, content, filePath, projectRoot);
}

export async function buildGraphData(dataDir = DATA_DIR, projectRoot = PROJECT_ROOT) {
  const markdownFiles = await findMarkdownFiles(dataDir);
  if (markdownFiles.length === 0) {
    throw new Error(`No Markdown files found below ${dataDir}`);
  }

  const parsed = await Promise.all(markdownFiles.map((f) => parseNode(f, projectRoot)));
  const nodesById = new Map();

  for (const record of parsed) {
    if (nodesById.has(record.node.id)) {
      fail(record.filePath, `duplicate node id "${record.node.id}"`, projectRoot);
    }
    nodesById.set(record.node.id, record.node);
  }

  const linksByKey = new Map();
  for (const { node: sourceNode, relations, filePath } of parsed) {
    for (const relation of relations) {
      if (relation.target === sourceNode.id) {
        fail(filePath, `node "${sourceNode.id}" cannot relate to itself`, projectRoot);
      }
      if (!nodesById.has(relation.target)) {
        fail(filePath, `relation target "${relation.target}" does not exist`, projectRoot);
      }

      if (!CANONICAL_RELATION_TYPES.has(relation.relation_type)) {
        fail(filePath, `invalid relation_type "${relation.relation_type}"`, projectRoot);
      }
      if (!EDGE_STYLES.has(relation.style)) {
        fail(filePath, `invalid edge style "${relation.style}"`, projectRoot);
      }
      if (!EPISTEMIC_TIER_IDS.has(relation.epistemic_tier)) {
        fail(filePath, `invalid epistemic_tier "${relation.epistemic_tier}"`, projectRoot);
      }

      const dedupeKey = `${sourceNode.id}\u0000${relation.target}\u0000${relation.type}`;
      const link = {
        id: `${sourceNode.id}--${relation.type}--${relation.target}`,
        source: sourceNode.id,
        target: relation.target,
        type: relation.type,
        certainty: relation.certainty,
        relation_type: relation.relation_type,
        relationType: relation.relation_type,
        epistemic_tier: relation.epistemic_tier,
        epistemicTier: relation.epistemic_tier,
        style: relation.style,
        ...(relation.citation ? { citation: relation.citation } : {}),
      };

      const existing = linksByKey.get(dedupeKey);
      if (existing) {
        if (
          existing.certainty !== link.certainty ||
          existing.citation !== link.citation ||
          existing.relation_type !== link.relation_type
        ) {
          fail(
            filePath,
            `duplicate relation ${sourceNode.id} -> ${relation.target} (${relation.type}) has conflicting metadata`,
            projectRoot,
          );
        }
        continue;
      }
      linksByKey.set(dedupeKey, link);
    }
  }

  const links = [...linksByKey.values()].sort((a, b) => a.id.localeCompare(b.id));

  // Verify branch cycles
  detectBranchCycles(nodesById, links);

  for (const link of links) {
    const sourceNode = nodesById.get(link.source);
    const targetNode = nodesById.get(link.target);
    sourceNode.backlinks.outbound.push(backlinkRef(targetNode, link));
    targetNode.backlinks.inbound.push(backlinkRef(sourceNode, link));
  }

  const nodes = [...nodesById.values()]
    .map((node) => ({
      ...node,
      backlinks: {
        inbound: node.backlinks.inbound.sort((a, b) =>
          a.title.localeCompare(b.title),
        ),
        outbound: node.backlinks.outbound.sort((a, b) =>
          a.title.localeCompare(b.title),
        ),
      },
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const clusters = [...new Set(nodes.map((node) => node.cluster))].sort((a, b) => {
    const leftRank = CLUSTER_RANK.get(a) ?? Number.POSITIVE_INFINITY;
    const rightRank = CLUSTER_RANK.get(b) ?? Number.POSITIVE_INFINITY;
    return leftRank - rightRank || a.localeCompare(b);
  });

  return { nodes, links, clusters, nodesById, linksByKey };
}

export async function buildGraph(
  dataDir = DATA_DIR,
  outputFile = OUTPUT_FILE,
  projectRoot = PROJECT_ROOT,
) {
  const { nodes, links, clusters } = await buildGraphData(dataDir, projectRoot);

  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(
    outputFile,
    `${JSON.stringify({ nodes, links, clusters }, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Built ${path.relative(projectRoot, outputFile)} from ${nodes.length} nodes across ${clusters.length} clusters (${links.length} links).`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildGraph().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
