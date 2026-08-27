/* SPDX-License-Identifier: AGPL-3.0-or-later OR LicenseRef-OpenGrail-Commercial */
/* See LICENSE and LICENSE-COMMERCIAL.md for the applicable terms. */

import {
  LocateFixed,
  Minus,
  Move,
  Network,
  Orbit,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import DocumentPane from './components/DocumentPane';
import FilterBar from './components/FilterBar';
import GraphCanvas, {
  type GraphCanvasHandle,
} from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import TimelineScrubber from './components/TimelineScrubber';
import ViewSwitcher from './components/ViewSwitcher';
import WorldMapView from './components/WorldMapView';
import AtlasProvider, { useAtlasState } from './state/AtlasState';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clusterLayout, setClusterLayout] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);

  const {
    currentYear,
    viewMode,
    selectedNodeId,
    selectedLinkId,
    selectNode: contextSelectNode,
    selectLink: contextSelectLink,
    clearSelection,
    searchQuery,
    setSearchQuery,
    activeTiers,
    toggleTier,
    activeRelationTypes,
    toggleRelationType,
    resetFilters,
  } = useAtlasState();

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
    () => new Set(
      graphData.nodes
        .filter((node) => activeTiers.has(node.epistemicTier) && (node.origin_year ?? node.originYear ?? 0) <= currentYear)
        .map((node) => node.id),
    ),
    [activeTiers, currentYear, graphData.nodes],
  );

  const visibleLinkCount = useMemo(
    () => graphData.links.filter((link) => {
      if (!visibleNodeIds.has(link.source) || !visibleNodeIds.has(link.target)) return false;
      if (!activeTiers.has(link.certainty) || !activeRelationTypes.has(link.type)) return false;
      const srcNode = nodeById.get(link.source);
      const tgtNode = nodeById.get(link.target);
      const srcYear = srcNode?.origin_year ?? srcNode?.originYear ?? 0;
      const tgtYear = tgtNode?.origin_year ?? tgtNode?.originYear ?? 0;
      return Math.max(srcYear, tgtYear) <= currentYear;
    }).length,
    [activeRelationTypes, activeTiers, currentYear, graphData.links, nodeById, visibleNodeIds],
  );

  const searchMatches = useMemo(() => {
    const normalized = searchQuery.trim().toLocaleLowerCase();
    if (!normalized) return [];
    return graphData.nodes
      .filter((node) => scoreGraphNodeSearch(node, normalized) > 0)
      .sort((left, right) => {
        const scoreDelta = scoreGraphNodeSearch(right, normalized) -
          scoreGraphNodeSearch(left, normalized);
        return scoreDelta || left.title.localeCompare(right.title);
      })
      .slice(0, 6);
  }, [graphData.nodes, searchQuery]);

  const selectNode = useCallback((nodeId: string | null) => {
    contextSelectNode(nodeId);
    if (nodeId) {
      setDocumentOpen(true);
      setSearchFocused(false);
      window.requestAnimationFrame(() => graphRef.current?.centerNode(nodeId));
    }
  }, [contextSelectNode]);

  const selectLink = useCallback((linkId: string | null) => {
    contextSelectLink(linkId);
    if (linkId) {
      setDocumentOpen(true);
    }
  }, [contextSelectLink]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const match = searchMatches[0];
    if (!match) return;
    selectNode(match.id);
    setSearchFocused(false);
  };

  return (
    <div className="app-shell">
      <Sidebar
        nodes={graphData.nodes}
        clusters={graphData.clusters}
        selectedNodeId={selectedNodeId}
        onSelectNode={(id) => selectNode(id)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
      />

      <main className="atlas-workspace">
        <header className="topbar">
          <div className="topbar__context">
            <span className="topbar__eyebrow">
              <Network size={13} aria-hidden="true" />
              Comparative Religion Atlas
            </span>
            <div className="topbar__title-row">
              <h1>Historical &amp; theological relations</h1>
              <span className="live-status"><span aria-hidden="true" />Synchronized atlas</span>
            </div>
            <p>
              Showing {visibleNodeIds.size} of {graphData.nodes.length} traditions ·{' '}
              {visibleLinkCount} of {graphData.links.length} relations
            </p>
          </div>

          <div className="topbar__tools">
            <ViewSwitcher />

            {viewMode === 'brain' && (
              <>
                <div className="tool-group" aria-label="Zoom controls">
                  <span className="tool-group__label">Zoom</span>
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
                  <span className="tool-group__label">Pan</span>
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
                  <span className="tool-group__label">Layout</span>
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

            <form className="graph-search" role="search" onSubmit={submitSearch}>
              <label htmlFor="graph-search-input">Search atlas</label>
              <div className="graph-search__field">
                <Search size={15} aria-hidden="true" />
                <input
                  id="graph-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                  placeholder="Find a tradition or text…"
                  autoComplete="off"
                  spellCheck="false"
                />
                {searchQuery && (
                  <button
                    className="graph-search__clear"
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear graph search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {searchFocused && searchQuery.trim() && (
                <div className="search-results">
                  {searchMatches.length > 0 ? searchMatches.map((node) => (
                    <button key={node.id} type="button" onMouseDown={() => selectNode(node.id)}>
                      <span className="search-results__dot" style={{ backgroundColor: node.color }} />
                      <span>
                        <strong>{node.title}</strong>
                        <small>{node.cluster} · {node.eraStart}</small>
                      </span>
                    </button>
                  )) : (
                    <p>No traditions match “{searchQuery.trim()}”.</p>
                  )}
                </div>
              )}
            </form>
          </div>
        </header>

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

        <section className="graph-stage" aria-label="Interactive relation stage">
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
            <WorldMapView graphData={graphData} />
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

          {loadState === 'ready' && (
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
            </div>
          )}

          <DocumentPane
            selectedNode={selectedNode}
            selectedLink={selectedLink}
            nodes={graphData.nodes}
            links={graphData.links}
            open={documentOpen && Boolean(selectedNode || selectedLink)}
            onClose={() => {
              setDocumentOpen(false);
              clearSelection();
            }}
            onSelectNode={(id) => selectNode(id)}
          />
        </section>

        <TimelineScrubber />
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

