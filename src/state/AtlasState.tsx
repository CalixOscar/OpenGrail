/* SPDX-License-Identifier: AGPL-3.0-or-later OR LicenseRef-OpenGrail-Commercial */
/* See LICENSE and LICENSE-COMMERCIAL.md for the applicable terms. */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  EPISTEMIC_TIERS,
  RELATION_TYPES,
  type EpistemicTier,
  type RelationType,
} from '../types/graph';

export type ViewMode = 'brain' | 'map';

export interface AtlasStateContextValue {
  currentYear: number;
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedNodeId: string | null;
  selectedLinkId: string | null;
  selectNode: (nodeId: string | null) => void;
  selectLink: (linkId: string | null) => void;
  clearSelection: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchLabelsVisible: boolean;
  setSearchLabelsVisible: (visible: boolean) => void;
  activeTiers: Set<EpistemicTier>;
  toggleTier: (tier: EpistemicTier) => void;
  activeRelationTypes: Set<RelationType>;
  toggleRelationType: (relationType: RelationType) => void;
  resetFilters: () => void;
}

const AtlasStateContext = createContext<AtlasStateContextValue | null>(null);

export interface AtlasProviderProps {
  children: ReactNode;
  initialYear?: number;
}

export function AtlasProvider({
  children,
  initialYear = new Date().getFullYear(),
}: AtlasProviderProps) {
  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [viewMode, setViewMode] = useState<ViewMode>('brain');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLabelsVisible, setSearchLabelsVisible] = useState<boolean>(true);

  const [activeTiers, setActiveTiers] = useState<Set<EpistemicTier>>(
    () => new Set(EPISTEMIC_TIERS),
  );
  const [activeRelationTypes, setActiveRelationTypes] = useState<Set<RelationType>>(
    () => new Set(RELATION_TYPES),
  );

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) setSelectedLinkId(null);
  }, []);

  const selectLink = useCallback((linkId: string | null) => {
    setSelectedLinkId(linkId);
    if (linkId) setSelectedNodeId(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedLinkId(null);
  }, []);

  const toggleTier = useCallback((tier: EpistemicTier) => {
    setActiveTiers((current) => {
      const next = new Set(current);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }, []);

  const toggleRelationType = useCallback((relationType: RelationType) => {
    setActiveRelationTypes((current) => {
      const next = new Set(current);
      if (next.has(relationType)) next.delete(relationType);
      else next.add(relationType);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setActiveTiers(new Set(EPISTEMIC_TIERS));
    setActiveRelationTypes(new Set(RELATION_TYPES));
  }, []);

  const value = useMemo<AtlasStateContextValue>(
    () => ({
      currentYear,
      setCurrentYear,
      viewMode,
      setViewMode,
      selectedNodeId,
      selectedLinkId,
      selectNode,
      selectLink,
      clearSelection,
      searchQuery,
      setSearchQuery,
      searchLabelsVisible,
      setSearchLabelsVisible,
      activeTiers,
      toggleTier,
      activeRelationTypes,
      toggleRelationType,
      resetFilters,
    }),
    [
      activeRelationTypes,
      activeTiers,
      clearSelection,
      currentYear,
      resetFilters,
      searchLabelsVisible,
      searchQuery,
      selectLink,
      selectNode,
      selectedLinkId,
      selectedNodeId,
      toggleRelationType,
      toggleTier,
      viewMode,
    ],
  );

  return (
    <AtlasStateContext.Provider value={value}>
      {children}
    </AtlasStateContext.Provider>
  );
}

export function useAtlasState(): AtlasStateContextValue {
  const context = useContext(AtlasStateContext);
  if (!context) {
    throw new Error('useAtlasState must be used within an AtlasProvider');
  }
  return context;
}

export default AtlasProvider;
