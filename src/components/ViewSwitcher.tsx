/* SPDX-License-Identifier: MIT */

import { Globe2, List, Network } from 'lucide-react';
import { useAtlasState } from '../state/AtlasState';

export interface ViewSwitcherProps {
  className?: string;
  variant?: 'bar' | 'rail';
}

export function ViewSwitcher({ className = '', variant = 'bar' }: ViewSwitcherProps) {
  const { viewMode, setViewMode } = useAtlasState();
  const isRail = variant === 'rail';

  return (
    <div
      className={`view-switcher ${isRail ? 'view-switcher--rail' : ''} ${className}`.trim()}
      role="group"
      aria-label="Atlas view switcher"
    >
      <button
        type="button"
        className={`view-switcher__btn${viewMode === 'brain' ? ' is-active' : ''}`}
        onClick={() => setViewMode('brain')}
        aria-pressed={viewMode === 'brain'}
        aria-label="Brain Cluster"
        title="Brain cluster network view"
      >
        <Network size={isRail ? 17 : 14} aria-hidden="true" />
        {!isRail && <span>Brain Cluster</span>}
      </button>

      <button
        type="button"
        className={`view-switcher__btn${viewMode === 'map' ? ' is-active' : ''}`}
        onClick={() => setViewMode('map')}
        aria-pressed={viewMode === 'map'}
        aria-label="World Map"
        title="3D World Map geographic view"
      >
        <Globe2 size={isRail ? 17 : 14} aria-hidden="true" />
        {!isRail && <span>World Map</span>}
      </button>

      <button
        type="button"
        className={`view-switcher__btn${viewMode === 'list' ? ' is-active' : ''}`}
        onClick={() => setViewMode('list')}
        aria-pressed={viewMode === 'list'}
        aria-label="List View"
        title="Accessible tabular list view"
      >
        <List size={isRail ? 17 : 14} aria-hidden="true" />
        {!isRail && <span>List View</span>}
      </button>
    </div>
  );
}

export default ViewSwitcher;
