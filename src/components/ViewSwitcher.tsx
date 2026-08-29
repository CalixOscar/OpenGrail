/* SPDX-License-Identifier: MIT */

import { Globe2, List, Network } from 'lucide-react';
import { useAtlasState } from '../state/AtlasState';

export interface ViewSwitcherProps {
  className?: string;
}

export function ViewSwitcher({ className = '' }: ViewSwitcherProps) {
  const { viewMode, setViewMode } = useAtlasState();

  return (
    <div
      className={`view-switcher ${className}`.trim()}
      role="group"
      aria-label="Atlas view switcher"
    >
      <button
        type="button"
        className={`view-switcher__btn${viewMode === 'brain' ? ' is-active' : ''}`}
        onClick={() => setViewMode('brain')}
        aria-pressed={viewMode === 'brain'}
        title="Brain cluster network view"
      >
        <Network size={14} aria-hidden="true" />
        <span>Brain Cluster</span>
      </button>

      <button
        type="button"
        className={`view-switcher__btn${viewMode === 'map' ? ' is-active' : ''}`}
        onClick={() => setViewMode('map')}
        aria-pressed={viewMode === 'map'}
        title="3D World Map geographic view"
      >
        <Globe2 size={14} aria-hidden="true" />
        <span>World Map</span>
      </button>

      <button
        type="button"
        className={`view-switcher__btn${viewMode === 'list' ? ' is-active' : ''}`}
        onClick={() => setViewMode('list')}
        aria-pressed={viewMode === 'list'}
        title="Accessible tabular list view"
      >
        <List size={14} aria-hidden="true" />
        <span>List View</span>
      </button>
    </div>
  );
}

export default ViewSwitcher;
