/* SPDX-License-Identifier: AGPL-3.0-or-later OR LicenseRef-OpenGrail-Commercial */
/* See LICENSE and LICENSE-COMMERCIAL.md for the applicable terms. */

import {
  geoDistance,
  geoGraticule10,
  geoInterpolate,
  geoOrthographic,
  geoPath,
} from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import {
  LocateFixed,
  Minus,
  Plus,
  RotateCw,
} from 'lucide-react';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAtlasState } from '../state/AtlasState';
import {
  EPISTEMIC_TIER_OPTIONS,
  RELATION_TYPE_OPTIONS,
  scoreGraphNodeSearch,
  type EpistemicTier,
  type GraphData,
  type GraphNode,
  type RelationType,
} from '../types/graph';

export interface WorldMapViewProps {
  graphData: GraphData;
  onSelectNode?: (nodeId: string | null) => void;
  className?: string;
}

const RELATION_COLORS = new Map<RelationType, string>(
  RELATION_TYPE_OPTIONS.map(({ value, color }) => [value, color]),
);

const TIER_COLORS = new Map<EpistemicTier, string>(
  EPISTEMIC_TIER_OPTIONS.map(({ value, color }) => [value, color]),
);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function colorWithAlpha(color: string, alpha: number): string {
  const normalized = color.trim();
  const shortHex = /^#([\da-f])([\da-f])([\da-f])$/i.exec(normalized);
  const longHex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(normalized);

  if (shortHex) {
    const red = parseInt(shortHex[1] + shortHex[1], 16);
    const green = parseInt(shortHex[2] + shortHex[2], 16);
    const blue = parseInt(shortHex[3] + shortHex[3], 16);
    return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha, 0, 1)})`;
  }
  if (longHex) {
    const red = parseInt(longHex[1], 16);
    const green = parseInt(longHex[2], 16);
    const blue = parseInt(longHex[3], 16);
    return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha, 0, 1)})`;
  }
  return normalized;
}

