/* SPDX-License-Identifier: MIT */

import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from 'react-force-graph-2d';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { List } from 'lucide-react';
import { useAtlasState } from '../state/AtlasState';
import {
  isLinkTemporallyVisible,
  isNodeExtinct,
  isNodeFuture,
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
  type GraphLink,
  type GraphNode,
  type RelationType,
} from '../types/graph';

type CanvasNode = NodeObject<GraphNode>;
type CanvasLink = LinkObject<GraphNode, GraphLink>;

interface Point {
  x: number;
  y: number;
}

interface CanvasGraphData {
  nodes: CanvasNode[];
  links: CanvasLink[];
}

interface CollisionMetrics {
  cellSize: number;
  radii: number[];
}

const MOCKUP_CLUSTER_ANCHORS = new Map<string, Point>([
  ['Abrahamic', { x: -290, y: -42 }],
  ['Dharmic', { x: 40, y: -96 }],
  ['East Asian', { x: 296, y: -70 }],
  ['Indigenous & Diasporic', { x: 238, y: 166 }],
  ['Iranian', { x: 126, y: -222 }],
  ['Ancient Near East', { x: -120, y: -220 }],
  ['Ancient Mediterranean', { x: -175, y: 146 }],
  ['Ancient European', { x: -326, y: 154 }],
  ['Esoteric & Modern', { x: -28, y: 218 }],
  ['Philosophical & Ethical Systems', { x: 80, y: 270 }],
  ['Speculative', { x: 344, y: 246 }],
]);

export interface GraphCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  centerNode: (nodeId: string) => void;
  resetView: () => void;
}

export interface GraphCanvasProps {
  graphData: GraphData;
  selectedNodeId: string | null;
  selectedLinkId?: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onSelectLink?: (linkId: string | null) => void;
  activeTiers: ReadonlySet<EpistemicTier>;
  activeRelationTypes: ReadonlySet<RelationType>;
  searchQuery: string;
  clusterLayout: boolean;
  currentYear?: number;
  className?: string;
}

const RELATION_COLORS = new Map<RelationType, string>(
  RELATION_TYPE_OPTIONS.map(({ value, color }) => [value, color]),
);

const TIER_COLORS = new Map<EpistemicTier, string>(
  EPISTEMIC_TIER_OPTIONS.map(({ value, color }) => [value, color]),
);

const FALLBACK_NODE_COLOR = '#7c91b7';
const FOCUS_ZOOM = 4.2;
const MIN_ZOOM = 0.28;
const MAX_ZOOM = 9;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function colorWithAlpha(color: string, alpha: number): string {
  const normalized = color.trim();
  const shortHex = /^#([\da-f])([\da-f])([\da-f])$/i.exec(normalized);
  const longHex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(normalized);

  if (shortHex) {
    const red = Number.parseInt(shortHex[1] + shortHex[1], 16);
    const green = Number.parseInt(shortHex[2] + shortHex[2], 16);
    const blue = Number.parseInt(shortHex[3] + shortHex[3], 16);
    return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha, 0, 1)})`;
  }

  if (longHex) {
    const red = Number.parseInt(longHex[1], 16);
    const green = Number.parseInt(longHex[2], 16);
    const blue = Number.parseInt(longHex[3], 16);
    return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha, 0, 1)})`;
  }

  return normalized;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function endpointId(endpoint: unknown): string | null {
  if (typeof endpoint === 'string' || typeof endpoint === 'number') {
    return String(endpoint);
  }

  if (typeof endpoint === 'object' && endpoint !== null && 'id' in endpoint) {
    const id = (endpoint as { id?: unknown }).id;
    if (typeof id === 'string' || typeof id === 'number') return String(id);
  }

  return null;
}

function nodeDegree(node: GraphNode): number {
  return node.backlinks.inbound.length + node.backlinks.outbound.length;
}

