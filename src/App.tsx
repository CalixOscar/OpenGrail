/* SPDX-License-Identifier: MIT */

import {
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Layers,
  LocateFixed,
  Menu,
  Minus,
  Move,
  Orbit,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ComparisonModal from './components/ComparisonModal';
import DocumentPane from './components/DocumentPane';
import FilterBar from './components/FilterBar';
import GraphCanvas, {
  type GraphCanvasHandle,
} from './components/GraphCanvas';
import ListView from './components/ListView';
import SearchCombobox from './components/SearchCombobox';
import Sidebar from './components/Sidebar';
import TimelineScrubber from './components/TimelineScrubber';
import ViewSwitcher from './components/ViewSwitcher';
import WorldMapView from './components/WorldMapView';
import AtlasProvider, { useAtlasState } from './state/AtlasState';
import {
  isLinkTemporallyVisible,
  isNodeTemporallyVisible,
} from './state/temporalVisibility';
import {
  scoreGraphNodeSearch,
  type GraphData,
} from './types/graph';

const EMPTY_GRAPH: GraphData = { nodes: [], links: [], clusters: [] };

function isGraphData(value: unknown): value is GraphData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GraphData>;
  return (
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.links) &&
    Array.isArray(candidate.clusters)
  );
}

function AppContent() {
  const graphRef = useRef<GraphCanvasHandle>(null);
  const [graphData, setGraphData] = useState<GraphData>(EMPTY_GRAPH);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [documentOpen, setDocumentOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTimelineOpen, setMobileTimelineOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [clusterLayout, setClusterLayout] = useState(true);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [legendVisible, setLegendVisible] = useState(() => {
    try {
      return localStorage.getItem('opengrail_cluster_legend_shown') === 'true';
    } catch {
      return false;
    }
  });
  const searchLabelTimerRef = useRef<number | null>(null);

  const handleToggleLegend = useCallback(() => {
    setLegendVisible((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.setItem('opengrail_cluster_legend_shown', 'true');
        } else {
          localStorage.removeItem('opengrail_cluster_legend_shown');
        }
      } catch {
        // Ignore in private browsing mode
      }
      return next;
    });
  }, []);

  const handleDismissLegend = useCallback(() => {
    setLegendVisible(false);
    try {
      localStorage.removeItem('opengrail_cluster_legend_shown');
    } catch {
      // Ignore in private browsing mode
    }
  }, []);

  const {
    currentYear,
    temporalMode,
    viewMode,
    selectedNodeId,
    selectedLinkId,
    compareNodeId,
    setCompareNodeId,
    clearComparison,
    swapComparison,
    selectNode: contextSelectNode,
    selectLink: contextSelectLink,
    clearSelection,
    searchQuery,
    setSearchQuery,
    setSearchLabelsVisible,
    activeTiers,
    toggleTier,
    activeRelationTypes,
    toggleRelationType,
    resetFilters,
  } = useAtlasState();

  const nodeA = useMemo(
    () => graphData.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [graphData.nodes, selectedNodeId],
  );

  const nodeB = useMemo(
    () => graphData.nodes.find((n) => n.id === compareNodeId) ?? null,
    [compareNodeId, graphData.nodes],
  );

  const isComparisonActive = comparisonModalOpen || Boolean(selectedNodeId && compareNodeId);

  const SEARCH_LABEL_HIDE_DELAY = 4000; // ms before search labels auto-fade

  const resetSearchLabelTimer = useCallback(() => {
    if (searchLabelTimerRef.current !== null) {
      window.clearTimeout(searchLabelTimerRef.current);
      searchLabelTimerRef.current = null;
    }
    setSearchLabelsVisible(true);
    if (searchQuery.trim()) {
      searchLabelTimerRef.current = window.setTimeout(() => {
        setSearchLabelsVisible(false);
        searchLabelTimerRef.current = null;
      }, SEARCH_LABEL_HIDE_DELAY);
    }
  }, [searchQuery, setSearchLabelsVisible]);

  // Auto-hide search labels after a delay when the query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      // No query — clear any pending timer, labels irrelevant
      if (searchLabelTimerRef.current !== null) {
        window.clearTimeout(searchLabelTimerRef.current);
        searchLabelTimerRef.current = null;
      }
      return;
    }
    // Query changed — show labels and start the countdown
    setSearchLabelsVisible(true);
    searchLabelTimerRef.current = window.setTimeout(() => {
      setSearchLabelsVisible(false);
      searchLabelTimerRef.current = null;
    }, SEARCH_LABEL_HIDE_DELAY);
    return () => {
      if (searchLabelTimerRef.current !== null) {
        window.clearTimeout(searchLabelTimerRef.current);
        searchLabelTimerRef.current = null;
      }
    };
  }, [searchQuery, setSearchLabelsVisible]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGraph() {
      try {
        const graphUrl = `${import.meta.env.BASE_URL}graph.json`;
        const response = await fetch(graphUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`Graph request failed (${response.status})`);
        const payload: unknown = await response.json();
        if (!isGraphData(payload)) throw new Error('graph.json has an invalid shape');
        setGraphData(payload);
        setLoadState('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load the atlas');
        setLoadState('error');
      }
    }

    void loadGraph();
    return () => controller.abort();
  }, []);

  const nodeById = useMemo(
    () => new Map(graphData.nodes.map((node) => [node.id, node])),
    [graphData.nodes],
  );

  const linkById = useMemo(
    () => new Map(graphData.links.map((link) => [link.id, link])),
    [graphData.links],
  );

  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) ?? null : null;
  const selectedLink = selectedLinkId ? linkById.get(selectedLinkId) ?? null : null;

  const visibleNodeIds = useMemo(
    () =>
      new Set(
        graphData.nodes
          .filter(
            (node) =>
              activeTiers.has(node.epistemicTier) &&
              isNodeTemporallyVisible(node, currentYear, temporalMode),
          )
          .map((node) => node.id),
      ),
    [activeTiers, currentYear, graphData.nodes, temporalMode],
  );

  const visibleLinkCount = useMemo(
    () =>
      graphData.links.filter((link) => {
        if (!visibleNodeIds.has(link.source) || !visibleNodeIds.has(link.target)) return false;
        if (!activeTiers.has(link.certainty) || !activeRelationTypes.has(link.type)) return false;
        const srcNode = nodeById.get(link.source);
        const tgtNode = nodeById.get(link.target);
        return isLinkTemporallyVisible(srcNode, tgtNode, currentYear, temporalMode);
      }).length,
    [activeRelationTypes, activeTiers, currentYear, graphData.links, nodeById, temporalMode, visibleNodeIds],
  );

  const searchMatches = useMemo(() => {
    const normalized = searchQuery.trim().toLocaleLowerCase();
    if (!normalized) return [];
    return graphData.nodes
      .filter((node) => visibleNodeIds.has(node.id) && scoreGraphNodeSearch(node, normalized) > 0)
      .sort((left, right) => {
        const scoreDelta =
          scoreGraphNodeSearch(right, normalized) - scoreGraphNodeSearch(left, normalized);
        return scoreDelta || left.title.localeCompare(right.title);
      })
      .slice(0, 6);
  }, [graphData.nodes, searchQuery, visibleNodeIds]);

  const selectNode = useCallback((nodeId: string | null) => {
    contextSelectNode(nodeId);
    if (nodeId) {
      setDocumentOpen(true);
      window.requestAnimationFrame(() => graphRef.current?.centerNode(nodeId));
    }
  }, [contextSelectNode]);

  const selectLink = useCallback((linkId: string | null) => {
    contextSelectLink(linkId);
    if (linkId) {
      setDocumentOpen(true);
    }
  }, [contextSelectLink]);

  useEffect(() => {
    if (selectedNodeId || selectedLinkId) {
      setDocumentOpen(true);
    }
  }, [selectedNodeId, selectedLinkId]);

  return (
    <div className="app-shell">
      <div className={`sidebar-wrapper ${mobileSidebarOpen ? 'sidebar-wrapper--mobile-open' : ''}`}>
        <Sidebar
          nodes={graphData.nodes}
          clusters={graphData.clusters}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => {
            selectNode(id);
            setMobileSidebarOpen(false);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        />
      </div>

      {mobileSidebarOpen && (
        <div
          className="sidebar-backdrop sidebar-backdrop--visible"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <main className="atlas-workspace">
        <header className="topbar">
          <div className="topbar__mobile-header">
            <button
              type="button"
              className="icon-button mobile-menu-btn"
              onClick={() => setMobileSidebarOpen((v) => !v)}
              aria-label="Toggle traditions menu"
            >
              <Menu size={18} />
            </button>
            <span className="mobile-app-title">OpenGrail</span>
          </div>

          <div className="topbar__context">
            <h1>OpenGrail</h1>
            <p>
              Showing {visibleNodeIds.size} of {graphData.nodes.length} traditions ·{' '}
              {visibleLinkCount} of {graphData.links.length} relations
            </p>
          </div>

          <div className="topbar__tools">
            <div className="tool-group tool-group--layers" aria-label="Layers and visibility toggles">
              <div className="tool-group__buttons layer-buttons">
                <button
                  className={`layer-toggle-btn${showFilters ? ' layer-toggle-btn--active' : ''}`}
                  type="button"
                  onClick={() => setShowFilters((value) => !value)}
                  aria-pressed={showFilters}
                  title="Toggle filter bar"
                >
                  <SlidersHorizontal size={15} />
                  <span>Filters</span>
                </button>
                <button
                  className={`layer-toggle-btn${showTimeline ? ' layer-toggle-btn--active' : ''}`}
                  type="button"
                  onClick={() => setShowTimeline((value) => !value)}
                  aria-pressed={showTimeline}
                  title="Toggle timeline scrubber"
                >
                  <Calendar size={15} />
                  <span>Timeline</span>
                </button>
                <button
                  className={`layer-toggle-btn${legendVisible ? ' layer-toggle-btn--active' : ''}`}
                  type="button"
                  onClick={handleToggleLegend}
                  aria-pressed={legendVisible}
                  title="Toggle cluster legend"
                >
                  <Layers size={15} />
                  <span>Legend</span>
                </button>
              </div>
            </div>

            <ViewSwitcher />

            <div className="tool-group tool-group--compare" aria-label="Comparison mode">
              <button
                className={`layer-toggle-btn${isComparisonActive ? ' layer-toggle-btn--active' : ''}`}
                type="button"
                onClick={() => {
                  if (!selectedNodeId && graphData.nodes.length > 0) {
                    selectNode('stoicism');
                  }
                  setComparisonModalOpen(true);
                }}
                aria-pressed={isComparisonActive}
                title="Compare traditions side-by-side"
              >
                <ArrowLeftRight size={15} />
                <span>Compare</span>
              </button>
            </div>

            {viewMode === 'brain' && (
              <>
                <div className="tool-group" aria-label="Zoom controls">
                  <div className="tool-group__buttons">
                    <button type="button" onClick={() => graphRef.current?.zoomIn()} title="Zoom in" aria-label="Zoom in">
                      <Plus size={15} />
                    </button>
                    <button type="button" onClick={() => graphRef.current?.zoomOut()} title="Zoom out" aria-label="Zoom out">
                      <Minus size={15} />
                    </button>
                    <button type="button" onClick={() => graphRef.current?.fit()} title="Fit graph" aria-label="Fit graph">
                      <LocateFixed size={15} />
                    </button>
                  </div>
                </div>

                <div className="tool-group">
                  <button
                    className="cluster-toggle"
                    type="button"
                    onClick={() => graphRef.current?.resetView()}
                    title="Reset pan and zoom"
                  >
                    <Move size={15} />
                    Reset
                  </button>
                </div>

                <div className="tool-group">
                  <button
                    className={`cluster-toggle${clusterLayout ? ' cluster-toggle--active' : ''}`}
                    type="button"
                    onClick={() => setClusterLayout((value) => !value)}
                    aria-pressed={clusterLayout}
                    title="Toggle cluster layout"
                  >
                    <Orbit size={15} />
                    Cluster
                  </button>
                </div>
              </>
            )}

            <SearchCombobox
              id="graph-search-input"
              variant="header"
              label="Search atlas"
              placeholder="Find a tradition or text…"
              query={searchQuery}
              onQueryChange={(value) => {
                setSearchQuery(value);
                resetSearchLabelTimer();
              }}
              matches={searchMatches}
              onSelect={(node) => selectNode(node.id)}
              onMouseEnter={resetSearchLabelTimer}
              onMouseLeave={() => {
                if (searchQuery.trim()) {
                  if (searchLabelTimerRef.current !== null) {
                    window.clearTimeout(searchLabelTimerRef.current);
                  }
                  searchLabelTimerRef.current = window.setTimeout(() => {
                    setSearchLabelsVisible(false);
                    searchLabelTimerRef.current = null;
                  }, SEARCH_LABEL_HIDE_DELAY);
                }
              }}
              onFocus={resetSearchLabelTimer}
            />
          </div>
        </header>

        {showFilters && (
          <div className="filter-bar-wrapper">
            <FilterBar
              activeTiers={activeTiers}
              activeRelationTypes={activeRelationTypes}
              onToggleTier={toggleTier}
              onToggleRelationType={toggleRelationType}
              onReset={resetFilters}
              visibleNodeCount={visibleNodeIds.size}
              totalNodeCount={graphData.nodes.length}
              visibleLinkCount={visibleLinkCount}
              totalLinkCount={graphData.links.length}
            />
          </div>
        )}

        <section className="graph-stage" aria-label="Interactive relation stage">
          <div className="stage-watermark" aria-hidden="true">
            <span className="stage-watermark__title">OpenGrail</span>
            <span className="stage-watermark__byline">by calmdownoscar</span>
          </div>

          {loadState === 'ready' && viewMode === 'brain' && (
            <GraphCanvas
              ref={graphRef}
              graphData={graphData}
              selectedNodeId={selectedNodeId}
              selectedLinkId={selectedLinkId}
              onSelectNode={(nodeId) => selectNode(nodeId)}
              onSelectLink={(linkId) => selectLink(linkId)}
              activeTiers={activeTiers}
              activeRelationTypes={activeRelationTypes}
              searchQuery={searchQuery}
              clusterLayout={clusterLayout}
              currentYear={currentYear}
            />
          )}

          {loadState === 'ready' && viewMode === 'map' && (
            <WorldMapView
              graphData={graphData}
              onSelectNode={(nodeId) => selectNode(nodeId)}
            />
          )}

          {loadState === 'ready' && viewMode === 'list' && (
            <ListView
              graphData={graphData}
              onSelectNode={(nodeId) => selectNode(nodeId)}
            />
          )}

          {loadState === 'loading' && (
            <div className="graph-state graph-state--loading" role="status">
              <div className="graph-state__orbit" aria-hidden="true">
                <span /><span /><span />
              </div>
              <h2>Mapping traditions</h2>
              <p>Parsing documents and resolving their relations…</p>
            </div>
          )}

          {loadState === 'error' && (
            <div className="graph-state graph-state--error" role="alert">
              <Sparkles size={24} aria-hidden="true" />
              <h2>The atlas could not be opened</h2>
              <p>{loadError}</p>
              <p className="graph-state__hint">Run <code>npm run build:graph</code> and refresh this page.</p>
            </div>
          )}

          {loadState === 'ready' && viewMode !== 'list' && legendVisible && (
            <div className="cluster-legend" aria-label="Cluster legend">
              <span
                className="cluster-legend__size-note"
                title="Node size combines editorial hierarchy with graph connections; it does not estimate adherent population."
              >
                <i className="cluster-legend__size-dot" />
                Size: prominence + links
              </span>
              {graphData.clusters.map((cluster) => {
                const color = graphData.nodes.find((node) => node.cluster === cluster)?.color ?? '#94a3b8';
                return (
                  <span key={cluster}>
                    <i style={{ backgroundColor: color, boxShadow: `0 0 9px ${color}` }} />
                    {cluster}
                  </span>
                );
              })}
              <button
                type="button"
                className="cluster-legend__dismiss"
                onClick={handleDismissLegend}
                aria-label="Dismiss cluster legend"
                title="Dismiss cluster legend"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </div>
          )}

          <DocumentPane
            selectedNode={selectedNode}
            selectedLink={selectedLink}
            nodes={graphData.nodes}
            links={graphData.links}
            open={documentOpen && Boolean(selectedNode || selectedLink) && !isComparisonActive}
            onClose={() => {
              setDocumentOpen(false);
              clearSelection();
            }}
            onSelectNode={(id) => selectNode(id)}
            onCompare={(id) => {
              selectNode(id);
              setComparisonModalOpen(true);
            }}
          />

          <ComparisonModal
            nodeA={nodeA}
            nodeB={nodeB}
            nodes={graphData.nodes}
            links={graphData.links}
            open={isComparisonActive}
            onClose={() => {
              setComparisonModalOpen(false);
              clearComparison();
            }}
            onSelectNodeA={(id) => selectNode(id)}
            onSelectNodeB={(id) => setCompareNodeId(id)}
            onSwap={swapComparison}
          />
        </section>

        {showTimeline && (
          <div className={`timeline-wrapper ${mobileTimelineOpen ? 'timeline-wrapper--open' : ''}`}>
            <TimelineScrubber />
          </div>
        )}

        {/* Mobile Bottom Navigation Menu Bar */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <button
            type="button"
            className={`mobile-nav-item ${mobileSidebarOpen ? 'mobile-nav-item--active' : ''}`}
            onClick={() => setMobileSidebarOpen((v) => !v)}
          >
            <Menu size={18} />
            <span>Browse</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-item ${showFilters ? 'mobile-nav-item--active' : ''}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-item ${isComparisonActive ? 'mobile-nav-item--active' : ''}`}
            onClick={() => {
              if (!selectedNodeId && graphData.nodes.length > 0) {
                selectNode('stoicism');
              }
              setComparisonModalOpen(true);
            }}
          >
            <ArrowLeftRight size={18} />
            <span>Compare</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-item ${mobileTimelineOpen ? 'mobile-nav-item--active' : ''}`}
            onClick={() => {
              setMobileTimelineOpen((v) => !v);
              setShowTimeline(true);
            }}
          >
            <Calendar size={18} />
            <span>Timeline</span>
          </button>

          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => {
              const input = document.getElementById('graph-search-input') as HTMLInputElement | null;
              input?.focus();
            }}
          >
            <Search size={18} />
            <span>Search</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-item ${documentOpen ? 'mobile-nav-item--active' : ''}`}
            onClick={() => {
              if (selectedNode || selectedLink) {
                setDocumentOpen((v) => !v);
              } else if (graphData.nodes.length > 0) {
                selectNode(graphData.nodes[0].id);
              }
            }}
          >
            <BookOpen size={18} />
            <span>Details</span>
          </button>
        </nav>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AtlasProvider>
      <AppContent />
    </AtlasProvider>
  );
}

