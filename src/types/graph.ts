/* SPDX-License-Identifier: AGPL-3.0-or-later OR LicenseRef-OpenGrail-Commercial */
/* See LICENSE and LICENSE-COMMERCIAL.md for the applicable terms. */

/**
 * The confidence tier attached to both traditions and individual relations.
 *
 * Keep these values in sync with the Markdown frontmatter schema. They are
 * deliberately machine-friendly because they are serialized to graph.json.
 */
export const EPISTEMIC_TIERS = [
  'academic_consensus',
  'minority_scholarly',
  'theological_claim',
  'speculative_fringe',
] as const;

export type EpistemicTier = (typeof EPISTEMIC_TIERS)[number];

/** Supported directed relations between traditions in the MVP data set. */
export const RELATION_TYPES = [
  'branch_of',
  'diverged_from',
  'influenced_by',
  'syncretized_with',
  'parallel_concept',
  'fringe_reinterpretation',
  'schism',
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

/** Canonical relation types for synchronized atlas views. */
export const CANONICAL_RELATION_TYPES = [
  'direct_branch',
  'schism',
  'thematic_parallel',
] as const;

export type CanonicalRelationType = (typeof CANONICAL_RELATION_TYPES)[number];

export type EdgeStyle = 'solid' | 'dotted';

export type GraphNodeId = string;
export type ClusterName = string;

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
  {
    value: 'academic_consensus',
    label: 'Academic consensus',
    shortLabel: 'Consensus',
    color: '#45d6a7',
    description: 'Broadly supported by the current academic literature.',
  },
  {
    value: 'minority_scholarly',
    label: 'Minority scholarly',
    shortLabel: 'Minority',
    color: '#f4c763',
    description: 'A documented scholarly position without broad consensus.',
  },
  {
    value: 'theological_claim',
    label: 'Theological claim',
    shortLabel: 'Theological',
    color: '#b58cff',
    description: 'A confessional or tradition-internal theological claim.',
  },
  {
    value: 'speculative_fringe',
    label: 'Speculative / fringe',
    shortLabel: 'Speculative',
    color: '#ff668c',
    description: 'A highly speculative claim outside mainstream scholarship.',
  },
] as const satisfies readonly EpistemicTierOption[];

export const RELATION_TYPE_OPTIONS = [
  {
    value: 'branch_of',
    label: 'Branch of',
    color: '#7dd3fc',
    description: 'A denomination, school, sect, or regional branch within a broader tradition.',
    canonicalType: 'direct_branch',
    style: 'solid',
  },
  {
    value: 'diverged_from',
    label: 'Diverged from',
    color: '#61a8ff',
    description: 'A historical lineage split or development.',
    canonicalType: 'schism',
    style: 'solid',
  },
  {
    value: 'influenced_by',
    label: 'Influenced by',
    color: '#f2c45e',
    description: 'An evidenced directional influence.',
    canonicalType: 'thematic_parallel',
    style: 'dotted',
  },
  {
    value: 'syncretized_with',
    label: 'Syncretized with',
    color: '#66ddb1',
    description: 'Traditions or practices blended through contact.',
    canonicalType: 'thematic_parallel',
    style: 'dotted',
  },
  {
    value: 'parallel_concept',
    label: 'Parallel concept',
    color: '#a88bff',
    description: 'A useful conceptual parallel without asserting lineage.',
    canonicalType: 'thematic_parallel',
    style: 'dotted',
  },
  {
    value: 'fringe_reinterpretation',
    label: 'Fringe reinterpretation',
    color: '#ff668c',
    description: 'A speculative reinterpretation of another tradition.',
    canonicalType: 'thematic_parallel',
    style: 'dotted',
  },
  {
    value: 'schism',
    label: 'Schism',
    color: '#ff8a5c',
    description: 'A historically identified internal break or schism.',
    canonicalType: 'schism',
    style: 'solid',
  },
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

/** The normalized representation of one Markdown document. */
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
 *
 * react-force-graph mutates source and target internally; GraphCanvas clones
 * these records before handing them to the renderer so this domain type can
 * remain immutable in application state.
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

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function editDistance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const previous = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = previous;
    }
  }
  return row[right.length];
}

/** Shared search ranking for drawer search, command palette, and graph auto-focus. */
export function scoreGraphNodeSearch(node: GraphNode, query: string): number {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return 0;

  const title = normalizeSearchValue(node.title);
  const id = normalizeSearchValue(node.id);
  const aliases = (node.aliases ?? []).map(normalizeSearchValue);
  const primaryValues = [title, id, ...aliases];

  // 1. Exact or prefix match on title / aliases
  if (primaryValues.includes(normalizedQuery)) return 100;
  if (primaryValues.some((value) => value.startsWith(normalizedQuery))) return 85;
  if (primaryValues.some((value) => value.includes(normalizedQuery))) return 65;

  // 2. Fuzzy match on title / aliases tokens
  if (normalizedQuery.length >= 4 && !normalizedQuery.includes(' ')) {
    const candidateTokens = new Set(
      primaryValues.flatMap((value) => value.split(' ')).filter((value) => value.length >= 4),
    );
    const fuzzyMatch = [...candidateTokens].some((candidate) => (
      Math.abs(candidate.length - normalizedQuery.length) <= 2 &&
      editDistance(candidate, normalizedQuery) <= (normalizedQuery.length > 5 ? 2 : 1)
    ));
    if (fuzzyMatch) return 55;
  }

  // 3. Canonical Texts & Sacred Scriptures match
  const canonicalTexts = (node.canonicalTexts ?? []).map(normalizeSearchValue);
  if (canonicalTexts.some((text) => text.includes(normalizedQuery))) return 45;

  // 4. Key Tenets & Doctrinal Concepts
  const tenets = ((node.keyTenets || (node as any).key_tenets || []) as string[]).map(normalizeSearchValue);
  if (tenets.some((tenet) => tenet.includes(normalizedQuery))) return 35;

  // 5. Geographic Location / Sanctuary Place Name
  const placeName = normalizeSearchValue(node.origin_geo?.place_name || node.originGeo?.place_name || '');
  if (placeName && placeName.includes(normalizedQuery)) return 30;

  // 6. Artifact Titles, Provenance & Descriptions
  const artifactTexts = (node.artifacts ?? []).map((art) => (
    normalizeSearchValue(`${art.title} ${art.provenance || ''} ${art.description || ''}`)
  ));
  if (artifactTexts.some((artText) => artText.includes(normalizedQuery))) return 25;

  // 7. Full Markdown Content & Summary Corpus
  const fullCorpus = normalizeSearchValue(`${node.summary || ''} ${node.content || ''}`);
  if (fullCorpus.includes(normalizedQuery)) return 20;

  // 8. Cluster classification
  if (normalizeSearchValue(node.cluster).includes(normalizedQuery)) return 15;

  return 0;
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

export function formatTaxonomyLabel(value: string): string {
  const normalized = value.replaceAll('_', ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

