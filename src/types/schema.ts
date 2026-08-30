/* SPDX-License-Identifier: MIT */
// Generated automatically from scripts/schema.js - DO NOT EDIT MANUALLY

/**
 * The confidence tier attached to both traditions and individual relations.
 * Derived from scripts/schema.js.
 */
export const EPISTEMIC_TIERS = [
  'academic_consensus',
  'minority_scholarly',
  'theological_claim',
  'speculative_fringe',
] as const;

export type EpistemicTier = (typeof EPISTEMIC_TIERS)[number];

/** Supported directed relations between traditions in the data set. */
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

export const CLUSTERS = [
  'Abrahamic',
  'Dharmic',
  'East Asian',
  'Indigenous & Diasporic',
  'Iranian',
  'Ancient Near East',
  'Ancient Mediterranean',
  'Ancient European',
  'Esoteric & Modern',
  'Philosophical & Ethical Systems',
  'Speculative',
] as const;

export type ClusterName = (typeof CLUSTERS)[number] | string;
export type GraphNodeId = string;

/**
 * Artifact resolution tiers. 'high' selects the 1600px long edge tier for text-bearing artifacts.
 */
export const ARTIFACT_DETAIL_TIERS = [
  'high',
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
