/* SPDX-License-Identifier: MIT */

export * from './schema';
import type { GraphNode } from './schema';

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
