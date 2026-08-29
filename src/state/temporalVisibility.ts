/* SPDX-License-Identifier: MIT */

export type TemporalMode = 'emergent' | 'active';

export const DEFAULT_TEMPORAL_MODE: TemporalMode = 'emergent';

export interface TemporalNodeLike {
  origin_year?: number;
  originYear?: number;
  extinct_year?: number | null;
  extinctYear?: number | null;
}

/**
 * Predicate checking if a node is visible at the specified year under the given temporal mode.
 *
 * Modes:
 * - 'emergent': origin_year <= year (Cumulative history; what has appeared by now)
 * - 'active': origin_year <= year && (extinct_year == null || year < extinct_year)
 *
 * Boundary condition: year >= extinct_year counts as extinct (the extinction year itself is extinct).
 */
export function isNodeTemporallyVisible(
  node: TemporalNodeLike | null | undefined,
  year: number,
  mode: TemporalMode = DEFAULT_TEMPORAL_MODE,
): boolean {
  if (!node) return false;
  const originYear = node.origin_year ?? node.originYear ?? 0;
  if (originYear > year) return false;

  if (mode === 'active') {
    const extinctYear = node.extinct_year ?? node.extinctYear;
    if (extinctYear !== null && extinctYear !== undefined && year >= extinctYear) {
      return false;
    }
  }

  return true;
}

/**
 * Predicate checking if a link is visible at the specified year under the given temporal mode.
 * A link is visible if both its source and target nodes are temporally visible at that year.
 */
export function isLinkTemporallyVisible(
  sourceNode: TemporalNodeLike | null | undefined,
  targetNode: TemporalNodeLike | null | undefined,
  year: number,
  mode: TemporalMode = DEFAULT_TEMPORAL_MODE,
): boolean {
  if (!sourceNode || !targetNode) return false;
  return (
    isNodeTemporallyVisible(sourceNode, year, mode) &&
    isNodeTemporallyVisible(targetNode, year, mode)
  );
}

/**
 * Check if a node is extinct at the given year.
 * Returns true if extinct_year is defined and year >= extinct_year.
 */
export function isNodeExtinct(
  node: TemporalNodeLike | null | undefined,
  year: number,
): boolean {
  if (!node) return false;
  const extinctYear = node.extinct_year ?? node.extinctYear;
  return extinctYear !== null && extinctYear !== undefined && year >= extinctYear;
}

/**
 * Check if a node has not yet emerged at the given year (origin_year > year).
 */
export function isNodeFuture(
  node: TemporalNodeLike | null | undefined,
  year: number,
): boolean {
  if (!node) return false;
  const originYear = node.origin_year ?? node.originYear ?? 0;
  return originYear > year;
}
