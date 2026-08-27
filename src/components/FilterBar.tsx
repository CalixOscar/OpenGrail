/* SPDX-License-Identifier: AGPL-3.0-or-later OR LicenseRef-OpenGrail-Commercial */
/* See LICENSE and LICENSE-COMMERCIAL.md for the applicable terms. */

import { Filter, RotateCcw } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  EPISTEMIC_TIER_OPTIONS,
  RELATION_TYPE_OPTIONS,
  type EpistemicTier,
  type RelationType,
} from '../types/graph';

export interface FilterBarProps {
  activeTiers: ReadonlySet<EpistemicTier>;
  activeRelationTypes: ReadonlySet<RelationType>;
  onToggleTier: (tier: EpistemicTier) => void;
  onToggleRelationType: (relationType: RelationType) => void;
  onReset?: () => void;
  visibleNodeCount?: number;
  totalNodeCount?: number;
  visibleLinkCount?: number;
  totalLinkCount?: number;
  className?: string;
}

function accentStyle(color: string): CSSProperties {
  return { '--filter-color': color } as CSSProperties;
}

function formatCount(visible: number | undefined, total: number | undefined): string | null {
  if (visible === undefined) return null;
  return total === undefined || total === visible
    ? String(visible)
    : `${visible}/${total}`;
}

export function FilterBar({
  activeTiers,
  activeRelationTypes,
  onToggleTier,
  onToggleRelationType,
  onReset,
  visibleNodeCount,
  totalNodeCount,
  visibleLinkCount,
  totalLinkCount,
  className = '',
}: FilterBarProps) {
  const allTiersActive = activeTiers.size === EPISTEMIC_TIER_OPTIONS.length;
  const allRelationsActive =
    activeRelationTypes.size === RELATION_TYPE_OPTIONS.length;
  const nodeCount = formatCount(visibleNodeCount, totalNodeCount);
  const linkCount = formatCount(visibleLinkCount, totalLinkCount);

  return (
    <section
      className={`filter-bar ${className}`.trim()}
      aria-label="Graph filters"
    >
      <div className="filter-bar__heading">
        <span className="filter-bar__title">
          <Filter aria-hidden="true" size={14} strokeWidth={1.8} />
          Filters
        </span>
        {(nodeCount !== null || linkCount !== null) && (
          <span className="filter-bar__counts" role="status" aria-live="polite">
            {nodeCount !== null && (
              <span>
                <strong>{nodeCount}</strong> traditions
              </span>
            )}
            {nodeCount !== null && linkCount !== null && (
              <span className="filter-bar__count-separator" aria-hidden="true">
                ·
              </span>
            )}
            {linkCount !== null && (
              <span>
                <strong>{linkCount}</strong> relations
              </span>
            )}
          </span>
        )}
        {onReset && (
          <button
            className="filter-bar__reset"
            type="button"
            onClick={onReset}
            disabled={allTiersActive && allRelationsActive}
            title="Restore all filters"
          >
            <RotateCcw aria-hidden="true" size={12} strokeWidth={1.8} />
            Reset
          </button>
        )}
      </div>

      <div className="filter-bar__groups">
        <fieldset className="filter-bar__group">
          <legend>Epistemic tier</legend>
          <div className="filter-bar__options">
            {EPISTEMIC_TIER_OPTIONS.map((option) => {
              const isActive = activeTiers.has(option.value);
              return (
                <button
                  key={option.value}
                  className={`filter-chip filter-chip--tier${
                    isActive ? ' is-active' : ''
                  }`}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onToggleTier(option.value)}
                  title={option.description}
                  style={accentStyle(option.color)}
                >
                  <span className="filter-chip__dot" aria-hidden="true" />
                  <span className="filter-chip__label">{option.label}</span>
                  <span className="filter-chip__state" aria-hidden="true">
                    {isActive ? '✓' : '×'}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="filter-bar__group filter-bar__group--relations">
          <legend>Relation type</legend>
          <div className="filter-bar__options">
            {RELATION_TYPE_OPTIONS.map((option) => {
              const isActive = activeRelationTypes.has(option.value);
              return (
                <button
                  key={option.value}
                  className={`filter-chip filter-chip--relation${
                    isActive ? ' is-active' : ''
                  }`}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onToggleRelationType(option.value)}
                  title={option.description}
                  style={accentStyle(option.color)}
                >
                  <span className="filter-chip__line" aria-hidden="true" />
                  <span className="filter-chip__label">{option.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </section>
  );
}

export default FilterBar;