function nodeRadius(node: GraphNode): number {
  const connectionRadius = 3.8 + Math.sqrt(nodeDegree(node)) * 1.08;
  const displayWeight = clamp(node.displayWeight || 1, 0.75, 3);
  const prominenceScale = 1 + (displayWeight - 1) * 0.54;
  return clamp(connectionRadius * prominenceScale, 3.6, 22);
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function createClusterCenters(
  clusters: readonly string[],
  totalNodeCount: number,
): Map<string, Point> {
  const centers = new Map<string, Point>();
  if (clusters.length === 0) return centers;
  if (clusters.length === 1) {
    centers.set(clusters[0], { x: 0, y: 0 });
    return centers;
  }

  const orbit = clamp(
    72 + Math.sqrt(Math.max(totalNodeCount, 1)) * 18 + clusters.length * 5,
    112,
    390,
  );
  const anchorScale = clamp(Math.sqrt(Math.max(totalNodeCount, 1) / 246), 0.62, 1.08);
  clusters.forEach((cluster, index) => {
    const anchor = MOCKUP_CLUSTER_ANCHORS.get(cluster);
    if (anchor) {
      centers.set(cluster, {
        x: anchor.x * anchorScale,
        y: anchor.y * anchorScale,
      });
      return;
    }
    const angle = (index / clusters.length) * Math.PI * 2 - Math.PI / 2;
    centers.set(cluster, {
      x: Math.cos(angle) * orbit,
      y: Math.sin(angle) * orbit * 0.68,
    });
  });

  const centroid = [...centers.values()].reduce(
    (total, point) => ({
      x: total.x + point.x / centers.size,
      y: total.y + point.y / centers.size,
    }),
    { x: 0, y: 0 },
  );
  centers.forEach((point, cluster) => {
    centers.set(cluster, {
      x: point.x - centroid.x,
      y: point.y - centroid.y,
    });
  });
  return centers;
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(
  function GraphCanvas(
    {
      graphData,
      selectedNodeId,
      selectedLinkId,
      onSelectNode,
      onSelectLink,
      activeTiers,
      activeRelationTypes,
      searchQuery,
      clusterLayout,
      currentYear = new Date().getFullYear(),
      className = '',
    },
    forwardedRef,
  ) {
    const { searchLabelsVisible, temporalMode, setViewMode } = useAtlasState();
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>();
    const zoomLevelRef = useRef(1);
    const initialFitCompleteRef = useRef(false);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

    useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return undefined;

      const updateSize = () => {
        const bounds = container.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.floor(bounds.width));
        const nextHeight = Math.max(1, Math.floor(bounds.height));
        setCanvasSize((current) =>
          current.width === nextWidth && current.height === nextHeight
            ? current
            : { width: nextWidth, height: nextHeight },
        );
      };

      updateSize();
      const observer = new ResizeObserver(updateSize);
      observer.observe(container);
      return () => observer.disconnect();
    }, []);

    const rawNodeById = useMemo(
      () => new Map(graphData.nodes.map((node) => [node.id, node])),
      [graphData.nodes],
    );

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

    const visibleClusters = useMemo(() => {
      const available = new Set(
        graphData.nodes
          .filter((node) => visibleNodeIds.has(node.id))
          .map((node) => node.cluster),
      );
      const ordered = graphData.clusters.filter((cluster) => available.has(cluster));
      const known = new Set(ordered);
      graphData.nodes.forEach((node) => {
        if (
          visibleNodeIds.has(node.id) &&
          !known.has(node.cluster)
        ) {
          ordered.push(node.cluster);
          known.add(node.cluster);
        }
      });
      return ordered;
    }, [graphData.clusters, graphData.nodes, visibleNodeIds]);

    const clusterCenters = useMemo(
      () => createClusterCenters(visibleClusters, visibleNodeIds.size),
      [visibleClusters, visibleNodeIds.size],
    );

    const clusterPlacement = useMemo(() => {
      const placement = new Map<string, { index: number; count: number }>();
      visibleClusters.forEach((cluster) => {
        const members = graphData.nodes
          .filter((node) => visibleNodeIds.has(node.id) && node.cluster === cluster)
          .sort((left, right) => (
            right.displayWeight - left.displayWeight ||
            nodeDegree(right) - nodeDegree(left) ||
            left.id.localeCompare(right.id)
          ));
        members.forEach((node, index) => placement.set(node.id, { index, count: members.length }));
      });
      return placement;
    }, [graphData.nodes, visibleClusters, visibleNodeIds]);

    const canvasGraph = useMemo<CanvasGraphData>(() => {
      const nodes: CanvasNode[] = graphData.nodes
        .filter((node) => visibleNodeIds.has(node.id))
        .map((node, index) => {
          const seed = stableHash(node.id);
          const placement = clusterPlacement.get(node.id);
          const radialIndex = placement?.index ?? index;
          const angle = radialIndex * 2.399963 + ((seed % 29) / 29) * 0.42;
          const hubSpacing = node.displayWeight >= 1.6 ? 72 : 0;
          const scatter = radialIndex === 0
            ? 0
            : 18 + Math.sqrt(radialIndex) * 22 + hubSpacing;
          const center = clusterCenters.get(node.cluster) ?? { x: 0, y: 0 };
          const freeOrbit = 44 + ((seed >>> 14) % 72);

          return {
            ...node,
            x: clusterLayout
              ? center.x + Math.cos(angle) * scatter
              : Math.cos(angle) * freeOrbit,
            y: clusterLayout
              ? center.y + Math.sin(angle) * scatter
              : Math.sin(angle) * freeOrbit * 0.72,
            index,
          };
        })
        .sort((left, right) => (
          left.displayWeight - right.displayWeight ||
          nodeDegree(left) - nodeDegree(right) ||
          left.title.localeCompare(right.title)
        ));

      const links = graphData.links
        .filter((link) => {
          if (!visibleNodeIds.has(link.source) || !visibleNodeIds.has(link.target)) return false;
          if (!activeTiers.has(link.certainty) || !activeRelationTypes.has(link.type)) return false;
          return true;
        })
        .map((link) => ({ ...link })) as CanvasLink[];

      return { nodes, links };
    }, [
      activeRelationTypes,
      activeTiers,
      clusterCenters,
      clusterLayout,
      clusterPlacement,
      graphData.links,
      graphData.nodes,
      visibleNodeIds,
    ]);

    const collisionMetrics = useMemo<CollisionMetrics>(() => {
      const radii = canvasGraph.nodes.map((node) => nodeRadius(node));
      const maximumRadius = radii.reduce(
        (maximum, radius) => Math.max(maximum, radius),
        0,
      );

      // A cell is at least as wide as the largest possible collision distance.
      // That guarantees every overlapping pair is either in the same cell or
      // one of its eight immediate neighbors.
      return {
        cellSize: Math.max(1, maximumRadius * 2 + 10),
        radii,
      };
    }, [canvasGraph.nodes]);

    const nodesById = useMemo(
      () => new Map(canvasGraph.nodes.map((node) => [node.id, node])),
      [canvasGraph.nodes],
    );

    const selectedNeighborhood = useMemo(() => {
      const neighborhood = new Set<string>();
      if (!selectedNodeId) return neighborhood;
      neighborhood.add(selectedNodeId);
      canvasGraph.links.forEach((link) => {
        const source = endpointId(link.source);
        const target = endpointId(link.target);
        if (source === selectedNodeId && target) neighborhood.add(target);
        if (target === selectedNodeId && source) neighborhood.add(source);
      });
      return neighborhood;
    }, [canvasGraph.links, selectedNodeId]);

    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const searchResults = useMemo(
      () =>
        canvasGraph.nodes
          .map((node) => ({ node, score: scoreGraphNodeSearch(node, normalizedQuery) }))
          .filter(({ score }) => score > 0)
          .sort(
            (left, right) =>
              right.score - left.score || left.node.title.localeCompare(right.node.title),
          ),
      [canvasGraph.nodes, normalizedQuery],
    );
    const searchMatchIds = useMemo(
      () => new Set(searchResults.map(({ node }) => node.id)),
      [searchResults],
    );

    const focusNode = useCallback(
      (nodeId: string, zoom = FOCUS_ZOOM) => {
        const node = nodesById.get(nodeId);
        if (!node) return;
        const x = typeof node.x === 'number' ? node.x : 0;
        const y = typeof node.y === 'number' ? node.y : 0;
        graphRef.current?.centerAt(x, y, 650);
        graphRef.current?.zoom(zoom, 650);
        zoomLevelRef.current = zoom;
      },
      [nodesById],
    );

    const zoomIn = useCallback(() => {
      const nextZoom = clamp(zoomLevelRef.current * 1.32, MIN_ZOOM, MAX_ZOOM);
      graphRef.current?.zoom(nextZoom, 280);
      zoomLevelRef.current = nextZoom;
    }, []);

    const zoomOut = useCallback(() => {
      const nextZoom = clamp(zoomLevelRef.current / 1.32, MIN_ZOOM, MAX_ZOOM);
      graphRef.current?.zoom(nextZoom, 280);
      zoomLevelRef.current = nextZoom;
    }, []);

    const fit = useCallback(() => {
      if (canvasGraph.nodes.length === 0) return;
      graphRef.current?.zoomToFit(650, 112);
    }, [canvasGraph.nodes.length]);

    const resetView = useCallback(() => {
      graphRef.current?.centerAt(0, 0, 650);
      graphRef.current?.zoom(1, 650);
      zoomLevelRef.current = 1;
    }, []);

    useImperativeHandle(
      forwardedRef,
      () => ({ zoomIn, zoomOut, fit, centerNode: focusNode, resetView }),
      [fit, focusNode, resetView, zoomIn, zoomOut],
    );

    useEffect(() => {
      if (!selectedNodeId || !nodesById.has(selectedNodeId)) return;
      focusNode(selectedNodeId);
    }, [focusNode, nodesById, selectedNodeId]);

    useEffect(() => {
      if (!normalizedQuery || searchResults.length === 0) return undefined;
      const timeout = window.setTimeout(
        () => focusNode(searchResults[0].node.id, 4.7),
        180,
      );
      return () => window.clearTimeout(timeout);
    }, [focusNode, normalizedQuery, searchResults]);

    useEffect(() => {
      initialFitCompleteRef.current = false;
    }, [activeRelationTypes, activeTiers, clusterLayout, graphData]);

    useEffect(() => {
      if (canvasGraph.nodes.length === 0) return undefined;
      const timeout = window.setTimeout(() => {
        if (selectedNodeId && nodesById.has(selectedNodeId)) {
          focusNode(selectedNodeId);
          return;
        }
        if (!normalizedQuery) graphRef.current?.zoomToFit(520, 112);
      }, 220);
      return () => window.clearTimeout(timeout);
    }, [
      canvasGraph.nodes.length,
      canvasSize.height,
      canvasSize.width,
      focusNode,
      nodesById,
      normalizedQuery,
      selectedNodeId,
    ]);

    useEffect(() => {
      graphRef.current?.d3ReheatSimulation();
    }, [activeRelationTypes, activeTiers, clusterLayout]);

    useEffect(() => {
      const graph = graphRef.current;
      if (!graph || canvasGraph.nodes.length === 0) return;

      const linkForce = graph.d3Force('link');
      linkForce?.distance?.((link: CanvasLink) => {
        const source = nodesById.get(endpointId(link.source) ?? '');
        const target = nodesById.get(endpointId(link.target) ?? '');
        if (!source || !target) return 72;
        if (link.type === 'branch_of') {
          return 64 + Math.max(nodeRadius(source), nodeRadius(target)) * 2.8;
        }
        return source.cluster === target.cluster ? 70 : 118;
      });
      linkForce?.strength?.((link: CanvasLink) => {
        if (link.type === 'branch_of') return 0.26;
        const source = nodesById.get(endpointId(link.source) ?? '');
        const target = nodesById.get(endpointId(link.target) ?? '');
        return source?.cluster === target?.cluster ? 0.1 : 0.045;
      });

      const chargeForce = graph.d3Force('charge');
      chargeForce?.strength?.((node: CanvasNode) => -48 - nodeRadius(node) * 1.45);
      chargeForce?.distanceMax?.(420);
      graph.d3ReheatSimulation();
    }, [canvasGraph.nodes.length, canvasGraph.links, nodesById]);

    const applyClusterPull = useCallback(() => {
      if (clusterLayout) {
        canvasGraph.nodes.forEach((node) => {
          const center = clusterCenters.get(node.cluster);
          if (!center || typeof node.x !== 'number' || typeof node.y !== 'number') {
            return;
          }
          const clusterSize = clusterPlacement.get(node.id)?.count ?? 1;
          const pull = clamp(0.035 / Math.sqrt(Math.max(clusterSize, 2)), 0.003, 0.0065);
          node.vx = (node.vx ?? 0) + (center.x - node.x) * pull;
          node.vy = (node.vy ?? 0) + (center.y - node.y) * pull;
        });
      }

      const spatialGrid = new Map<number, Map<number, number[]>>();
      const occupiedCells: Array<{ index: number; x: number; y: number }> = [];

      canvasGraph.nodes.forEach((node, index) => {
        if (typeof node.x !== 'number' || typeof node.y !== 'number') return;
        const cellX = Math.floor(node.x / collisionMetrics.cellSize);
        const cellY = Math.floor(node.y / collisionMetrics.cellSize);
        let column = spatialGrid.get(cellX);
        if (!column) {
          column = new Map<number, number[]>();
          spatialGrid.set(cellX, column);
        }
        let bucket = column.get(cellY);
        if (!bucket) {
          bucket = [];
          column.set(cellY, bucket);
        }
        bucket.push(index);
        occupiedCells.push({ index, x: cellX, y: cellY });
      });

      occupiedCells.forEach(({ index: leftIndex, x: cellX, y: cellY }) => {
        const left = canvasGraph.nodes[leftIndex];
        for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
          const column = spatialGrid.get(cellX + xOffset);
          if (!column) continue;
          for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
            const bucket = column.get(cellY + yOffset);
            if (!bucket) continue;
            bucket.forEach((rightIndex) => {
              // Each unordered pair is evaluated once, matching the old loop.
              if (rightIndex <= leftIndex) return;
              const right = canvasGraph.nodes[rightIndex];
              if (
                typeof left.x !== 'number' ||
                typeof left.y !== 'number' ||
                typeof right.x !== 'number' ||
                typeof right.y !== 'number'
              ) {
                return;
              }
              const sameCluster = left.cluster === right.cluster;
              const minimumDistance = collisionMetrics.radii[leftIndex] +
                collisionMetrics.radii[rightIndex] +
                (sameCluster ? 10 : 4);
              let deltaX = right.x - left.x;
              let deltaY = right.y - left.y;
              let distance = Math.hypot(deltaX, deltaY);
              if (distance >= minimumDistance) return;
              if (distance < 0.01) {
                const angle = ((stableHash(`${left.id}:${right.id}`) % 360) / 180) * Math.PI;
                deltaX = Math.cos(angle);
                deltaY = Math.sin(angle);
                distance = 1;
              }
              const separation = (minimumDistance - distance) *
                (sameCluster ? 0.045 : 0.025);
              const forceX = (deltaX / distance) * separation;
              const forceY = (deltaY / distance) * separation;
              left.vx = (left.vx ?? 0) - forceX;
              left.vy = (left.vy ?? 0) - forceY;
              right.vx = (right.vx ?? 0) + forceX;
              right.vy = (right.vy ?? 0) + forceY;
            });
          }
        }
      });

    }, [
      canvasGraph.nodes,
      clusterCenters,
      clusterLayout,
      clusterPlacement,
      collisionMetrics,
    ]);

    const paintClusterBackdrops = useCallback(
      (context: CanvasRenderingContext2D, globalScale: number) => {
        if (!clusterLayout) return;
        visibleClusters.forEach((cluster) => {
          const members = canvasGraph.nodes.filter(
            (node) =>
              node.cluster === cluster &&
              typeof node.x === 'number' &&
              typeof node.y === 'number',
          );
          if (members.length === 0) return;
          const center = members.reduce(
            (total, node) => ({
              x: total.x + (node.x as number) / members.length,
              y: total.y + (node.y as number) / members.length,
            }),
            { x: 0, y: 0 },
          );
          const highestNodeY = Math.min(...members.map((node) => node.y as number));
          const largestNodeRadius = Math.max(...members.map((node) => nodeRadius(node)));
          const memberExtent = Math.max(
            ...members.map((node) =>
              Math.hypot((node.x as number) - center.x, (node.y as number) - center.y),
            ),
          );
          const representative = members[0];
          const color = representative?.color ?? FALLBACK_NODE_COLOR;
          const radius = clamp(memberExtent + 34, 54, 240);
          const glow = context.createRadialGradient(
            center.x,
            center.y,
            0,
            center.x,
            center.y,
            radius,
          );
          glow.addColorStop(0, colorWithAlpha(color, 0.065));
          glow.addColorStop(0.68, colorWithAlpha(color, 0.018));
          glow.addColorStop(1, colorWithAlpha(color, 0));
          context.save();
          context.fillStyle = glow;
          context.beginPath();
          context.arc(center.x, center.y, radius, 0, Math.PI * 2);
          context.fill();

          const labelSize = clamp(10.5 + Math.log2(members.length + 1) * 1.15, 10.5, 18) /
            globalScale;
          context.font = `700 ${labelSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.letterSpacing = `${1.35 / globalScale}px`;
          context.fillStyle = colorWithAlpha(color, globalScale < 0.7 ? 0.9 : 0.72);
          context.fillText(
            cluster.toLocaleUpperCase(),
            center.x,
            highestNodeY - largestNodeRadius - 10 / globalScale,
          );
          context.restore();
        });
      },
      [canvasGraph.nodes, clusterLayout, visibleClusters],
    );

    const paintNode = useCallback(
      (
        node: CanvasNode,
        context: CanvasRenderingContext2D,
        globalScale: number,
      ) => {
        if (typeof node.x !== 'number' || typeof node.y !== 'number') return;
        const isFuture = isNodeFuture(node, currentYear);
        const isExtinct = isNodeExtinct(node, currentYear);

        const isSelected = node.id === selectedNodeId;
        const isHovered = node.id === hoveredNodeId;
        const isSearchMatch = searchMatchIds.has(node.id);
        const isConnected = selectedNeighborhood.has(node.id);
        const hasSelection = selectedNodeId !== null;
        const color = node.color || FALLBACK_NODE_COLOR;
        const radius = nodeRadius(node) + (isSelected ? 1.2 : 0);
        const displayWeight = clamp(node.displayWeight || 1, 0.75, 3);
        let opacity = isFuture ? 0.05 : isExtinct ? 0.45 : 0.96;

        if (!isFuture) {
          if (hasSelection && !isConnected) opacity *= 0.68;
          if (normalizedQuery && !isSearchMatch) opacity *= 0.35;
        }

        context.save();
        context.globalAlpha = opacity;

        if (!isFuture) {
          const haloRadius = radius * (isSelected ? 3.2 : isHovered ? 2.8 : 2.25);
          const halo = context.createRadialGradient(
            node.x,
            node.y,
            radius * 0.35,
            node.x,
            node.y,
            haloRadius,
          );
          halo.addColorStop(0, colorWithAlpha(color, isSelected ? 0.5 : 0.3));
          halo.addColorStop(0.46, colorWithAlpha(color, isSelected ? 0.2 : 0.1));
          halo.addColorStop(1, colorWithAlpha(color, 0));
          context.fillStyle = halo;
          context.beginPath();
          context.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
          context.fill();
        }

        context.shadowColor = color;
        context.shadowBlur = !isFuture && (isSelected || isHovered) ? 18 : 10;
        context.fillStyle = '#121722';
        context.beginPath();
        context.arc(node.x, node.y, radius, 0, Math.PI * 2);
        context.fill();

        context.shadowBlur = 0;
        context.lineWidth = (
          isSelected ? 2.3 : 1.3 + Math.max(0, displayWeight - 1) * 0.32
        ) / globalScale;
        context.strokeStyle = colorWithAlpha(color, isSelected ? 1 : isExtinct ? 0.5 : 0.88);
        context.stroke();

        context.fillStyle = colorWithAlpha(color, isSelected ? 0.96 : isExtinct ? 0.5 : 0.78);
        context.beginPath();
        context.arc(node.x, node.y, radius * 0.52, 0, Math.PI * 2);
        context.fill();

        if (isSelected || isSearchMatch) {
          context.lineWidth = 1.15 / globalScale;
          context.strokeStyle = isSelected
            ? colorWithAlpha('#ffffff', 0.92)
            : colorWithAlpha(color, 0.72);
          context.beginPath();
          context.arc(node.x, node.y, radius + 3.1 / globalScale, 0, Math.PI * 2);
          context.stroke();
        }

        const showLabel =
          !isFuture &&
          (isSelected ||
            isHovered ||
            (isSearchMatch && searchLabelsVisible) ||
            globalScale >= 1.65 ||
            (displayWeight >= 2.15 && globalScale >= 0.25) ||
            (displayWeight >= 1.6 && globalScale >= 0.82) ||
            (nodeDegree(node) >= 10 && globalScale >= 1) ||
            (nodeDegree(node) >= 6 && globalScale >= 1.25));

        if (showLabel) {
          const prominenceBoost = Math.max(0, displayWeight - 1) * 2.15;
          const fontSize = (isSelected ? 13.2 : 11.2 + prominenceBoost) / globalScale;
          const fontWeight = isSelected || isHovered
            ? 700
            : displayWeight >= 1.6 ? 680 : 520;
          context.font = `${fontWeight} ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          const labelWidth = context.measureText(node.title).width;
          const paddingX = 5.5 / globalScale;
          const labelHeight = 18 / globalScale;
          let labelX = node.x;
          let labelY = node.y + radius + 10 / globalScale;
          if (displayWeight >= 2.15 && !isSelected && !isHovered) {
            const placement = stableHash(node.id) % 4;
            if (placement === 0) {
              labelY = node.y + radius + 11 / globalScale;
            } else if (placement === 1) {
              labelY = node.y - radius - 11 / globalScale;
            } else if (placement === 2) {
              labelX = node.x + radius + labelWidth / 2 + paddingX + 5 / globalScale;
              labelY = node.y;
            } else {
              labelX = node.x - radius - labelWidth / 2 - paddingX - 5 / globalScale;
              labelY = node.y;
            }
          }
          drawRoundedRect(
            context,
            labelX - labelWidth / 2 - paddingX,
            labelY - labelHeight / 2,
            labelWidth + paddingX * 2,
            labelHeight,
            4 / globalScale,
          );
          context.fillStyle = colorWithAlpha('#0b0e14', isSelected ? 0.92 : 0.78);
          context.fill();
          context.lineWidth = 0.65 / globalScale;
          context.strokeStyle = colorWithAlpha(color, isSelected ? 0.52 : 0.24);
          context.stroke();
          context.fillStyle = colorWithAlpha('#f4f7ff', isSelected ? 1 : 0.91);
          context.fillText(node.title, labelX, labelY + 0.3 / globalScale);
        }

        context.restore();
      },
      [
        currentYear,
        hoveredNodeId,
        normalizedQuery,
        searchLabelsVisible,
        searchMatchIds,
        selectedNeighborhood,
        selectedNodeId,
      ],
    );

    const paintPointerArea = useCallback(
      (
        node: CanvasNode,
        color: string,
        context: CanvasRenderingContext2D,
        globalScale: number,
      ) => {
        if (typeof node.x !== 'number' || typeof node.y !== 'number') return;
        if (!isNodeTemporallyVisible(node, currentYear, temporalMode)) return;

        context.fillStyle = color;
        context.beginPath();
        context.arc(
          node.x,
          node.y,
          nodeRadius(node) + 7 / globalScale,
          0,
          Math.PI * 2,
        );
        context.fill();
      },
      [currentYear, temporalMode],
    );

    const isEmphasizedLink = useCallback(
      (link: CanvasLink) => {
        if (selectedLinkId && link.id === selectedLinkId) return true;
        const source = endpointId(link.source);
        const target = endpointId(link.target);
        return Boolean(
          selectedNodeId &&
            (source === selectedNodeId || target === selectedNodeId),
        );
      },
      [selectedLinkId, selectedNodeId],
    );

    const linkColor = useCallback(
      (link: CanvasLink) => {
        const source = endpointId(link.source);
        const target = endpointId(link.target);
        const srcNode = rawNodeById.get(source ?? '');
        const tgtNode = rawNodeById.get(target ?? '');
        if (!isLinkTemporallyVisible(srcNode, tgtNode, currentYear, temporalMode)) {
          return 'rgba(0, 0, 0, 0)';
        }

        const relationColor =
          RELATION_COLORS.get(link.type) ?? TIER_COLORS.get(link.certainty) ?? '#71809c';
        const emphasized = isEmphasizedLink(link);
        const touchesSearch = Boolean(
          (source && searchMatchIds.has(source)) ||
            (target && searchMatchIds.has(target)),
        );
        let alpha = emphasized ? 0.95 : 0.36;
        if ((selectedNodeId || selectedLinkId) && !emphasized) alpha *= 0.45;
        if (normalizedQuery && !touchesSearch) alpha *= 0.35;
        return colorWithAlpha(relationColor, alpha);
      },
      [currentYear, isEmphasizedLink, normalizedQuery, rawNodeById, searchMatchIds, selectedLinkId, selectedNodeId, temporalMode],
    );

    const linkWidth = useCallback(
      (link: CanvasLink) => {
        const source = endpointId(link.source);
        const target = endpointId(link.target);
        const srcNode = rawNodeById.get(source ?? '');
        const tgtNode = rawNodeById.get(target ?? '');
        if (!isLinkTemporallyVisible(srcNode, tgtNode, currentYear, temporalMode)) {
          return 0;
        }

        if (isEmphasizedLink(link)) return 2.2;
        if (link.type === 'branch_of') return 1.05;
        if (link.certainty === 'academic_consensus') return 0.82;
        if (link.certainty === 'speculative_fringe') return 0.52;
        return 0.68;
      },
      [currentYear, isEmphasizedLink, rawNodeById, temporalMode],
    );

    const linkCurvature = useCallback((link: CanvasLink) => {
      const hash = stableHash(link.id);
      const direction = hash % 2 === 0 ? 1 : -1;
      const base = link.type === 'branch_of' ? 0.035 : 0.08;
      const step = link.type === 'branch_of' ? 0.012 : 0.025;
      return direction * (base + ((hash >>> 5) % 5) * step);
    }, []);

    const linkLineDash = useCallback((link: CanvasLink): number[] => {
      if (link.style === 'dotted' || link.type === 'parallel_concept') return [3, 3];
      if (link.type === 'fringe_reinterpretation') return [1.5, 3.5];
      if (link.certainty === 'theological_claim') return [5, 2.5];
      return [];
    }, []);

    const handleNodeClick = useCallback(
      (node: CanvasNode) => {
        if (!isNodeTemporallyVisible(node, currentYear, temporalMode)) return;
        onSelectNode(node.id);
        focusNode(node.id);
      },
      [currentYear, focusNode, onSelectNode, temporalMode],
    );

    const handleLinkClick = useCallback(
      (link: CanvasLink) => {
        onSelectLink?.(link.id);
      },
      [onSelectLink],
    );

    const handleEngineStop = useCallback(() => {
      if (
        initialFitCompleteRef.current ||
        selectedNodeId ||
        normalizedQuery ||
        canvasGraph.nodes.length === 0
      ) {
        return;
      }
      initialFitCompleteRef.current = true;
      graphRef.current?.zoomToFit(700, 112);
    }, [canvasGraph.nodes.length, normalizedQuery, selectedNodeId]);

    const noSearchResults = normalizedQuery.length > 0 && searchResults.length === 0;

    return (
      <div
        ref={containerRef}
        className={`graph-canvas ${className}`.trim()}
        role="img"
        aria-label={`Comparative religion graph showing ${canvasGraph.nodes.length} traditions and ${canvasGraph.links.length} relations at ${formatYearLabel(currentYear)} in ${temporalMode} mode`}
      >
        <div className="graph-overlay-controls" role="toolbar" aria-label="Graph overlay controls">
          <div className="tool-group">
            <span className="tool-group__label">View</span>
            <button
              type="button"
              className="cluster-toggle"
              onClick={() => setViewMode('list')}
              title="Switch to accessible list view"
              aria-label="Switch to accessible list view"
            >
              <List size={14} aria-hidden="true" />
              <span>List</span>
            </button>
          </div>
        </div>

        <div
          className="graph-canvas__surface"
          style={{ cursor: hoveredNodeId ? 'pointer' : 'grab' }}
        >
          <ForceGraph2D<GraphNode, GraphLink>
            ref={graphRef}
            width={canvasSize.width}
            height={canvasSize.height}
            graphData={canvasGraph}
            nodeId="id"
            linkSource="source"
            linkTarget="target"
            backgroundColor="rgba(0, 0, 0, 0)"
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            autoPauseRedraw={false}
            enableNodeDrag
            enablePanInteraction
            enableZoomInteraction
            d3AlphaDecay={canvasGraph.nodes.length > 80 ? 0.018 : 0.025}
            d3VelocityDecay={clusterLayout ? 0.34 : 0.27}
            warmupTicks={canvasGraph.nodes.length > 80 ? 90 : 45}
            cooldownTicks={canvasGraph.nodes.length > 80 ? 340 : 180}
            onEngineTick={applyClusterPull}
            onEngineStop={handleEngineStop}
            onRenderFramePre={paintClusterBackdrops}
            nodeCanvasObjectMode={() => 'replace'}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={paintPointerArea}
            nodeLabel={(node) =>
              `<div class="graph-tooltip"><strong>${escapeHtml(
                node.title,
              )}</strong><span>${escapeHtml(node.cluster)} · ${escapeHtml(
                node.eraStart,
              )}</span><span>${nodeDegree(node)} graph connections · ${
                node.displayWeight > 1 ? 'prominent atlas hub' : 'standard atlas node'
              }</span><p>${escapeHtml(node.summary)}</p></div>`
            }
            linkColor={linkColor}
            linkWidth={linkWidth}
            linkCurvature={linkCurvature}
            linkLineDash={linkLineDash}
            linkDirectionalParticles={(link) =>
              isEmphasizedLink(link) ? 3 : 1
            }
            linkDirectionalParticleWidth={(link) =>
              isEmphasizedLink(link) ? 2.15 : 1.15
            }
            linkDirectionalParticleSpeed={(link) =>
              0.0035 + (stableHash(link.id) % 5) * 0.00045
            }
            linkDirectionalParticleColor={(link) =>
              RELATION_COLORS.get(link.type) ?? '#b8c6df'
            }
            linkLabel={(link) =>
              `<div class="graph-tooltip graph-tooltip--link"><strong>${escapeHtml(
                formatTaxonomyLabel(link.type),
              )}</strong><span>${escapeHtml(
                formatTaxonomyLabel(link.certainty),
              )}</span>${
                link.citation
                  ? `<p>${escapeHtml(link.citation)}</p>`
                  : ''
              }</div>`
            }
            linkHoverPrecision={5}
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
            onNodeHover={(node) => setHoveredNodeId(node?.id ?? null)}
            onBackgroundClick={() => {
              onSelectNode(null);
              onSelectLink?.(null);
            }}
            onZoom={({ k }) => {
              zoomLevelRef.current = k;
            }}
          />
        </div>

        {canvasGraph.nodes.length === 0 && (
          <div className="graph-canvas__empty" role="status">
            <span className="graph-canvas__empty-orbit" aria-hidden="true" />
            <strong>No traditions are visible</strong>
            <span>Enable at least one epistemic tier to restore the graph.</span>
          </div>
        )}

        {noSearchResults && canvasGraph.nodes.length > 0 && (
          <div className="graph-canvas__search-empty" role="status">
            No visible match for “{searchQuery.trim()}”
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {canvasGraph.nodes.length} visible traditions and {canvasGraph.links.length}{' '}
          visible relations.
        </p>
      </div>
    );
  },
);

GraphCanvas.displayName = 'GraphCanvas';

export default GraphCanvas;
