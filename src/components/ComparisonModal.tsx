/* SPDX-License-Identifier: MIT */

import {
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Check,
  Compass,
  Copy,
  Layers,
  Maximize2,
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
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAtlasState } from '../state/AtlasState';
import { isNodeTemporallyVisible } from '../state/temporalVisibility';
import {
  formatTaxonomyLabel,
  scoreGraphNodeSearch,
  type GraphLink,
  type GraphNode,
  type TraditionArtifact,
} from '../types/graph';
import { formatYearLabel } from './TimelineScrubber';
import { Lightbox } from './Lightbox';

export interface ComparisonModalProps {
  nodeA: GraphNode | null;
  nodeB: GraphNode | null;
  nodes: GraphNode[];
  links: GraphLink[];
  open: boolean;
  onClose: () => void;
  onSelectNodeA: (id: string) => void;
  onSelectNodeB: (id: string) => void;
  onSwap: () => void;
}

export interface SharedConnectionRelation {
  link: GraphLink;
  direction: 'outbound' | 'inbound';
  typeLabel: string;
  tierLabel: string;
  citation?: string;
}

export interface SharedConnection {
  node: GraphNode;
  relationsA: SharedConnectionRelation[];
  relationsB: SharedConnectionRelation[];
}

function resolveAssetPath(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/artifacts/')) {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return `${cleanBase}${url.slice(1)}`;
  }
  return url;
}

