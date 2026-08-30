// SPDX-License-Identifier: MIT

import path from "node:path";

/**
 * OpenGrail Tradition Schema
 * Single machine-readable source of truth for node frontmatter, relations,
 * epistemic confidence tiers, recognized clusters, and artifact derivation.
 */

export const CLUSTERS = [
  "Abrahamic",
  "Dharmic",
  "East Asian",
  "Indigenous & Diasporic",
  "Iranian",
  "Ancient Near East",
  "Ancient Mediterranean",
  "Ancient European",
  "Esoteric & Modern",
  "Philosophical & Ethical Systems",
  "Speculative",
];

export const ARTIFACT_DETAIL_TIERS = ["high"];
export const ARTIFACT_DETAIL_TIER_IDS = new Set(ARTIFACT_DETAIL_TIERS);

export const EPISTEMIC_TIERS = [
  {
    id: "academic_consensus",
    label: "Academic consensus",
    shortLabel: "Consensus",
    color: "#45d6a7",
    description: "Broadly supported by the current academic literature.",
  },
  {
    id: "minority_scholarly",
    label: "Minority scholarly",
    shortLabel: "Minority",
    color: "#f4c763",
    description: "A documented scholarly position without broad consensus.",
  },
  {
    id: "theological_claim",
    label: "Theological claim",
    shortLabel: "Theological",
    color: "#b58cff",
    description: "A confessional or tradition-internal theological claim.",
  },
  {
    id: "speculative_fringe",
    label: "Speculative / fringe",
    shortLabel: "Speculative",
    color: "#ff668c",
    description: "A highly speculative claim outside mainstream scholarship.",
  },
];

export const EPISTEMIC_TIER_IDS = new Set(EPISTEMIC_TIERS.map((t) => t.id));

export const RELATION_TYPES = [
  {
    id: "branch_of",
    label: "Branch of",
    color: "#7dd3fc",
    description: "A denomination, school, sect, or regional branch within a broader tradition.",
    canonicalType: "direct_branch",
    style: "solid",
  },
  {
    id: "diverged_from",
    label: "Diverged from",
    color: "#61a8ff",
    description: "A historical lineage split or development.",
    canonicalType: "schism",
    style: "solid",
  },
  {
    id: "influenced_by",
    label: "Influenced by",
    color: "#f2c45e",
    description: "An evidenced directional influence.",
    canonicalType: "thematic_parallel",
    style: "dotted",
  },
  {
    id: "syncretized_with",
    label: "Syncretized with",
    color: "#66ddb1",
    description: "Traditions or practices blended through contact.",
    canonicalType: "thematic_parallel",
    style: "dotted",
  },
  {
    id: "parallel_concept",
    label: "Parallel concept",
    color: "#a88bff",
    description: "A useful conceptual parallel without asserting lineage.",
    canonicalType: "thematic_parallel",
    style: "dotted",
  },
  {
    id: "fringe_reinterpretation",
    label: "Fringe reinterpretation",
    color: "#ff668c",
    description: "A speculative reinterpretation of another tradition.",
    canonicalType: "thematic_parallel",
    style: "dotted",
  },
  {
    id: "schism",
    label: "Schism",
    color: "#ff8a5c",
    description: "A historically identified internal break or schism.",
    canonicalType: "schism",
    style: "solid",
  },
];

export const RELATION_TYPE_IDS = new Set(RELATION_TYPES.map((r) => r.id));

export const CANONICAL_RELATION_TYPES = new Set([
  "direct_branch",
  "schism",
  "thematic_parallel",
]);

export const EDGE_STYLES = new Set(["solid", "dotted"]);

