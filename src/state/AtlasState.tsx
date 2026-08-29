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
  DEFAULT_TEMPORAL_MODE,
  type TemporalMode,
} from './temporalVisibility';
import {
  EPISTEMIC_TIERS,
  RELATION_TYPES,
  type EpistemicTier,
  type RelationType,
} from '../types/graph';

export type ViewMode = 'brain' | 'map' | 'list';
export type { TemporalMode } from './temporalVisibility';

export interface AtlasStateContextValue {
  currentYear: number;
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  temporalMode: TemporalMode;
  setTemporalMode: React.Dispatch<React.SetStateAction<TemporalMode>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedNodeId: string | null;
  selectedLinkId: string | null;
  compareNodeId: string | null;
  setCompareNodeId: (nodeId: string | null) => void;
  startComparison: (nodeAId: string, nodeBId?: string | null) => void;
  clearComparison: () => void;
  swapComparison: () => void;
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

function parseHash(hash: string): {
  nodeId: string | null;
  compareId: string | null;
  view: ViewMode | null;
} {
  if (typeof window === 'undefined') return { nodeId: null, compareId: null, view: null };
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) return { nodeId: null, compareId: null, view: null };

  const params = new URLSearchParams(clean);
  let nodeId = params.get('tradition') || params.get('node') || null;
  let compareId = params.get('compare') || null;

  if (compareId && (compareId.includes('+') || compareId.includes(',') || compareId.includes(' '))) {
    const parts = compareId.split(/[\+,\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      nodeId = parts[0];
      compareId = parts[1];
    }
  }

  const viewParam = params.get('view');
  const view = (viewParam === 'brain' || viewParam === 'map' || viewParam === 'list') ? (viewParam as ViewMode) : null;

  if (!nodeId && !compareId && !view) {
    if (clean === 'map' || clean === 'brain' || clean === 'list') {
      return { nodeId: null, compareId: null, view: clean as ViewMode };
    }
    return { nodeId: clean, compareId: null, view: null };
  }

  return { nodeId, compareId, view };
}

function syncHash(nodeId: string | null, compareId: string | null, view: ViewMode) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  if (nodeId && compareId) {
    params.set('compare', `${nodeId}+${compareId}`);
  } else if (nodeId) {
    params.set('tradition', nodeId);
  }
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
  const initialHash = typeof window !== 'undefined'
    ? parseHash(window.location.hash)
    : { nodeId: null, compareId: null, view: null };

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [temporalMode, setTemporalMode] = useState<TemporalMode>(DEFAULT_TEMPORAL_MODE);
  const [viewMode, setViewMode] = useState<ViewMode>(initialHash.view ?? 'brain');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialHash.nodeId);
  const [compareNodeId, setCompareNodeId] = useState<string | null>(initialHash.compareId);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLabelsVisible, setSearchLabelsVisible] = useState<boolean>(true);

  // Synchronize state when URL hash changes externally (e.g. browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const { nodeId, compareId, view } = parseHash(window.location.hash);
      setSelectedNodeId(nodeId);
      setCompareNodeId(compareId);
      if (nodeId || compareId) setSelectedLinkId(null);
      if (view) setViewMode(view);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Synchronize URL hash when node selection, compareNodeId, or viewMode changes
  useEffect(() => {
    syncHash(selectedNodeId, compareNodeId, viewMode);
  }, [selectedNodeId, compareNodeId, viewMode]);

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
    if (linkId) {
      setSelectedNodeId(null);
      setCompareNodeId(null);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setCompareNodeId(null);
    setSelectedLinkId(null);
  }, []);

  const startComparison = useCallback((nodeAId: string, nodeBId?: string | null) => {
    setSelectedNodeId(nodeAId);
    setCompareNodeId(nodeBId || null);
    setSelectedLinkId(null);
  }, []);

  const clearComparison = useCallback(() => {
    setCompareNodeId(null);
  }, []);

  const swapComparison = useCallback(() => {
    if (!selectedNodeId && !compareNodeId) return;
    const prevA = selectedNodeId;
    const prevB = compareNodeId;
    setSelectedNodeId(prevB);
    setCompareNodeId(prevA);
  }, [compareNodeId, selectedNodeId]);

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
      temporalMode,
      setTemporalMode,
      viewMode,
      setViewMode,
      selectedNodeId,
      selectedLinkId,
      compareNodeId,
      setCompareNodeId,
      startComparison,
      clearComparison,
      swapComparison,
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
      clearComparison,
      clearSelection,
      compareNodeId,
      currentYear,
      resetFilters,
      searchLabelsVisible,
      searchQuery,
      selectLink,
      selectNode,
      selectedLinkId,
      selectedNodeId,
      startComparison,
      swapComparison,
      temporalMode,
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
