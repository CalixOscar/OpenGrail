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

export type GraphNodeId = string;
export type ClusterName = string;

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
  },
  {
    value: 'diverged_from',
    label: 'Diverged from',
    color: '#61a8ff',
    description: 'A historical lineage split or development.',
  },
  {
    value: 'influenced_by',
    label: 'Influenced by',
    color: '#f2c45e',
    description: 'An evidenced directional influence.',
  },
  {
    value: 'syncretized_with',
    label: 'Syncretized with',
    color: '#66ddb1',
    description: 'Traditions or practices blended through contact.',
  },
  {
    value: 'parallel_concept',
    label: 'Parallel concept',
    color: '#a88bff',
    description: 'A useful conceptual parallel without asserting lineage.',
  },
  {
    value: 'fringe_reinterpretation',
    label: 'Fringe reinterpretation',
    color: '#ff668c',
    description: 'A speculative reinterpretation of another tradition.',
  },
  {
    value: 'schism',
    label: 'Schism',
    color: '#ff8a5c',
    description: 'A historically identified internal break or schism.',
  },
] as const satisfies readonly RelationTypeOption[];

/** A compact relation used by the document pane's backlink lists. */
export interface RelationRef {
  nodeId: GraphNodeId;
  title: string;
  type: RelationType;
  certainty: EpistemicTier;
  citation?: string;
}

export interface Backlinks {
  inbound: RelationRef[];
  outbound: RelationRef[];
}

/** The normalized representation of one Markdown document. */
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

/** Shared search ranking for the drawer, command search, and graph auto-focus. */
export function scoreGraphNodeSearch(node: GraphNode, query: string): number {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return 0;

  const title = normalizeSearchValue(node.title);
  const id = normalizeSearchValue(node.id);
  const aliases = node.aliases.map(normalizeSearchValue);
  const primaryValues = [title, id, ...aliases];

  if (primaryValues.includes(normalizedQuery)) return 100;
  if (primaryValues.some((value) => value.startsWith(normalizedQuery))) return 80;
  if (primaryValues.some((value) => value.includes(normalizedQuery))) return 60;

  if (normalizedQuery.length >= 5 && !normalizedQuery.includes(' ')) {
    const candidateTokens = new Set(
      primaryValues.flatMap((value) => value.split(' ')).filter((value) => value.length >= 5),
    );
    const fuzzyMatch = [...candidateTokens].some((candidate) => (
      Math.abs(candidate.length - normalizedQuery.length) <= 2 &&
      editDistance(candidate, normalizedQuery) <= 2
    ));
    if (fuzzyMatch) return 52;
  }

  if (normalizeSearchValue(node.cluster).includes(normalizedQuery)) return 35;
  const descriptiveText = normalizeSearchValue(
    [node.summary, ...node.canonicalTexts].join(' '),
  );
  return descriptiveText.includes(normalizedQuery) ? 15 : 0;
}

export function isRelationType(value: unknown): value is RelationType {
  return (
    typeof value === 'string' &&
    (RELATION_TYPES as readonly string[]).includes(value)
  );
}

export function formatTaxonomyLabel(value: string): string {
  const normalized = value.replaceAll('_', ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