export const FRONTMATTER_FIELDS = [
  {
    name: "id",
    type: "string",
    required: true,
    description: "Lowercase kebab-case identifier (e.g. `vajrayana`, `stoicism`).",
    exampleYaml: "id: example-tradition",
  },
  {
    name: "title",
    type: "string",
    required: true,
    description: "Primary display name.",
    exampleYaml: "title: Example Tradition",
  },
  {
    name: "cluster",
    type: "string",
    required: true,
    description: "One of the 11 recognized clusters (e.g. `Abrahamic`, `Dharmic`, `East Asian`, `Philosophical & Ethical Systems`).",
    exampleYaml: "cluster: Abrahamic",
  },
  {
    name: "color",
    type: "string",
    required: true,
    description: "6-digit hex color code matching the cluster (e.g. `#3b82f6`).",
    exampleYaml: "color: '#3b82f6'",
  },
  {
    name: "display_weight",
    type: "number",
    required: false,
    description: "Visual prominence multiplier (`0.75` to `3.0`, default `1.0`). Editorial visual hierarchy, not population.",
    exampleYaml: "display_weight: 1.0",
  },
  {
    name: "era_start",
    type: "string",
    required: true,
    description: "Approximate start date (e.g. `c. 500 BCE`, `16th century CE`).",
    exampleYaml: "era_start: c. 100 CE",
  },
  {
    name: "origin_year",
    type: "number",
    required: true,
    description: "Numeric year for timeline navigation and filtering (e.g. `-500`, `1517`).",
    exampleYaml: "origin_year: 100",
  },
  {
    name: "origin_geo",
    type: "{ lat, lng, place_name }",
    required: true,
    description: "Geographic coordinates and place name for the 3D globe view (`{ lat, lng, place_name }`).",
    exampleYaml: "origin_geo:\n  lat: 31.7683\n  lng: 35.2137\n  place_name: Jerusalem",
  },
  {
    name: "extinct_year",
    type: "number | null",
    required: false,
    description: "Numeric year of extinction/dissolution, or `null` if the tradition is living/ongoing.",
    exampleYaml: "extinct_year: null",
  },
  {
    name: "epistemic_tier",
    type: "string",
    required: true,
    description: "Academic certainty level: `academic_consensus`, `minority_scholarly`, `theological_claim`, or `speculative_fringe`.",
    exampleYaml: "epistemic_tier: academic_consensus",
  },
  {
    name: "summary",
    type: "string",
    required: true,
    description: "1-2 sentence summary of the tradition.",
    exampleYaml: "summary: >-\n  A concise 1-2 sentence summary of this tradition, school, movement, or philosophy.",
  },
  {
    name: "aliases",
    type: "string[]",
    required: false,
    description: "Alternative names, transliterations, or historical designations.",
    exampleYaml: "aliases:\n  - Alternate Name\n  - Historical Name",
  },
  {
    name: "canonical_texts",
    type: "string[]",
    required: true,
    description: "Key scriptures, foundational treatises, or primary texts.",
    exampleYaml: "canonical_texts:\n  - Foundational Scripture\n  - Primary Commentary",
  },
  {
    name: "key_tenets",
    type: "string[]",
    required: false,
    description: "Primary philosophical or theological tenets, ethical principles, or practices.",
    exampleYaml: "key_tenets:\n  - Primary philosophical or theological premise\n  - Key ethical or ritual practice",
  },
  {
    name: "sources",
    type: "array",
    required: false,
    description: "Bibliographic citations or academic references (`string` or `{ title, url }`).",
    exampleYaml: "sources:\n  - title: Example Scholarly Source\n    url: https://example.org/source",
  },
  {
    name: "artifacts",
    type: "array",
    required: false,
    description: "Curated visual artifacts, manuscripts, or sacred iconography (`{ title, imageUrl, sourceUrl, provenance, period, description, detail }`). Optional `detail: high` selects the higher-resolution thumbnail tier for text-bearing artifacts.",
    exampleYaml: "artifacts:\n  - title: Example Historical Artifact\n    imageUrl: https://example.org/artifact.jpg\n    sourceUrl: https://commons.wikimedia.org/wiki/File:Example.jpg\n    provenance: Example Museum\n    period: c. 100 CE\n    description: Description of the visual artifact or manuscript.",
  },
  {
    name: "origin_year_precision",
    type: "string",
    required: false,
    description: "Qualifier for dating precision (e.g. `approximate`, `traditional`).",
    exampleYaml: "# origin_year_precision: approximate",
  },
  {
    name: "origin_geo_precision",
    type: "string",
    required: false,
    description: "Qualifier for geographic precision (e.g. `region`, `approximate`).",
    exampleYaml: "# origin_geo_precision: region",
  },
  {
    name: "origin_note",
    type: "string",
    required: false,
    description: "Scholarly note explaining origin dating or location context.",
    exampleYaml: "# origin_note: Approximate dating based on early rabbinic literature.",
  },
  {
    name: "relations",
    type: "array",
    required: false,
    description: "Outgoing relationship links to other traditions (see Relation Fields below).",
    exampleYaml: "relations:\n  - target: christianity\n    type: branch_of\n    certainty: academic_consensus\n    citation: Historical documentation of apostolic origins.",
  },
];

