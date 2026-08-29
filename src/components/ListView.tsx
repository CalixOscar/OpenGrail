/* SPDX-License-Identifier: MIT */

import { useEffect, useMemo, useRef } from 'react';
import { useAtlasState } from '../state/AtlasState';
import {
  isLinkTemporallyVisible,
  isNodeExtinct,
  isNodeTemporallyVisible,
} from '../state/temporalVisibility';
import { formatYearLabel } from './TimelineScrubber';
import {
  EPISTEMIC_TIER_OPTIONS,
  RELATION_TYPE_OPTIONS,
  formatTaxonomyLabel,
  scoreGraphNodeSearch,
  type EpistemicTier,
  type GraphData,
  type GraphNode,
  type RelationType,
} from '../types/graph';

export interface ListViewProps {
  graphData: GraphData;
  onSelectNode: (nodeId: string | null) => void;
  className?: string;
}

interface RenderedRelation {
  id: string;
  direction: 'outbound' | 'inbound';
  type: RelationType;
  typeLabel: string;
  typeColor: string;
  otherNodeId: string;
  otherNodeTitle: string;
  certainty: EpistemicTier;
  certaintyLabel: string;
  certaintyColor: string;
  citation?: string;
}

const TIER_OPTIONS_MAP = new Map(
  EPISTEMIC_TIER_OPTIONS.map((opt) => [opt.value, opt]),
);

const RELATION_OPTIONS_MAP = new Map(
  RELATION_TYPE_OPTIONS.map((opt) => [opt.value, opt]),
);