export function WorldMapView({ graphData, onSelectNode, className = '' }: WorldMapViewProps) {
  const {
    currentYear,
    selectedNodeId,
    selectedLinkId,
    selectNode,
    activeTiers,
    activeRelationTypes,
    searchQuery,
  } = useAtlasState();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [worldLand, setWorldLand] = useState<any | null>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([-35, -25, 0]);
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; rot: [number, number, number] } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  const targetRotationRef = useRef<[number, number, number] | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const flowOffsetRef = useRef<number>(0);

  // Load local bundled map asset
  useEffect(() => {
    const controller = new AbortController();
    const mapUrl = `${import.meta.env.BASE_URL}world-110m.json`;
    fetch(mapUrl, { signal: controller.signal })
      .then((res) => res.json())
      .then((topo: Topology) => {
        if (topo && topo.objects && (topo.objects.land || topo.objects.countries)) {
          const landFeature = feature(topo, (topo.objects.land || topo.objects.countries) as any);
          setWorldLand(landFeature);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('Could not load local world-110m.json', err);
        }
      });
    return () => controller.abort();
  }, []);

  const nodeMap = useMemo(
    () => new Map(graphData.nodes.map((node) => [node.id, node])),
    [graphData.nodes],
  );

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;

  // Center globe smoothly on selected node
  useEffect(() => {
    if (selectedNode && selectedNode.origin_geo) {
      const { lat, lng } = selectedNode.origin_geo;
      targetRotationRef.current = [-lng, -lat, 0];
    }
  }, [selectedNode]);

  // Handle auto-rotation & target rotation animation
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      flowOffsetRef.current = (flowOffsetRef.current + dt * 0.4) % 1;

      setRotation((current) => {
        if (targetRotationRef.current) {
          const [tLng, tLat] = targetRotationRef.current;
          const [cLng, cLat] = current;
          let diffLng = (tLng - cLng) % 360;
          if (diffLng > 180) diffLng -= 360;
          if (diffLng < -180) diffLng += 360;
          const diffLat = tLat - cLat;

          if (Math.abs(diffLng) < 0.2 && Math.abs(diffLat) < 0.2) {
            targetRotationRef.current = null;
            return [tLng, tLat, 0];
          }
          const step = Math.min(1, dt * 5);
          return [cLng + diffLng * step, cLat + diffLat * step, 0];
        }

        if (autoRotate && !isDragging) {
          return [current[0] + dt * 4, current[1], 0];
        }

        return current;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [autoRotate, isDragging]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase();
    if (!q) return new Set<string>();
    return new Set(
      graphData.nodes
        .filter((node) => scoreGraphNodeSearch(node, q) > 0)
        .map((n) => n.id),
    );
  }, [graphData.nodes, searchQuery]);

  // Draw globe frame on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const bounds = container.getBoundingClientRect();
    const width = Math.max(bounds.width, 100);
    const height = Math.max(bounds.height, 100);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const baseRadius = Math.min(width, height) * 0.42;
    const radius = baseRadius * scaleFactor;

    const projection = geoOrthographic()
      .translate([width / 2, height / 2])
      .scale(radius)
      .rotate(rotation)
      .clipAngle(90);

    const pathGenerator = geoPath(projection, ctx);

    // 1. Globe Sphere background & atmosphere halo
    const sphereCenter = [width / 2, height / 2] as const;

    // Outer glow
    const outerGlow = ctx.createRadialGradient(
      sphereCenter[0],
      sphereCenter[1],
      radius * 0.95,
      sphereCenter[0],
      sphereCenter[1],
      radius * 1.25,
    );
    outerGlow.addColorStop(0, 'rgba(64, 216, 192, 0.16)');
    outerGlow.addColorStop(0.4, 'rgba(64, 140, 216, 0.06)');
    outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(sphereCenter[0], sphereCenter[1], radius * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // Globe base fill
    ctx.save();
    ctx.beginPath();
    pathGenerator({ type: 'Sphere' });
    ctx.fillStyle = '#0f141d';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#223046';
    ctx.stroke();

    // 2. Graticule
    const graticule = geoGraticule10();
    ctx.beginPath();
    pathGenerator(graticule);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(70, 100, 140, 0.18)';
    ctx.stroke();

    // 3. Land masses
    if (worldLand) {
      ctx.beginPath();
      pathGenerator(worldLand);
      ctx.fillStyle = '#161d28';
      ctx.fill();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(75, 120, 160, 0.45)';
      ctx.stroke();
    }
    ctx.restore();

    // 4. Draw relation arcs
    graphData.links.forEach((link) => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target || !source.origin_geo || !target.origin_geo) return;

      const sourceYear = source.origin_year ?? 0;
      const targetYear = target.origin_year ?? 0;
      const maxOriginYear = Math.max(sourceYear, targetYear);
      if (maxOriginYear > currentYear) return;

      const isSourceTierActive = activeTiers.has(source.epistemicTier);
      const isTargetTierActive = activeTiers.has(target.epistemicTier);
      const isLinkTierActive = activeTiers.has(link.certainty);
      const isLinkTypeActive = activeRelationTypes.has(link.type);
      if (!isSourceTierActive || !isTargetTierActive || !isLinkTierActive || !isLinkTypeActive) return;

      const srcGeo: [number, number] = [source.origin_geo.lng, source.origin_geo.lat];
      const tgtGeo: [number, number] = [target.origin_geo.lng, target.origin_geo.lat];

      const isSelectedLink = link.id === selectedLinkId;
      const isSourceSelected = source.id === selectedNodeId;
      const isTargetSelected = target.id === selectedNodeId;
      const isEmphasized = isSelectedLink || isSourceSelected || isTargetSelected;

      const baseColor = RELATION_COLORS.get(link.type) ?? TIER_COLORS.get(link.certainty) ?? '#64d8c0';
      const isDotted = link.style === 'dotted' || link.relation_type === 'thematic_parallel';

      // Great circle line feature
      const lineGeo: any = {
        type: 'LineString',
        coordinates: [srcGeo, tgtGeo],
      };

      ctx.save();
      ctx.beginPath();
      pathGenerator(lineGeo);
      ctx.lineWidth = isEmphasized ? 2.4 : 1.1;
      ctx.strokeStyle = colorWithAlpha(baseColor, isEmphasized ? 0.95 : 0.4);

      if (isDotted) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();

      // Draw subtle directional particle along arc
      const interpolator = geoInterpolate(srcGeo, tgtGeo);
      const pCoord = interpolator(flowOffsetRef.current);
      const projectedPoint = projection(pCoord);
      if (projectedPoint) {
        const centerLng = -rotation[0];
        const centerLat = -rotation[1];
        const distToCenter = geoDistance([centerLng, centerLat], pCoord);
        if (distToCenter < Math.PI / 2) {
          ctx.beginPath();
          ctx.arc(projectedPoint[0], projectedPoint[1], isEmphasized ? 2.5 : 1.5, 0, Math.PI * 2);
          ctx.fillStyle = colorWithAlpha(baseColor, 0.9);
          ctx.fill();
        }
      }
      ctx.restore();
    });

    // 5. Draw node points
    const renderedNodes: Array<{ node: GraphNode; x: number; y: number; isVisible: boolean }> = [];

    graphData.nodes.forEach((node) => {
      if (!node.origin_geo) return;
      const { lat, lng } = node.origin_geo;
      const isTierActive = activeTiers.has(node.epistemicTier);
      if (!isTierActive) return;

      const originYear = node.origin_year ?? node.originYear ?? 0;
      const isFuture = originYear > currentYear;
      const extinctYear = node.extinct_year ?? node.extinctYear;
      const isExtinct = extinctYear !== null && extinctYear !== undefined && currentYear >= extinctYear;
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;
      const isSearchMatch = searchResults.has(node.id);

      const centerLng = -rotation[0];
      const centerLat = -rotation[1];
      const distToCenter = geoDistance([centerLng, centerLat], [lng, lat]);
      const isVisible = distToCenter < Math.PI / 2;

      const pt = projection([lng, lat]);
      if (!pt || !isVisible) return;

      renderedNodes.push({ node, x: pt[0], y: pt[1], isVisible });

      const color = node.color || '#64d8c0';
      const baseRadius = 4.2 + (node.displayWeight > 1.5 ? 2.5 : 0) + (isSelected ? 3 : 0);

      ctx.save();
      if (isFuture) {
        ctx.globalAlpha = 0.05;
      } else if (isExtinct) {
        ctx.globalAlpha = 0.45;
      } else {
        ctx.globalAlpha = 0.95;
      }

      // Outer halo
      if (!isFuture) {
        const halo = ctx.createRadialGradient(pt[0], pt[1], 0, pt[0], pt[1], baseRadius * 2.8);
        halo.addColorStop(0, colorWithAlpha(color, isSelected ? 0.7 : 0.35));
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], baseRadius * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core point
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isSelected || isHovered ? 14 : 6;
      ctx.fill();

      // Selection ring
      if (isSelected || isSearchMatch) {
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], baseRadius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });

    // 6. Draw labels on top for selected / hovered nodes
    renderedNodes.forEach(({ node, x, y }) => {
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;
      const isSearchMatch = searchResults.has(node.id);
      const originYear = node.origin_year ?? node.originYear ?? 0;
      const isFuture = originYear > currentYear;
      const extinctYear = node.extinct_year ?? node.extinctYear;
      const isExtinct = extinctYear !== null && extinctYear !== undefined && currentYear >= extinctYear;

      if (isSelected || isHovered || isSearchMatch) {
        ctx.save();
        const label = node.title;
        const placeName = node.origin_geo?.place_name || (node as any).originGeo?.place_name || '';
        
        let statusBadge = '';
        if (isFuture) {
          statusBadge = `⏳ Emerges: ${node.eraStart}`;
        } else if (isExtinct) {
          statusBadge = `⌛ Extinct (Active ${node.eraStart})`;
        } else {
          statusBadge = `● Active in ${node.eraStart}`;
        }

        const subtext = placeName ? `${placeName} · ${statusBadge}` : statusBadge;

        ctx.font = '600 12px Inter, ui-sans-serif, system-ui, sans-serif';
        const titleWidth = ctx.measureText(label).width;
        ctx.font = '400 10px Inter, ui-sans-serif, system-ui, sans-serif';
        const subWidth = ctx.measureText(subtext).width;
        const boxWidth = Math.max(titleWidth, subWidth) + 24;
        const boxHeight = 40;
        const boxX = x - boxWidth / 2;
        const boxY = y - 52;

        // Tooltip box with glow shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = isFuture ? 'rgba(18, 22, 32, 0.95)' : 'rgba(13, 17, 24, 0.96)';
        ctx.strokeStyle = isFuture ? 'rgba(255, 255, 255, 0.22)' : colorWithAlpha(node.color, 0.85);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 7);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Arrow
        ctx.beginPath();
        ctx.moveTo(x - 6, boxY + boxHeight);
        ctx.lineTo(x + 6, boxY + boxHeight);
        ctx.lineTo(x, boxY + boxHeight + 6);
        ctx.closePath();
        ctx.fillStyle = isFuture ? 'rgba(18, 22, 32, 0.95)' : 'rgba(13, 17, 24, 0.96)';
        ctx.fill();

        // Title text
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 12px Inter, ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, boxY + 16);

        // Subtext / status
        ctx.fillStyle = isFuture ? '#fbbf24' : '#64d8c0';
        ctx.font = '500 10px Inter, ui-sans-serif, system-ui, sans-serif';
        ctx.fillText(subtext, x, boxY + 31);

        ctx.restore();
      }
    });

    ctx.restore();
  }, [
    activeRelationTypes,
    activeTiers,
    currentYear,
    graphData.links,
    graphData.nodes,
    hoveredNodeId,
    nodeMap,
    rotation,
    scaleFactor,
    searchResults,
    selectedLinkId,
    selectedNodeId,
    worldLand,
  ]);

  // Pointer drag rotation
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setAutoRotate(false);
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      rot: [...rotation],
    });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const sensitivity = 0.35 / scaleFactor;
      const nextLng = dragStart.rot[0] + dx * sensitivity;
      const nextLat = clamp(dragStart.rot[1] - dy * sensitivity, -85, 85);
      setRotation([nextLng, nextLat, 0]);
      return;
    }

    // Hover detection
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const bounds = container.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const width = bounds.width;
    const height = bounds.height;
    const radius = Math.min(width, height) * 0.42 * scaleFactor;

    const projection = geoOrthographic()
      .translate([width / 2, height / 2])
      .scale(radius)
      .rotate(rotation)
      .clipAngle(90);

    let closestNode: GraphNode | null = null;
    let minDistance = 26;

    const centerLng = -rotation[0];
    const centerLat = -rotation[1];

    graphData.nodes.forEach((node) => {
      const geo = node.origin_geo || (node as any).originGeo;
      if (!geo) return;
      const { lat, lng } = geo;
      if (!activeTiers.has(node.epistemicTier)) return;

      const distToCenter = geoDistance([centerLng, centerLat], [lng, lat]);
      if (distToCenter >= Math.PI / 2) return;

      const pt = projection([lng, lat]);
      if (!pt) return;

      const dist = Math.hypot(pt[0] - x, pt[1] - y);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    });

    setHoveredNodeId(closestNode ? (closestNode as GraphNode).id : null);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleCanvasClick = () => {
    if (hoveredNodeId) {
      if (onSelectNode) {
        onSelectNode(hoveredNodeId);
      } else {
        selectNode(hoveredNodeId);
      }
      const node = nodeMap.get(hoveredNodeId);
      const geo = node?.origin_geo || (node as any)?.originGeo;
      if (geo) {
        targetRotationRef.current = [-geo.lng, -geo.lat, 0];
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScaleFactor((prev) => clamp(prev * delta, 0.6, 4.5));
  };

  const zoomIn = () => setScaleFactor((s) => clamp(s * 1.3, 0.6, 4.5));
  const zoomOut = () => setScaleFactor((s) => clamp(s / 1.3, 0.6, 4.5));
  const resetView = () => {
    setScaleFactor(1);
    setRotation([-35, -25, 0]);
    targetRotationRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className={`world-map-view ${className}`.trim()}
      onWheel={handleWheel}
      role="application"
      aria-label="3D Orthographic Comparative Religion Globe"
    >
      <canvas
        ref={canvasRef}
        className="world-map-canvas"
        style={{ cursor: isDragging ? 'grabbing' : hoveredNodeId ? 'pointer' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCanvasClick}
      />

      <div className="map-overlay-controls" role="toolbar" aria-label="Map navigation controls">
        <div className="tool-group" aria-label="Zoom controls">
          <span className="tool-group__label">Zoom</span>
          <div className="tool-group__buttons">
            <button type="button" onClick={zoomIn} title="Zoom in" aria-label="Zoom in">
              <Plus size={15} />
            </button>
            <button type="button" onClick={zoomOut} title="Zoom out" aria-label="Zoom out">
              <Minus size={15} />
            </button>
            <button type="button" onClick={resetView} title="Fit globe" aria-label="Fit globe">
              <LocateFixed size={15} />
            </button>
          </div>
        </div>

        <div className="tool-group">
          <span className="tool-group__label">Spin</span>
          <button
            type="button"
            className={`cluster-toggle${autoRotate ? ' cluster-toggle--active' : ''}`}
            onClick={() => setAutoRotate((r) => !r)}
            title="Auto rotate globe"
            aria-pressed={autoRotate}
          >
            <RotateCw size={14} />
            Spin
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorldMapView;