// --- Validation Helpers ---

export function fail(filePath, message, projectRoot) {
  const relativePath = projectRoot
    ? path.relative(projectRoot, filePath)
    : filePath;
  throw new Error(`${relativePath}: ${message}`);
}

export function requiredString(value, field, filePath, projectRoot) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(filePath, `frontmatter field "${field}" must be a non-empty string`, projectRoot);
  }
  return value.trim();
}

export function optionalString(value, field, filePath, projectRoot) {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") {
    fail(filePath, `frontmatter field "${field}" must be a string when provided`, projectRoot);
  }
  return value.trim();
}

export function optionalNumber(value, field, filePath, fallback, projectRoot) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(filePath, `frontmatter field "${field}" must be a finite number when provided`, projectRoot);
  }
  if (value < 0.75 || value > 3) {
    fail(filePath, `frontmatter field "${field}" must be between 0.75 and 3`, projectRoot);
  }
  return value;
}

export function requiredInteger(value, field, filePath, projectRoot) {
  if (value == null || typeof value !== "number" || !Number.isInteger(value)) {
    fail(filePath, `frontmatter field "${field}" must be an integer`, projectRoot);
  }
  return value;
}

export function optionalIntegerOrNull(value, field, filePath, projectRoot) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(filePath, `frontmatter field "${field}" must be an integer or null`, projectRoot);
  }
  return value;
}

export function requiredGeo(value, filePath, projectRoot) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(filePath, 'frontmatter field "origin_geo" must be an object', projectRoot);
  }
  const lat = value.lat;
  const lng = value.lng;
  const placeName = value.place_name;

  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    fail(filePath, 'frontmatter field "origin_geo.lat" must be a number between -90 and 90', projectRoot);
  }
  if (typeof lng !== "number" || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    fail(filePath, 'frontmatter field "origin_geo.lng" must be a number between -180 and 180', projectRoot);
  }
  if (typeof placeName !== "string" || placeName.trim() === "") {
    fail(filePath, 'frontmatter field "origin_geo.place_name" must be a non-empty string', projectRoot);
  }

  return {
    lat,
    lng,
    place_name: placeName.trim(),
  };
}

export function stringArray(value, field, filePath, projectRoot) {
  if (!Array.isArray(value) || value.length === 0) {
    fail(filePath, `frontmatter field "${field}" must be a non-empty string array`, projectRoot);
  }

  return value.map((item, index) =>
    requiredString(item, `${field}[${index}]`, filePath, projectRoot),
  );
}

export function optionalStringArray(value, field, filePath, projectRoot) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    fail(filePath, `frontmatter field "${field}" must be a string array when provided`, projectRoot);
  }
  return [
    ...new Set(
      value.map((item, index) =>
        requiredString(item, `${field}[${index}]`, filePath, projectRoot),
      ),
    ),
  ];
}