// Calculate Haversine distance between two coordinates in kilometers
function calculateDistanceKm(
  coordA?: { lat: number; lng: number } | [number, number] | null,
  coordB?: { lat: number; lng: number } | [number, number] | null,
): number | null {
  if (!coordA || !coordB) return null;
  const lat1 = Array.isArray(coordA) ? coordA[0] : coordA.lat;
  const lon1 = Array.isArray(coordA) ? coordA[1] : coordA.lng;
  const lat2 = Array.isArray(coordB) ? coordB[0] : coordB.lat;
  const lon2 = Array.isArray(coordB) ? coordB[1] : coordB.lng;

  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function ComparisonModal({
  nodeA,
  nodeB,
  nodes,
  links,
  open,
  onClose,
  onSelectNodeA,
  onSelectNodeB,
  onSwap,
}: ComparisonModalProps) {
  const { currentYear, temporalMode, activeTiers } = useAtlasState();
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<{
    artifact: TraditionArtifact;
    traditionTitle: string;
  } | null>(null);

  const [searchTarget, setSearchTarget] = useState<'A' | 'B' | null>(null);
  const [selectorSearch, setSelectorSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeArtifact) {
          setActiveArtifact(null);
        } else if (searchTarget) {
          setSearchTarget(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, activeArtifact, searchTarget, onClose]);

  // Focus search input when selector opens
  useEffect(() => {
    if (searchTarget && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchTarget]);

  // Filter nodes for the search selector
  const filteredNodes = useMemo(() => {
    const candidateNodes = nodes.filter(
      (n) =>
        activeTiers.has(n.epistemicTier) &&
        isNodeTemporallyVisible(n, currentYear, temporalMode),
    );
    if (!selectorSearch.trim()) {
      return candidateNodes.slice(0, 30);
    }
    return candidateNodes
      .map((n) => ({ node: n, score: scoreGraphNodeSearch(n, selectorSearch) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.node)
      .slice(0, 40);
  }, [activeTiers, currentYear, nodes, selectorSearch, temporalMode]);

  // Check direct graph connection between A and B
  const directConnections = useMemo(() => {
    if (!nodeA || !nodeB) return [];
    return links.filter(
      (l) =>
        (l.source === nodeA.id && l.target === nodeB.id) ||
        (l.source === nodeB.id && l.target === nodeA.id),
    );
  }, [links, nodeA, nodeB]);

  // Compute graph intersection (shared influences / mutual connections with type and direction)
  const sharedConnections = useMemo(() => {
    if (!nodeA || !nodeB) return [];
    const connectedToA = new Set<string>();
    const connectedToB = new Set<string>();

    for (const l of links) {
      if (l.source === nodeA.id) connectedToA.add(l.target);
      if (l.target === nodeA.id) connectedToA.add(l.source);
      if (l.source === nodeB.id) connectedToB.add(l.target);
      if (l.target === nodeB.id) connectedToB.add(l.source);
    }

    const mutualIds = Array.from(connectedToA).filter(
      (id) => connectedToB.has(id) && id !== nodeA.id && id !== nodeB.id,
    );

    return mutualIds
      .map((id) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return null;

        const linksA = links.filter(
          (l) =>
            (l.source === nodeA.id && l.target === id) ||
            (l.target === nodeA.id && l.source === id),
        );
        const linksB = links.filter(
          (l) =>
            (l.source === nodeB.id && l.target === id) ||
            (l.target === nodeB.id && l.source === id),
        );

        const relationsA: SharedConnectionRelation[] = linksA.map((l) => ({
          link: l,
          direction: (l.source === nodeA.id ? 'outbound' : 'inbound') as 'outbound' | 'inbound',
          typeLabel: formatTaxonomyLabel(l.relation_type || l.type),
          tierLabel: formatTaxonomyLabel(l.epistemic_tier || l.certainty),
          citation: l.citation,
        }));

        const relationsB: SharedConnectionRelation[] = linksB.map((l) => ({
          link: l,
          direction: (l.source === nodeB.id ? 'outbound' : 'inbound') as 'outbound' | 'inbound',
          typeLabel: formatTaxonomyLabel(l.relation_type || l.type),
          tierLabel: formatTaxonomyLabel(l.epistemic_tier || l.certainty),
          citation: l.citation,
        }));

        const entry: SharedConnection = {
          node,
          relationsA,
          relationsB,
        };

        return entry;
      })
      .filter((entry): entry is SharedConnection => entry !== null);
  }, [links, nodeA, nodeB, nodes]);

  // Chronological delta
  const chronology = useMemo(() => {
    if (!nodeA || !nodeB) return null;
    const yearA = nodeA.origin_year ?? nodeA.originYear ?? 0;
    const yearB = nodeB.origin_year ?? nodeB.originYear ?? 0;
    const diff = Math.abs(yearA - yearB);

    let summaryText = '';
    if (diff === 0) {
      summaryText = 'Both traditions emerged contemporaneously during the same historical era.';
    } else if (yearA < yearB) {
      summaryText = `${nodeA.title} emerged approximately ${diff.toLocaleString('en-US')} years before ${nodeB.title}.`;
    } else {
      summaryText = `${nodeB.title} emerged approximately ${diff.toLocaleString('en-US')} years before ${nodeA.title}.`;
    }

    return { yearA, yearB, diff, summaryText };
  }, [nodeA, nodeB]);

  // Geographic distance
  const geoDistance = useMemo(() => {
    if (!nodeA || !nodeB) return null;
    const geoA = nodeA.origin_geo || nodeA.originGeo;
    const geoB = nodeB.origin_geo || nodeB.originGeo;
    return calculateDistanceKm(geoA, geoB);
  }, [nodeA, nodeB]);

  const handleCopyLink = useCallback(() => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, []);

  if (!open || !nodeA) return null;

  return (
    <div
      className="comparison-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
    >
      <div className="comparison-backdrop" onClick={onClose} />

      <div className="comparison-container">
        {/* Comparison Header */}
        <header className="comparison-header">
          <div className="comparison-header__titles">
            <h2 id="comparison-title" className="comparison-header__main-title">
              Comparative Analysis
            </h2>
            <p className="comparison-header__subtitle">
              Side-by-side structural, doctrinal, and historical evaluation
            </p>
          </div>

          <div className="comparison-header__actions">
            <button
              type="button"
              className="btn btn--secondary comparison-header__btn"
              onClick={handleCopyLink}
              title="Share comparison deep link"
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>

            <button
              type="button"
              className="comparison-header__close-btn"
              onClick={onClose}
              aria-label="Close comparison view"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Selected Traditions Header Bar */}
        <div className="comparison-selector-bar">
          {/* Tradition A Card */}
          <div className="comparison-selector-card">
            <div className="comparison-selector-card__meta">
              <span
                className="comparison-color-dot"
                style={{ backgroundColor: nodeA.color, boxShadow: `0 0 10px ${nodeA.color}` }}
              />
              <span className="comparison-selector-card__cluster">{nodeA.cluster}</span>
            </div>
            <h3 className="comparison-selector-card__title">{nodeA.title}</h3>
            <span className="comparison-selector-card__era">
              {nodeA.eraStart} ({formatYearLabel(nodeA.origin_year ?? nodeA.originYear ?? 0)})
            </span>
            <button
              type="button"
              className="comparison-change-btn"
              onClick={() => {
                setSearchTarget('A');
                setSelectorSearch('');
              }}
            >
              Change Tradition
            </button>
          </div>

          {/* Swap / Center Controls */}
          <div className="comparison-selector-divider">
            <button
              type="button"
              className="comparison-swap-btn"
              onClick={onSwap}
              disabled={!nodeB}
              title="Swap side A and B"
              aria-label="Swap traditions"
            >
              <ArrowLeftRight size={18} />
            </button>
            <span className="comparison-vs-badge">VS</span>
          </div>

          {/* Tradition B Card */}
          {nodeB ? (
            <div className="comparison-selector-card">
              <div className="comparison-selector-card__meta">
                <span
                  className="comparison-color-dot"
                  style={{ backgroundColor: nodeB.color, boxShadow: `0 0 10px ${nodeB.color}` }}
                />
                <span className="comparison-selector-card__cluster">{nodeB.cluster}</span>
              </div>
              <h3 className="comparison-selector-card__title">{nodeB.title}</h3>
              <span className="comparison-selector-card__era">
                {nodeB.eraStart} ({formatYearLabel(nodeB.origin_year ?? nodeB.originYear ?? 0)})
              </span>
              <button
                type="button"
                className="comparison-change-btn"
                onClick={() => {
                  setSearchTarget('B');
                  setSelectorSearch('');
                }}
              >
                Change Tradition
              </button>
            </div>
          ) : (
            <div className="comparison-selector-card comparison-selector-card--empty">
              <Sparkles size={24} className="comparison-empty-icon" />
              <h4>Select a second tradition</h4>
              <p>Compare doctrine, chronology, and shared lineages</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setSearchTarget('B');
                  setSelectorSearch('');
                }}
              >
                Choose Tradition B
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {nodeB && (
          <div
            className="comparison-body"
            tabIndex={0}
            role="region"
            aria-label={`Comparison details between ${nodeA.title} and ${nodeB.title}`}
          >
            {/* Direct Relationship Banner */}
            {directConnections.length > 0 ? (
              <div className="comparison-relationship-banner comparison-relationship-banner--connected">
                <div className="comparison-relationship-banner__header">
                  <Sparkles size={18} />
                  <span>Direct Theological Link Documented</span>
                </div>
                <div className="comparison-relationship-banner__items">
                  {directConnections.map((conn, idx) => {
                    const isFromAtoB = conn.source === nodeA.id;
                    const sourceTitle = isFromAtoB ? nodeA.title : nodeB.title;
                    const targetTitle = isFromAtoB ? nodeB.title : nodeA.title;
                    const relLabel = formatTaxonomyLabel(
                      conn.relation_type || conn.type,
                    );
                    const tierLabel = formatTaxonomyLabel(
                      conn.epistemic_tier || conn.certainty,
                    );

                    return (
                      <div key={idx} className="comparison-relation-item">
                        <div className="comparison-relation-item__path">
                          <strong>{sourceTitle}</strong>
                          <span className="comparison-relation-badge">{relLabel}</span>
                          <strong>{targetTitle}</strong>
                          <span className="comparison-tier-badge">{tierLabel}</span>
                        </div>
                        {conn.citation && (
                          <p className="comparison-relation-item__citation">
                            &ldquo;{conn.citation}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="comparison-relationship-banner comparison-relationship-banner--independent">
                <Compass size={18} />
                <span>
                  No direct relation is recorded in this dataset.
                </span>
              </div>
            )}

            {/* Chronological and Geographical Overlap */}
            <div className="comparison-section comparison-section--metrics">
              <h4 className="comparison-section__title">
                <Calendar size={16} />
                Chronology & Geography
              </h4>
              <div className="comparison-metrics-grid">
                <div className="comparison-metric-card">
                  <span className="comparison-metric-card__label">Timeline Delta</span>
                  <span className="comparison-metric-card__value">
                    {chronology?.diff === 0
                      ? 'Same Era'
                      : `${chronology?.diff.toLocaleString('en-US')} Years`}
                  </span>
                  <p className="comparison-metric-card__desc">{chronology?.summaryText}</p>
                </div>

                <div className="comparison-metric-card">
                  <span className="comparison-metric-card__label">Geographic Separation</span>
                  <span className="comparison-metric-card__value">
                    {geoDistance != null ? `~${geoDistance.toLocaleString('en-US')} km` : 'Worldwide / Trans-regional'}
                  </span>
                  <p className="comparison-metric-card__desc">
                    {nodeA.origin_geo?.place_name || nodeA.originGeo?.place_name || 'Eurasian core'} &rarr;{' '}
                    {nodeB.origin_geo?.place_name || nodeB.originGeo?.place_name || 'Eurasian core'}
                  </p>
                </div>
              </div>
            </div>

            {/* Shared Connections (Graph Intersection) */}
            {sharedConnections.length > 0 && (
              <div className="comparison-section">
                <h4 className="comparison-section__title">
                  <Layers size={16} />
                  Shared Connections ({sharedConnections.length})
                </h4>
                <p className="comparison-section__subtitle">
                  Traditions directly connected to both {nodeA.title} and {nodeB.title} in the dataset:
                </p>
                <div className="comparison-shared-grid">
                  {sharedConnections.map(({ node: shared, relationsA, relationsB }) => (
                    <div key={shared.id} className="comparison-shared-card">
                      <div className="comparison-shared-card__header">
                        <button
                          type="button"
                          className="comparison-pill"
                          onClick={() => onSelectNodeB(shared.id)}
                          title={`Switch Tradition B to ${shared.title}`}
                        >
                          <span
                            className="comparison-pill__dot"
                            style={{ backgroundColor: shared.color }}
                          />
                          <span className="comparison-shared-card__title">{shared.title}</span>
                          <span className="comparison-shared-card__cluster">{shared.cluster}</span>
                        </button>
                      </div>
                      <div className="comparison-shared-card__relations">
                        <div className="comparison-shared-relation">
                          <span className="comparison-shared-relation__prefix">{nodeA.title}:</span>
                          {relationsA.map((r, i) => (
                            <div key={i} className="comparison-shared-relation__item">
                              <span className="comparison-relation-badge">
                                {r.direction === 'outbound' ? `→ ${r.typeLabel}` : `← ${r.typeLabel}`}
                              </span>
                              <span className="comparison-tier-badge">{r.tierLabel}</span>
                              {r.citation && (
                                <span className="comparison-citation-tag" title={r.citation}>
                                  Cited
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="comparison-shared-relation">
                          <span className="comparison-shared-relation__prefix">{nodeB.title}:</span>
                          {relationsB.map((r, i) => (
                            <div key={i} className="comparison-shared-relation__item">
                              <span className="comparison-relation-badge">
                                {r.direction === 'outbound' ? `→ ${r.typeLabel}` : `← ${r.typeLabel}`}
                              </span>
                              <span className="comparison-tier-badge">{r.tierLabel}</span>
                              {r.citation && (
                                <span className="comparison-citation-tag" title={r.citation}>
                                  Cited
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core Tenets Matrix */}
            <div className="comparison-section">
              <h4 className="comparison-section__title">
                <BookOpen size={16} />
                Core Tenets & Philosophy
              </h4>
              <div className="comparison-matrix-row">
                {/* Side A Tenets */}
                <div className="comparison-matrix-col">
                  <div
                    className="comparison-matrix-col__header"
                    style={{ borderLeftColor: nodeA.color }}
                  >
                    <h5>{nodeA.title}</h5>
                  </div>
                  {((nodeA.key_tenets && nodeA.key_tenets.length > 0) ||
                    (nodeA.keyTenets && nodeA.keyTenets.length > 0)) ? (
                    <ul className="comparison-tenets-list">
                      {(nodeA.key_tenets || nodeA.keyTenets || []).map((tenet, idx) => (
                        <li key={idx}>
                          <span
                            className="comparison-tenet-bullet"
                            style={{ backgroundColor: nodeA.color }}
                          />
                          <span>{tenet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="comparison-tenets-empty">No itemized tenets listed in frontmatter.</p>
                  )}
                </div>

                {/* Side B Tenets */}
                <div className="comparison-matrix-col">
                  <div
                    className="comparison-matrix-col__header"
                    style={{ borderLeftColor: nodeB.color }}
                  >
                    <h5>{nodeB.title}</h5>
                  </div>
                  {((nodeB.key_tenets && nodeB.key_tenets.length > 0) ||
                    (nodeB.keyTenets && nodeB.keyTenets.length > 0)) ? (
                    <ul className="comparison-tenets-list">
                      {(nodeB.key_tenets || nodeB.keyTenets || []).map((tenet, idx) => (
                        <li key={idx}>
                          <span
                            className="comparison-tenet-bullet"
                            style={{ backgroundColor: nodeB.color }}
                          />
                          <span>{tenet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="comparison-tenets-empty">No itemized tenets listed in frontmatter.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Canonical Texts */}
            <div className="comparison-section">
              <h4 className="comparison-section__title">
                <BookOpen size={16} />
                Canonical Texts & Sacred Scriptures
              </h4>
              <div className="comparison-matrix-row">
                <div className="comparison-matrix-col">
                  <div
                    className="comparison-matrix-col__header"
                    style={{ borderLeftColor: nodeA.color }}
                  >
                    <h5>{nodeA.title}</h5>
                  </div>
                  {nodeA.canonicalTexts && nodeA.canonicalTexts.length > 0 ? (
                    <ul className="comparison-texts-list">
                      {nodeA.canonicalTexts.map((text, idx) => (
                        <li key={idx}>{text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="comparison-tenets-empty">Oral tradition or decentralized canon.</p>
                  )}
                </div>

                <div className="comparison-matrix-col">
                  <div
                    className="comparison-matrix-col__header"
                    style={{ borderLeftColor: nodeB.color }}
                  >
                    <h5>{nodeB.title}</h5>
                  </div>
                  {nodeB.canonicalTexts && nodeB.canonicalTexts.length > 0 ? (
                    <ul className="comparison-texts-list">
                      {nodeB.canonicalTexts.map((text, idx) => (
                        <li key={idx}>{text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="comparison-tenets-empty">Oral tradition or decentralized canon.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Visual Artifacts Side-by-Side */}
            <div className="comparison-section">
              <h4 className="comparison-section__title">
                <Sparkles size={16} />
                Authentic Visual Artifacts
              </h4>
              <div className="comparison-matrix-row">
                {/* Artifacts A */}
                <div className="comparison-matrix-col">
                  <div
                    className="comparison-matrix-col__header"
                    style={{ borderLeftColor: nodeA.color }}
                  >
                    <h5>{nodeA.title}</h5>
                  </div>
                  <div className="comparison-artifacts-grid">
                    {nodeA.artifacts && nodeA.artifacts.length > 0 ? (
                      nodeA.artifacts.map((art, idx) => {
                        const imgUrl = resolveAssetPath(art.imageUrl || art.url || art.image_url);
                        return (
                          <button
                            key={idx}
                            type="button"
                            className="comparison-artifact-card"
                            onClick={() =>
                              setActiveArtifact({ artifact: art, traditionTitle: nodeA.title })
                            }
                            aria-label={`Inspect ${art.title}`}
                          >
                            <div className="comparison-artifact-card__image-wrap">
                              <img src={imgUrl} alt={art.title} loading="lazy" />
                              <span className="comparison-artifact-card__zoom-hint">
                                <Maximize2 size={14} />
                              </span>
                            </div>
                            <span className="comparison-artifact-card__title">{art.title}</span>
                            <span className="comparison-artifact-card__provenance">
                              {art.provenance}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="comparison-tenets-empty">No visual artifacts available.</p>
                    )}
                  </div>
                </div>

                {/* Artifacts B */}
                <div className="comparison-matrix-col">
                  <div
                    className="comparison-matrix-col__header"
                    style={{ borderLeftColor: nodeB.color }}
                  >
                    <h5>{nodeB.title}</h5>
                  </div>
                  <div className="comparison-artifacts-grid">
                    {nodeB.artifacts && nodeB.artifacts.length > 0 ? (
                      nodeB.artifacts.map((art, idx) => {
                        const imgUrl = resolveAssetPath(art.imageUrl || art.url || art.image_url);
                        return (
                          <button
                            key={idx}
                            type="button"
                            className="comparison-artifact-card"
                            onClick={() =>
                              setActiveArtifact({ artifact: art, traditionTitle: nodeB.title })
                            }
                            aria-label={`Inspect ${art.title}`}
                          >
                            <div className="comparison-artifact-card__image-wrap">
                              <img src={imgUrl} alt={art.title} loading="lazy" />
                              <span className="comparison-artifact-card__zoom-hint">
                                <Maximize2 size={14} />
                              </span>
                            </div>
                            <span className="comparison-artifact-card__title">{art.title}</span>
                            <span className="comparison-artifact-card__provenance">
                              {art.provenance}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="comparison-tenets-empty">No visual artifacts available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Summaries */}
            <div className="comparison-section">
              <h4 className="comparison-section__title">
                <BookOpen size={16} />
                Overview & Historical Background
              </h4>
              <div className="comparison-matrix-row">
                <div
                  className="comparison-matrix-col comparison-doc-body"
                  tabIndex={0}
                  role="region"
                  aria-label={`Historical overview for ${nodeA.title}`}
                >
                  <div
                    className="comparison-matrix-col__header"
                    style={{ borderLeftColor: nodeA.color }}
                  >
                    <h5>{nodeA.title}</h5>
                  </div>
                  <div className="comparison-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {nodeA.content || nodeA.summary}
                    </ReactMarkdown>
                  </div>
                </div>

                <div
                  className="comparison-matrix-col comparison-doc-body"
                  tabIndex={0}
                  role="region"
                  aria-label={`Historical overview for ${nodeB.title}`}
                >
                  <div
                    className="comparison-matrix-col__header"
                    style={{ borderLeftColor: nodeB.color }}
                  >
                    <h5>{nodeB.title}</h5>
                  </div>
                  <div className="comparison-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {nodeB.content || nodeB.summary}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Target Selector Dropdown Modal */}
      {searchTarget && (
        <div className="comparison-picker-overlay">
          <div
            className="comparison-picker-backdrop"
            onClick={() => setSearchTarget(null)}
          />
          <div className="comparison-picker-modal">
            <div className="comparison-picker-header">
              <h3>Select Tradition {searchTarget}</h3>
              <button
                type="button"
                className="comparison-header__close-btn"
                onClick={() => setSearchTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="comparison-picker-search">
              <Search size={16} />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search by tradition name, cluster, or tenets…"
                value={selectorSearch}
                onChange={(e) => setSelectorSearch(e.target.value)}
              />
            </div>

            <div className="comparison-picker-list">
              {filteredNodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className="comparison-picker-item"
                  onClick={() => {
                    if (searchTarget === 'A') {
                      onSelectNodeA(node.id);
                    } else {
                      onSelectNodeB(node.id);
                    }
                    setSearchTarget(null);
                  }}
                >
                  <span
                    className="comparison-color-dot"
                    style={{ backgroundColor: node.color }}
                  />
                  <div className="comparison-picker-item__text">
                    <strong>{node.title}</strong>
                    <span>
                      {node.cluster} &middot; {node.eraStart}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for visual artifacts */}
      <Lightbox
        open={Boolean(activeArtifact)}
        artifact={activeArtifact?.artifact ?? null}
        accentColor={nodeA.color}
        onClose={() => setActiveArtifact(null)}
      />
    </div>
  );
}

export default ComparisonModal;
