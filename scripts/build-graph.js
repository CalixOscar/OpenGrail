// SPDX-License-Identifier: MIT

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

const CANONICAL_RELATION_TYPES = new Set([
  "direct_branch",
  "schism",
  "thematic_parallel",
]);

const EDGE_STYLES = new Set(["solid", "dotted"]);

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

function requiredInteger(value, field, filePath) {
  if (value == null || typeof value !== "number" || !Number.isInteger(value)) {
    fail(filePath, `frontmatter field "${field}" must be an integer`);
  }
  return value;
}

function optionalIntegerOrNull(value, field, filePath) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(filePath, `frontmatter field "${field}" must be an integer or null`);
  }
  return value;
}

function requiredGeo(value, filePath) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(filePath, 'frontmatter field "origin_geo" must be an object');
  }
  const lat = value.lat;
  const lng = value.lng;
  const placeName = value.place_name;

  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    fail(filePath, 'frontmatter field "origin_geo.lat" must be a number between -90 and 90');
  }
  if (typeof lng !== "number" || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    fail(filePath, 'frontmatter field "origin_geo.lng" must be a number between -180 and 180');
  }
  if (typeof placeName !== "string" || placeName.trim() === "") {
    fail(filePath, 'frontmatter field "origin_geo.place_name" must be a non-empty string');
  }

  return {
    lat,
    lng,
    place_name: placeName.trim(),
  };
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

function normalizeSources(value, filePath) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    fail(filePath, 'frontmatter field "sources" must be an array when provided');
  }
  return value.map((item, index) => {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (!trimmed) fail(filePath, `sources[${index}] must not be empty`);
      return trimmed;
    }
    if (item && typeof item === 'object') {
      const title = requiredString(item.title, `sources[${index}].title`, filePath);
      const url = optionalString(item.url, `sources[${index}].url`, filePath);
      return { title, ...(url ? { url } : {}) };
    }
    fail(filePath, `sources[${index}] must be a string or object`);
  });
}

function normalizeArtifacts(value, filePath) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    fail(filePath, 'frontmatter field "artifacts" must be an array when provided');
  }
  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      fail(filePath, `artifacts[${index}] must be an object`);
    }
    const title = requiredString(item.title, `artifacts[${index}].title`, filePath);
    const imageUrl = optionalString(item.imageUrl || item.image_url || item.url, `artifacts[${index}].imageUrl`, filePath);
    const sourceUrl = optionalString(item.sourceUrl || item.source_url || item.link, `artifacts[${index}].sourceUrl`, filePath);
    const provenance = optionalString(item.provenance, `artifacts[${index}].provenance`, filePath);
    const period = optionalString(item.period, `artifacts[${index}].period`, filePath);
    const description = optionalString(item.description, `artifacts[${index}].description`, filePath);

    return {
      title,
      ...(imageUrl ? { imageUrl, url: imageUrl } : {}),
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(provenance ? { provenance } : {}),
      ...(period ? { period } : {}),
      ...(description ? { description } : {}),
    };
  });
}

function mapRelationType(legacyType) {
  if (legacyType === "branch_of") {
    return { relation_type: "direct_branch", style: "solid" };
  }
  if (legacyType === "schism" || legacyType === "diverged_from") {
    return { relation_type: "schism", style: "solid" };
  }
  return { relation_type: "thematic_parallel", style: "dotted" };
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

    const mapped = mapRelationType(type);

    return {
      target,
      type,
      certainty,
      relation_type: mapped.relation_type,
      style: mapped.style,
      epistemic_tier: certainty,
      ...(citation ? { citation } : {}),
    };
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
        return entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")
          ? [entryPath]
          : [];
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

  const originYear = requiredInteger(data.origin_year, "origin_year", filePath);
  const originGeo = requiredGeo(data.origin_geo, filePath);
  const extinctYear = optionalIntegerOrNull(data.extinct_year, "extinct_year", filePath);

  const originYearPrecision = optionalString(data.origin_year_precision, "origin_year_precision", filePath);
  const originGeoPrecision = optionalString(data.origin_geo_precision, "origin_geo_precision", filePath);
  const originNote = optionalString(data.origin_note, "origin_note", filePath);

  const keyTenets = optionalStringArray(data.key_tenets || data.keyTenets, "key_tenets", filePath);
  const sources = normalizeSources(data.sources, filePath);
  const artifacts = normalizeArtifacts(data.artifacts, filePath);

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
      key_tenets: keyTenets,
      keyTenets,
      sources,
      artifacts,
      origin_year: originYear,
      originYear,
      origin_geo: originGeo,
      originGeo,
      extinct_year: extinctYear,
      extinctYear,
      ...(originYearPrecision ? { origin_year_precision: originYearPrecision, originYearPrecision } : {}),
      ...(originGeoPrecision ? { origin_geo_precision: originGeoPrecision, originGeoPrecision } : {}),
      ...(originNote ? { origin_note: originNote, originNote } : {}),
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
    relation_type: link.relation_type,
    relationType: link.relation_type,
    epistemic_tier: link.epistemic_tier,
    epistemicTier: link.epistemic_tier,
    style: link.style,
  };
  return link.citation ? { ...ref, citation: link.citation } : ref;
}

function detectBranchCycles(nodesById, links) {
  // Build parent adjacency for direct branch relations
  const branchMap = new Map();
  for (const link of links) {
    if (link.type === "branch_of" || link.relation_type === "direct_branch") {
      // link.source is branch of link.target
      branchMap.set(link.source, link.target);
    }
  }

  for (const startNodeId of branchMap.keys()) {
    const visited = new Set();
    let current = startNodeId;
    while (current && branchMap.has(current)) {
      if (visited.has(current)) {
        throw new Error(`Branch cycle detected involving node "${current}"`);
      }
      visited.add(current);
      current = branchMap.get(current);
    }
  }
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

      if (!CANONICAL_RELATION_TYPES.has(relation.relation_type)) {
        fail(filePath, `invalid relation_type "${relation.relation_type}"`);
      }
      if (!EDGE_STYLES.has(relation.style)) {
        fail(filePath, `invalid edge style "${relation.style}"`);
      }
      if (!EPISTEMIC_TIERS.has(relation.epistemic_tier)) {
        fail(filePath, `invalid epistemic_tier "${relation.epistemic_tier}"`);
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