export function normalizeSources(value, filePath, projectRoot) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    fail(filePath, 'frontmatter field "sources" must be an array when provided', projectRoot);
  }
  return value.map((item, index) => {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) fail(filePath, `sources[${index}] must not be empty`, projectRoot);
      return trimmed;
    }
    if (item && typeof item === "object") {
      const title = requiredString(item.title, `sources[${index}].title`, filePath, projectRoot);
      const url = optionalString(item.url, `sources[${index}].url`, filePath, projectRoot);
      return { title, ...(url ? { url } : {}) };
    }
    fail(filePath, `sources[${index}] must be a string or object`, projectRoot);
  });
}

export function normalizeArtifacts(value, filePath, projectRoot) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    fail(filePath, 'frontmatter field "artifacts" must be an array when provided', projectRoot);
  }
  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      fail(filePath, `artifacts[${index}] must be an object`, projectRoot);
    }
    const title = requiredString(item.title, `artifacts[${index}].title`, filePath, projectRoot);
    const imageUrl = optionalString(
      item.imageUrl || item.image_url || item.url,
      `artifacts[${index}].imageUrl`,
      filePath,
      projectRoot,
    );
    const sourceUrl = optionalString(
      item.sourceUrl || item.source_url || item.link,
      `artifacts[${index}].sourceUrl`,
      filePath,
      projectRoot,
    );
    const provenance = optionalString(item.provenance, `artifacts[${index}].provenance`, filePath, projectRoot);
    const period = optionalString(item.period, `artifacts[${index}].period`, filePath, projectRoot);
    const description = optionalString(item.description, `artifacts[${index}].description`, filePath, projectRoot);
    const detail = optionalString(item.detail, `artifacts[${index}].detail`, filePath, projectRoot);

    if (detail !== undefined && !ARTIFACT_DETAIL_TIER_IDS.has(detail)) {
      fail(
        filePath,
        `artifacts[${index}].detail "${detail}" is not one of ${[
          ...ARTIFACT_DETAIL_TIER_IDS,
        ].join(", ")}`,
        projectRoot,
      );
    }

    return {
      title,
      ...(imageUrl ? { imageUrl, url: imageUrl } : {}),
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(provenance ? { provenance } : {}),
      ...(period ? { period } : {}),
      ...(description ? { description } : {}),
      ...(detail ? { detail } : {}),
    };
  });
}

export function mapRelationType(legacyType) {
  if (legacyType === "branch_of") {
    return { relation_type: "direct_branch", style: "solid" };
  }
  if (legacyType === "schism" || legacyType === "diverged_from") {
    return { relation_type: "schism", style: "solid" };
  }
  return { relation_type: "thematic_parallel", style: "dotted" };
}

