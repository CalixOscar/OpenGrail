import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "public", "graph.json");

const EPISTEMIC_TIERS = new Set([
  "academic_consensus",
  "minority_scholarly",
  "theological_claim",
  "speculative_fringe",
]);

const RELATION_TYPES = new Set([
  "branch_of",
  "diverged_from",
  "influenced_by",
  "syncretized_with",
  "parallel_concept",
  "fringe_reinterpretation",
  "schism",
]);

const CLUSTER_ORDER = [
  "Abrahamic",
  "Dharmic",
  "East Asian",
  "Indigenous & Diasporic",
  "Iranian",
  "Ancient Near East",
  "Ancient Mediterranean",
  "Ancient European",
  "Esoteric & Modern",
  "Speculative",
];

const CLUSTER_RANK = new Map(
  CLUSTER_ORDER.map((cluster, index) => [cluster, index]),
);

function fail(filePath, message) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  throw new Error(`${relativePath}: ${message}`);
}

function requiredString(value, field, filePath) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(filePath, `frontmatter field "${field}" must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value, field, filePath) {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") {
    fail(filePath, `frontmatter field "${field}" must be a string when provided`);
  }
  return value.trim();
}

function optionalNumber(value, field, filePath, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(filePath, `frontmatter field "${field}" must be a finite number when provided`);
  }
  if (value < 0.75 || value > 3) {
    fail(filePath, `frontmatter field "${field}" must be between 0.75 and 3`);
  }
  return value;
}

function stringArray(value, field, filePath) {
  if (!Array.isArray(value) || value.length === 0) {
    fail(filePath, `frontmatter field "${field}" must be a non-empty string array`);
  }

  return value.map((item, index) =>
    requiredString(item, `${field}[${index}]`, filePath),
  );
}

function optionalStringArray(value, field, filePath) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    fail(filePath, `frontmatter field "${field}" must be a string array when provided`);
  }
  return [...new Set(value.map((item, index) =>
    requiredString(item, `${field}[${index}]`, filePath),
  ))];
}

function normalizeRelations(value, filePath) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    fail(filePath, 'frontmatter field "relations" must be an array');
  }

  return value.map((relation, index) => {
    if (!relation || typeof relation !== "object" || Array.isArray(relation)) {
      fail(filePath, `relations[${index}] must be an object`);
    }

    const target = requiredString(
      relation.target,
      `relations[${index}].target`,
      filePath,
    );
    const type = requiredString(
      relation.type,
      `relations[${index}].type`,
      filePath,
    );
    const certainty = requiredString(
      relation.certainty,
      `relations[${index}].certainty`,
      filePath,
    );

    if (!RELATION_TYPES.has(type)) {
      fail(
        filePath,
        `relations[${index}].type "${type}" is not one of ${[
          ...RELATION_TYPES,
        ].join(", ")}`,
      );
    }
    if (!EPISTEMIC_TIERS.has(certainty)) {
      fail(
        filePath,
        `relations[${index}].certainty "${certainty}" is not one of ${[
          ...EPISTEMIC_TIERS,
        ].join(", ")}`,
      );
    }

    const citation = optionalString(
      relation.citation,
      `relations[${index}].citation`,
      filePath,
    );

    return citation ? { target, type, certainty, citation } : { target, type, certainty };
  });
}

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return findMarkdownFiles(entryPath);
        return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
      }),
  );
  return nestedFiles.flat();
}

async function parseNode(filePath) {
  const source = await readFile(filePath, "utf8");
  const { data, content } = matter(source);
  const id = requiredString(data.id, "id", filePath);
  const epistemicTier = requiredString(
    data.epistemic_tier,
    "epistemic_tier",
    filePath,
  );

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    fail(filePath, `id "${id}" must be lowercase kebab-case`);
  }
  if (!EPISTEMIC_TIERS.has(epistemicTier)) {
    fail(
      filePath,
      `epistemic_tier "${epistemicTier}" is not one of ${[
        ...EPISTEMIC_TIERS,
      ].join(", ")}`,
    );
  }

  const color = requiredString(data.color, "color", filePath).toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(color)) {
    fail(filePath, `color "${color}" must be a six-digit hexadecimal color`);
  }

  const body = content.trim();
  if (!body) fail(filePath, "Markdown body must not be empty");

  return {
    node: {
      id,
      title: requiredString(data.title, "title", filePath),
      cluster: requiredString(data.cluster, "cluster", filePath),
      color,
      displayWeight: optionalNumber(data.display_weight, "display_weight", filePath, 1),
      eraStart: requiredString(data.era_start, "era_start", filePath),
      epistemicTier,
      summary: requiredString(data.summary, "summary", filePath),
      aliases: optionalStringArray(data.aliases, "aliases", filePath),
      canonicalTexts: stringArray(data.canonical_texts, "canonical_texts", filePath),
      content: body,
      sourcePath: path.relative(PROJECT_ROOT, filePath).split(path.sep).join("/"),
      backlinks: { inbound: [], outbound: [] },
    },
    relations: normalizeRelations(data.relations, filePath),
    filePath,
  };
}

function backlinkRef(node, link) {
  const ref = {
    nodeId: node.id,
    title: node.title,
    type: link.type,
    certainty: link.certainty,
  };
  return link.citation ? { ...ref, citation: link.citation } : ref;
}

async function buildGraph() {
  const markdownFiles = await findMarkdownFiles(DATA_DIR);
  if (markdownFiles.length === 0) {
    throw new Error(`No Markdown files found below ${DATA_DIR}`);
  }

  const parsed = await Promise.all(markdownFiles.map(parseNode));
  const nodesById = new Map();

  for (const record of parsed) {
    if (nodesById.has(record.node.id)) {
      fail(record.filePath, `duplicate node id "${record.node.id}"`);
    }
    nodesById.set(record.node.id, record.node);
  }

  const linksByKey = new Map();
  for (const { node: sourceNode, relations, filePath } of parsed) {
    for (const relation of relations) {
      if (relation.target === sourceNode.id) {
        fail(filePath, `node "${sourceNode.id}" cannot relate to itself`);
      }
      if (!nodesById.has(relation.target)) {
        fail(filePath, `relation target "${relation.target}" does not exist`);
      }

      const dedupeKey = `${sourceNode.id}\u0000${relation.target}\u0000${relation.type}`;
      const link = {
        id: `${sourceNode.id}--${relation.type}--${relation.target}`,
        source: sourceNode.id,
        target: relation.target,
        type: relation.type,
        certainty: relation.certainty,
        ...(relation.citation ? { citation: relation.citation } : {}),
      };

      const existing = linksByKey.get(dedupeKey);
      if (existing) {
        if (
          existing.certainty !== link.certainty ||
          existing.citation !== link.citation
        ) {
          fail(
            filePath,
            `duplicate relation ${sourceNode.id} -> ${relation.target} (${relation.type}) has conflicting metadata`,
          );
        }
        continue;
      }
      linksByKey.set(dedupeKey, link);
    }
  }

  const links = [...linksByKey.values()].sort((a, b) => a.id.localeCompare(b.id));
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

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify({ nodes, links, clusters }, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Built ${path.relative(PROJECT_ROOT, OUTPUT_FILE)} from ${nodes.length} nodes across ${clusters.length} clusters (${links.length} links).`,
  );
}

buildGraph().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