export function ListView({
  graphData,
  onSelectNode,
  className = '',
}: ListViewProps) {
  const {
    currentYear,
    temporalMode,
    activeTiers,
    activeRelationTypes,
    searchQuery,
    selectedNodeId,
  } = useAtlasState();

  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

  const nodeMap = useMemo(
    () => new Map(graphData.nodes.map((node) => [node.id, node])),
    [graphData.nodes],
  );

  const visibleNodes = useMemo(
    () =>
      graphData.nodes.filter(
        (node) =>
          activeTiers.has(node.epistemicTier) &&
          isNodeTemporallyVisible(node, currentYear, temporalMode),
      ),
    [activeTiers, currentYear, graphData.nodes, temporalMode],
  );

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes],
  );

  const displayedTraditions = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase();
    if (!q) return visibleNodes;
    return visibleNodes
      .filter((node) => scoreGraphNodeSearch(node, q) > 0)
      .sort((left, right) => {
        const scoreDelta =
          scoreGraphNodeSearch(right, q) - scoreGraphNodeSearch(left, q);
        return scoreDelta || left.title.localeCompare(right.title);
      });
  }, [searchQuery, visibleNodes]);

  // Pre-calculate visible relations map for each node
  const relationsByNodeId = useMemo(() => {
    const map = new Map<string, RenderedRelation[]>();
    visibleNodes.forEach((node) => map.set(node.id, []));

    graphData.links.forEach((link) => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) return;

      if (!visibleNodeIds.has(source.id) || !visibleNodeIds.has(target.id)) return;
      if (!activeTiers.has(link.certainty) || !activeRelationTypes.has(link.type)) return;
      if (!isLinkTemporallyVisible(source, target, currentYear, temporalMode)) return;

      const typeOpt = RELATION_OPTIONS_MAP.get(link.type);
      const tierOpt = TIER_OPTIONS_MAP.get(link.certainty);
      const typeLabel = typeOpt?.label ?? formatTaxonomyLabel(link.type);
      const typeColor = typeOpt?.color ?? '#7dd3fc';
      const certaintyLabel = tierOpt?.shortLabel ?? formatTaxonomyLabel(link.certainty);
      const certaintyColor = tierOpt?.color ?? '#45d6a7';

      // Outbound for source
      const srcRelations = map.get(source.id);
      if (srcRelations) {
        srcRelations.push({
          id: `${link.id}-out`,
          direction: 'outbound',
          type: link.type,
          typeLabel,
          typeColor,
          otherNodeId: target.id,
          otherNodeTitle: target.title,
          certainty: link.certainty,
          certaintyLabel,
          certaintyColor,
          citation: link.citation,
        });
      }

      // Inbound for target
      const tgtRelations = map.get(target.id);
      if (tgtRelations) {
        tgtRelations.push({
          id: `${link.id}-in`,
          direction: 'inbound',
          type: link.type,
          typeLabel,
          typeColor,
          otherNodeId: source.id,
          otherNodeTitle: source.title,
          certainty: link.certainty,
          certaintyLabel,
          certaintyColor,
          citation: link.citation,
        });
      }
    });

    return map;
  }, [
    activeRelationTypes,
    activeTiers,
    currentYear,
    graphData.links,
    nodeMap,
    temporalMode,
    visibleNodeIds,
    visibleNodes,
  ]);

  const totalVisibleRelations = useMemo(() => {
    return graphData.links.filter((link) => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) return false;
      if (!visibleNodeIds.has(source.id) || !visibleNodeIds.has(target.id)) return false;
      if (!activeTiers.has(link.certainty) || !activeRelationTypes.has(link.type)) return false;
      return isLinkTemporallyVisible(source, target, currentYear, temporalMode);
    }).length;
  }, [
    activeRelationTypes,
    activeTiers,
    currentYear,
    graphData.links,
    nodeMap,
    temporalMode,
    visibleNodeIds,
  ]);

  // Scroll selected row into view if needed
  useEffect(() => {
    if (selectedNodeId && selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedNodeId]);

  return (
    <div
      className={`list-view-container ${className}`.trim()}
      role="region"
      aria-label="Accessible traditions and relations list view"
    >
      <div className="list-view__header-bar">
        <div className="list-view__status-info">
          <span className="list-view__status-count">
            <strong>{displayedTraditions.length}</strong> traditions
            {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ''}
          </span>
          <span className="list-view__status-divider">·</span>
          <span className="list-view__status-relations">
            <strong>{totalVisibleRelations}</strong> visible relations
          </span>
          <span className="list-view__status-divider">·</span>
          <span className="list-view__status-year">
            Year {formatYearLabel(currentYear)} ({temporalMode} mode)
          </span>
        </div>
      </div>

      <div className="list-view__table-wrapper">
        <table className="list-view-table">
          <caption className="sr-only">
            Traditions and relations tabular view: {displayedTraditions.length} traditions
            and {totalVisibleRelations} relations matching active filters at year {formatYearLabel(currentYear)} in {temporalMode} mode.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="list-view__th list-view__th--tradition">
                Tradition
              </th>
              <th scope="col" className="list-view__th list-view__th--cluster">
                Cluster
              </th>
              <th scope="col" className="list-view__th list-view__th--era">
                Era / Origin
              </th>
              <th scope="col" className="list-view__th list-view__th--tier">
                Epistemic Tier
              </th>
              <th scope="col" className="list-view__th list-view__th--geo">
                Geographic Origin
              </th>
              <th scope="col" className="list-view__th list-view__th--relations">
                Relations
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedTraditions.length === 0 ? (
              <tr>
                <td colSpan={6} className="list-view__empty-cell">
                  <div className="list-view__empty-state">
                    <strong>No traditions match the active filters</strong>
                    <p>
                      {searchQuery.trim()
                        ? `No traditions match “${searchQuery.trim()}” at year ${formatYearLabel(currentYear)}.`
                        : `Adjust the timeline year (${formatYearLabel(currentYear)}), temporal mode (${temporalMode}), or tier filters to show traditions.`}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedTraditions.map((tradition: GraphNode) => {
                const isSelected = selectedNodeId === tradition.id;
                const tierOpt = TIER_OPTIONS_MAP.get(tradition.epistemicTier);
                const relations = relationsByNodeId.get(tradition.id) ?? [];
                const extinct = isNodeExtinct(tradition, currentYear);
                const placeName =
                  tradition.origin_geo?.place_name ||
                  tradition.originGeo?.place_name ||
                  '—';

                return (
                  <tr
                    key={tradition.id}
                    ref={isSelected ? selectedRowRef : null}
                    className={`list-view__row${isSelected ? ' is-selected' : ''}`}
                    aria-selected={isSelected}
                  >
                    <td className="list-view__td list-view__td--tradition">
                      <button
                        type="button"
                        className="list-view__select-btn"
                        onClick={() => onSelectNode(tradition.id)}
                        aria-pressed={isSelected}
                        aria-label={`Select tradition ${tradition.title}`}
                      >
                        <span
                          className="list-view__cluster-dot"
                          style={{ backgroundColor: tradition.color }}
                          aria-hidden="true"
                        />
                        <span className="list-view__tradition-title">
                          {tradition.title}
                        </span>
                        {tradition.aliases && tradition.aliases.length > 0 && (
                          <span className="list-view__tradition-aliases">
                            ({tradition.aliases.slice(0, 2).join(', ')})
                          </span>
                        )}
                      </button>
                    </td>

                    <td className="list-view__td list-view__td--cluster">
                      <span
                        className="list-view__cluster-badge"
                        style={{
                          borderColor: `${tradition.color}66`,
                          color: tradition.color,
                        }}
                      >
                        {tradition.cluster}
                      </span>
                    </td>

                    <td className="list-view__td list-view__td--era">
                      <span className="list-view__era-text">
                        {tradition.eraStart ||
                          formatYearLabel(tradition.origin_year ?? tradition.originYear ?? 0)}
                      </span>
                      {extinct && (
                        <span className="list-view__extinct-badge">
                          Extinct ({formatYearLabel(tradition.extinct_year ?? tradition.extinctYear ?? 0)})
                        </span>
                      )}
                    </td>

                    <td className="list-view__td list-view__td--tier">
                      <span
                        className="list-view__tier-badge"
                        style={{
                          borderColor: `${tierOpt?.color ?? '#45d6a7'}55`,
                          color: tierOpt?.color ?? '#45d6a7',
                        }}
                      >
                        {tierOpt?.shortLabel ?? formatTaxonomyLabel(tradition.epistemicTier)}
                      </span>
                    </td>

                    <td className="list-view__td list-view__td--geo">
                      <span className="list-view__geo-text">{placeName}</span>
                    </td>

                    <td className="list-view__td list-view__td--relations">
                      {relations.length === 0 ? (
                        <span className="list-view__no-relations">None in active view</span>
                      ) : (
                        <ul
                          className="list-view__relations-list"
                          aria-label={`Relations for ${tradition.title}`}
                        >
                          {relations.map((rel) => (
                            <li key={rel.id} className="list-view__relation-item">
                              <span
                                className={`list-view__relation-dir list-view__relation-dir--${rel.direction}`}
                                title={rel.direction === 'outbound' ? 'Outgoing relation' : 'Incoming relation'}
                                aria-label={rel.direction === 'outbound' ? 'Outgoing' : 'Incoming'}
                              >
                                {rel.direction === 'outbound' ? '→' : '←'}
                              </span>

                              <span
                                className="list-view__relation-type"
                                style={{ color: rel.typeColor }}
                              >
                                {rel.typeLabel}
                              </span>

                              <button
                                type="button"
                                className="list-view__relation-target-btn"
                                onClick={() => onSelectNode(rel.otherNodeId)}
                                title={`Navigate to ${rel.otherNodeTitle}`}
                                aria-label={`View related tradition ${rel.otherNodeTitle}`}
                              >
                                {rel.otherNodeTitle}
                              </button>

                              <span
                                className="list-view__relation-certainty"
                                style={{ color: rel.certaintyColor }}
                                title={`Certainty: ${rel.certaintyLabel}`}
                              >
                                {rel.certaintyLabel}
                              </span>

                              {rel.citation ? (
                                <span
                                  className="list-view__citation-badge list-view__citation-badge--cited"
                                  title={`Citation: ${rel.citation}`}
                                >
                                  Cited
                                </span>
                              ) : (
                                <span className="list-view__citation-badge list-view__citation-badge--uncited">
                                  Uncited
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListView;