export function normalizeRelations(value, filePath, projectRoot) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    fail(filePath, 'frontmatter field "relations" must be an array', projectRoot);
  }

  return value.map((relation, index) => {
    if (!relation || typeof relation !== "object" || Array.isArray(relation)) {
      fail(filePath, `relations[${index}] must be an object`, projectRoot);
    }

    const target = requiredString(
      relation.target,
      `relations[${index}].target`,
      filePath,
      projectRoot,
    );
    const type = requiredString(
      relation.type,
      `relations[${index}].type`,
      filePath,
      projectRoot,
    );
    const certainty = requiredString(
      relation.certainty,
      `relations[${index}].certainty`,
      filePath,
      projectRoot,
    );

    if (!RELATION_TYPE_IDS.has(type)) {
      fail(
        filePath,
        `relations[${index}].type "${type}" is not one of ${[
          ...RELATION_TYPE_IDS,
        ].join(", ")}`,
        projectRoot,
      );
    }
    if (!EPISTEMIC_TIER_IDS.has(certainty)) {
      fail(
        filePath,
        `relations[${index}].certainty "${certainty}" is not one of ${[
          ...EPISTEMIC_TIER_IDS,
        ].join(", ")}`,
        projectRoot,
      );
    }

    const citation = optionalString(
      relation.citation,
      `relations[${index}].citation`,
      filePath,
      projectRoot,
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

export function parseNodeRecord(data, content, filePath, projectRoot) {
  const id = requiredString(data.id, "id", filePath, projectRoot);
  const epistemicTier = requiredString(
    data.epistemic_tier,
    "epistemic_tier",
    filePath,
    projectRoot,
  );

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    fail(filePath, `id "${id}" must be lowercase kebab-case`, projectRoot);
  }
  if (!EPISTEMIC_TIER_IDS.has(epistemicTier)) {
    fail(
      filePath,
      `epistemic_tier "${epistemicTier}" is not one of ${[
        ...EPISTEMIC_TIER_IDS,
      ].join(", ")}`,
      projectRoot,
    );
  }

  const cluster = requiredString(data.cluster, "cluster", filePath, projectRoot);
  if (!CLUSTERS.includes(cluster)) {
    fail(
      filePath,
      `cluster "${cluster}" is not one of recognized clusters: ${CLUSTERS.join(", ")}`,
      projectRoot,
    );
  }

  const color = requiredString(data.color, "color", filePath, projectRoot).toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(color)) {
    fail(filePath, `color "${color}" must be a six-digit hexadecimal color`, projectRoot);
  }

  const originYear = requiredInteger(data.origin_year, "origin_year", filePath, projectRoot);
  const originGeo = requiredGeo(data.origin_geo, filePath, projectRoot);
  const extinctYear = optionalIntegerOrNull(data.extinct_year, "extinct_year", filePath, projectRoot);

  const originYearPrecision = optionalString(data.origin_year_precision, "origin_year_precision", filePath, projectRoot);
  const originGeoPrecision = optionalString(data.origin_geo_precision, "origin_geo_precision", filePath, projectRoot);
  const originNote = optionalString(data.origin_note, "origin_note", filePath, projectRoot);

  const keyTenets = optionalStringArray(data.key_tenets || data.keyTenets, "key_tenets", filePath, projectRoot);
  const sources = normalizeSources(data.sources, filePath, projectRoot);
  const artifacts = normalizeArtifacts(data.artifacts, filePath, projectRoot);

  const body = content.trim();
  if (!body) fail(filePath, "Markdown body must not be empty", projectRoot);

  const sourcePath = projectRoot
    ? path.relative(projectRoot, filePath).split(path.sep).join("/")
    : filePath;

  return {
    node: {
      id,
      title: requiredString(data.title, "title", filePath, projectRoot),
      cluster,
      color,
      displayWeight: optionalNumber(data.display_weight, "display_weight", filePath, 1, projectRoot),
      eraStart: requiredString(data.era_start, "era_start", filePath, projectRoot),
      epistemicTier,
      summary: requiredString(data.summary, "summary", filePath, projectRoot),
      aliases: optionalStringArray(data.aliases, "aliases", filePath, projectRoot),
      canonicalTexts: stringArray(data.canonical_texts, "canonical_texts", filePath, projectRoot),
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
      sourcePath,
      backlinks: { inbound: [], outbound: [] },
    },
    relations: normalizeRelations(data.relations, filePath, projectRoot),
    filePath,
  };
}

export function detectBranchCycles(nodesById, links) {
  const parentsByChild = new Map();
  for (const link of links) {
    if (link.type === "branch_of" || link.relation_type === "direct_branch") {
      const parents = parentsByChild.get(link.source) || [];
      parents.push(link.target);
      parentsByChild.set(link.source, parents);
    }
  }

  const globalVisited = new Set();
  const recursionStack = new Set();

  function checkCycle(nodeId, visitPath) {
    if (recursionStack.has(nodeId)) {
      const cyclePath = [...visitPath, nodeId].join(" -> ");
      throw new Error(`Branch cycle detected involving node "${nodeId}": ${cyclePath}`);
    }
    if (globalVisited.has(nodeId)) return;

    recursionStack.add(nodeId);
    const parents = parentsByChild.get(nodeId) || [];
    for (const parentId of parents) {
      checkCycle(parentId, [...visitPath, nodeId]);
    }
    recursionStack.delete(nodeId);
    globalVisited.add(nodeId);
  }

  for (const nodeId of parentsByChild.keys()) {
    if (!globalVisited.has(nodeId)) {
      checkCycle(nodeId, []);
    }
  }
}

// --- Derivation Generators ---

export function generateTemplateMarkdown() {
  const frontmatterLines = [
    "---",
    "id: example-tradition",
    "title: Example Tradition",
    "cluster: Abrahamic",
    "color: '#3b82f6'",
    "display_weight: 1.0",
    "era_start: c. 100 CE",
    "origin_year: 100",
    "origin_geo:",
    "  lat: 31.7683",
    "  lng: 35.2137",
    "  place_name: Jerusalem",
    "extinct_year: null",
    "epistemic_tier: academic_consensus",
    "summary: >-",
    "  A concise 1-2 sentence summary of this tradition, school, movement, or philosophy.",
    "aliases:",
    "  - Alternate Name",
    "  - Historical Name",
    "canonical_texts:",
    "  - Foundational Scripture",
    "  - Primary Commentary",
    "key_tenets:",
    "  - Primary philosophical or theological premise",
    "  - Key ethical or ritual practice",
    "sources:",
    "  - title: Example Scholarly Source",
    "    url: https://example.org/source",
    "artifacts:",
    "  - title: Example Historical Artifact",
    "    imageUrl: https://example.org/artifact.jpg",
    "    sourceUrl: https://commons.wikimedia.org/wiki/File:Example.jpg",
    "    provenance: Example Museum",
    "    period: c. 100 CE",
    "    description: Description of the visual artifact or manuscript.",
    "relations:",
    "  - target: christianity",
    "    type: branch_of",
    "    certainty: academic_consensus",
    "    citation: Historical documentation of apostolic origins.",
    "---",
    "",
    "## Overview",
    "",
    "A comprehensive academic overview of the tradition, its historical origins, core doctrines, rituals, and evolution over time.",
    "",
    "## Key Doctrines & Philosophy",
    "",
    "Detail the theological framework, cosmological perspective, ethics, and practices.",
    "",
    "## Historical Impact & Lineage",
    "",
    "Describe how this tradition developed, influenced other movements, or underwent reforms.",
    "",
  ];

  return frontmatterLines.join("\n");
}

export function generateContributingFieldTable() {
  const header = [
    "| Field | Type | Required | Description |",
    "| :--- | :--- | :--- | :--- |",
  ];

  const rows = FRONTMATTER_FIELDS.filter((f) => !f.name.startsWith("origin_") || f.name === "origin_year" || f.name === "origin_geo").map((field) => {
    const req = field.required ? "Yes" : "Optional";
    return `| \`${field.name}\` | \`${field.type}\` | ${req} | ${field.description} |`;
  });

  return [...header, ...rows].join("\n");
}

export function generateContributingMarkdown(existingDoc = "") {
  const table = generateContributingFieldTable();

  const clusterList = CLUSTERS.map((c) => `- \`${c}\``).join("\n");

  const tierList = EPISTEMIC_TIERS.map(
    (t) => `- \`${t.id}\`: ${t.description}`,
  ).join("\n");

  const relationTypeList = RELATION_TYPES.map((r) => `\`${r.id}\``).join(", ");

  const schemaSection = `## Frontmatter Reference

${table}

### Recognized Clusters

The 11 recognized clusters are:
${clusterList}

### Epistemic Tiers

${tierList}

### Relation Fields

\`\`\`yaml
relations:
  - target: christianity
    type: branch_of
    certainty: academic_consensus
    citation: "Historical consensus on apostolic roots"
\`\`\`

- \`target\`: Valid \`id\` of another existing tradition in the atlas.
- \`type\`: One of ${relationTypeList}.
- \`certainty\`: Academic certainty level: \`academic_consensus\`, \`minority_scholarly\`, \`theological_claim\`, or \`speculative_fringe\`.
- \`citation\`: Optional scholarly citation or explanation.`;

  const startMarker = "<!-- BEGIN_FRONTMATTER_SCHEMA -->";
  const endMarker = "<!-- END_FRONTMATTER_SCHEMA -->";

  if (existingDoc.includes(startMarker) && existingDoc.includes(endMarker)) {
    const before = existingDoc.split(startMarker)[0];
    const after = existingDoc.split(endMarker)[1];
    return `${before}${startMarker}\n${schemaSection}\n${endMarker}${after}`;
  }

  // If markers not present, replace the Frontmatter Reference through Relation Fields section
  const frontmatterRefHeading = "## Frontmatter Reference";
  const localDevHeading = "## Local Development & Testing";

  if (existingDoc.includes(frontmatterRefHeading) && existingDoc.includes(localDevHeading)) {
    const before = existingDoc.split(frontmatterRefHeading)[0];
    const after = existingDoc.slice(existingDoc.indexOf(localDevHeading));
    return `${before}${startMarker}\n${schemaSection}\n${endMarker}\n\n---\n\n${after}`;
  }

  return `# Contributing to OpenGrail\n\n${startMarker}\n${schemaSection}\n${endMarker}\n`;
}

export function generateSchemaTypescript() {
  const epistemicTierArray = EPISTEMIC_TIERS.map((t) => `  '${t.id}',`).join("\n");
  const relationTypeArray = RELATION_TYPES.map((r) => `  '${r.id}',`).join("\n");
  const canonicalTypeArray = Array.from(CANONICAL_RELATION_TYPES).map((c) => `  '${c}',`).join("\n");
  const clustersArray = CLUSTERS.map((c) => `  '${c}',`).join("\n");
  const artifactDetailTiersArray = ARTIFACT_DETAIL_TIERS.map((d) => `  '${d}',`).join("\n");

  const epistemicOptions = EPISTEMIC_TIERS.map((t) => `  {
    value: '${t.id}',
    label: '${t.label}',
    shortLabel: '${t.shortLabel}',
    color: '${t.color}',
    description: '${t.description.replace(/'/g, "\\'")}',
  },`).join("\n");

  const relationOptions = RELATION_TYPES.map((r) => `  {
    value: '${r.id}',
    label: '${r.label}',
    color: '${r.color}',
    description: '${r.description.replace(/'/g, "\\'")}',
    canonicalType: '${r.canonicalType}',
    style: '${r.style}',
  },`).join("\n");

  return `/* SPDX-License-Identifier: MIT */
// Generated automatically from scripts/schema.js - DO NOT EDIT MANUALLY

/**
 * The confidence tier attached to both traditions and individual relations.
 * Derived from scripts/schema.js.
 */
export const EPISTEMIC_TIERS = [
${epistemicTierArray}
] as const;

export type EpistemicTier = (typeof EPISTEMIC_TIERS)[number];

/** Supported directed relations between traditions in the data set. */
export const RELATION_TYPES = [
${relationTypeArray}
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

/** Canonical relation types for synchronized atlas views. */
export const CANONICAL_RELATION_TYPES = [
${canonicalTypeArray}
] as const;

export type CanonicalRelationType = (typeof CANONICAL_RELATION_TYPES)[number];

export type EdgeStyle = 'solid' | 'dotted';

export const CLUSTERS = [
${clustersArray}
] as const;

export type ClusterName = (typeof CLUSTERS)[number] | string;
export type GraphNodeId = string;

/**
 * Artifact resolution tiers. 'high' selects the 1600px long edge tier for text-bearing artifacts.
 */
export const ARTIFACT_DETAIL_TIERS = [
${artifactDetailTiersArray}
] as const;

export type ArtifactDetailTier = (typeof ARTIFACT_DETAIL_TIERS)[number];

export interface OriginGeo {
  lat: number;
  lng: number;
  place_name: string;
}

export interface EpistemicTierOption {
  value: EpistemicTier;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}

export interface RelationTypeOption {
  value: RelationType;
  label: string;
  color: string;
  description: string;
  canonicalType?: CanonicalRelationType;
  style?: EdgeStyle;
}

export const EPISTEMIC_TIER_OPTIONS = [
${epistemicOptions}
] as const satisfies readonly EpistemicTierOption[];

export const RELATION_TYPE_OPTIONS = [
${relationOptions}
] as const satisfies readonly RelationTypeOption[];

/** A compact relation used by the document pane's backlink lists. */
export interface RelationRef {
  nodeId: GraphNodeId;
  title: string;
  type: RelationType;
  certainty: EpistemicTier;
  relation_type?: CanonicalRelationType;
  relationType?: CanonicalRelationType;
  epistemic_tier?: EpistemicTier;
  epistemicTier?: EpistemicTier;
  style?: EdgeStyle;
  citation?: string;
}

export interface Backlinks {
  inbound: RelationRef[];
  outbound: RelationRef[];
}

/** The normalized representation of one Markdown visual artifact. */
export interface TraditionArtifact {
  title: string;
  url?: string;
  imageUrl?: string;
  image_url?: string;
  sourceUrl?: string;
  source_url?: string;
  provenance?: string;
  period?: string;
  description?: string;
  detail?: ArtifactDetailTier;
}

export interface GraphNode {
  id: GraphNodeId;
  title: string;
  cluster: ClusterName;
  color: string;
  /** Editorial visual hierarchy, independent of adherent estimates. */
  displayWeight: number;
  eraStart: string;
  epistemicTier: EpistemicTier;
  summary: string;
  aliases: string[];
  canonicalTexts: string[];
  key_tenets?: string[];
  keyTenets?: string[];
  sources?: Array<string | { title: string; url?: string }>;
  artifacts?: TraditionArtifact[];
  origin_year?: number;
  originYear?: number;
  origin_geo?: OriginGeo;
  originGeo?: OriginGeo;
  extinct_year?: number | null;
  extinctYear?: number | null;
  origin_year_precision?: string;
  originYearPrecision?: string;
  origin_geo_precision?: string;
  originGeoPrecision?: string;
  origin_note?: string;
  originNote?: string;
  content: string;
  sourcePath: string;
  backlinks: Backlinks;
}

/**
 * A directed relation as serialized in graph.json.
 */
export interface GraphLink {
  id: string;
  source: GraphNodeId;
  target: GraphNodeId;
  type: RelationType;
  certainty: EpistemicTier;
  relation_type?: CanonicalRelationType;
  relationType?: CanonicalRelationType;
  epistemic_tier?: EpistemicTier;
  epistemicTier?: EpistemicTier;
  style?: EdgeStyle;
  citation?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  clusters: ClusterName[];
}

export interface GraphFilterState {
  activeTiers: ReadonlySet<EpistemicTier>;
  activeRelationTypes: ReadonlySet<RelationType>;
}

export function isEpistemicTier(value: unknown): value is EpistemicTier {
  return (
    typeof value === 'string' &&
    (EPISTEMIC_TIERS as readonly string[]).includes(value)
  );
}

export function isRelationType(value: unknown): value is RelationType {
  return (
    typeof value === 'string' &&
    (RELATION_TYPES as readonly string[]).includes(value)
  );
}

export function isCanonicalRelationType(value: unknown): value is CanonicalRelationType {
  return (
    typeof value === 'string' &&
    (CANONICAL_RELATION_TYPES as readonly string[]).includes(value)
  );
}

export function isArtifactDetailTier(value: unknown): value is ArtifactDetailTier {
  return (
    typeof value === 'string' &&
    (ARTIFACT_DETAIL_TIERS as readonly string[]).includes(value)
  );
}

export function formatTaxonomyLabel(value: string): string {
  const normalized = value.replaceAll('_', ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
`;
}
