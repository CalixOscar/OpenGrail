/* SPDX-License-Identifier: MIT */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

function parseHash(hash: string): { nodeId: string | null; view: ViewMode | null } {
  if (typeof window === 'undefined') return { nodeId: null, view: null };
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) return { nodeId: null, view: null };

  const params = new URLSearchParams(clean);
  const nodeId = params.get('tradition') || params.get('node') || null;
  const viewParam = params.get('view');
  const view = (viewParam === 'brain' || viewParam === 'map') ? (viewParam as ViewMode) : null;

  if (!nodeId && !view) {
    if (clean === 'map' || clean === 'brain') {
      return { nodeId: null, view: clean as ViewMode };
    }
    return { nodeId: clean, view: null };
  }

  return { nodeId, view };
}

function syncHash(nodeId: string | null, view: ViewMode) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  if (nodeId) params.set('tradition', nodeId);
  if (view !== 'brain') params.set('view', view);

  const queryString = params.toString();
  const newHash = queryString ? `#${queryString}` : '';
  const currentUrl = `${window.location.pathname}${window.location.search}`;

  if (window.location.hash !== newHash) {
    window.history.replaceState(null, '', newHash ? `${currentUrl}${newHash}` : currentUrl);
  }
}

export function AtlasProvider({
  children,
  initialYear = new Date().getFullYear(),
}: AtlasProviderProps) {
  const initialHash = typeof window !== 'undefined' ? parseHash(window.location.hash) : { nodeId: null, view: null };

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [viewMode, setViewMode] = useState<ViewMode>(initialHash.view ?? 'brain');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialHash.nodeId);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLabelsVisible, setSearchLabelsVisible] = useState<boolean>(true);

  // Synchronize state when URL hash changes externally (e.g. browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const { nodeId, view } = parseHash(window.location.hash);
      setSelectedNodeId(nodeId);
      if (nodeId) setSelectedLinkId(null);
      if (view) setViewMode(view);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Synchronize URL hash when node selection or viewMode changes
  useEffect(() => {
    syncHash(selectedNodeId, viewMode);
  }, [selectedNodeId, viewMode]);

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
