/* SPDX-License-Identifier: AGPL-3.0-or-later OR LicenseRef-OpenGrail-Commercial */
/* See LICENSE and LICENSE-COMMERCIAL.md for the applicable terms. */

import { useEffect, useMemo, useState, type CSSProperties, type SVGProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  EPISTEMIC_TIER_OPTIONS,
  RELATION_TYPE_OPTIONS,
  formatTaxonomyLabel,
  type EpistemicTier,
  type GraphLink,
  type GraphNode,
  type RelationRef,
  type RelationType,
  type TraditionArtifact,
} from "../types/graph";
import { formatYearLabel } from "./TimelineScrubber";
import { DocumentFeedback } from "./DocumentFeedback";

export interface DocumentPaneProps {
  selectedNode: GraphNode | null;
  selectedLink?: GraphLink | null;
  nodes: GraphNode[];
  links?: GraphLink[];
  open: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon({ direction, ...props }: SVGProps<SVGSVGElement> & { direction: "inbound" | "outbound" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d={direction === "inbound" ? "M16 10H4m0 0 4-4m-4 4 4 4" : "M4 10h12m0 0-4-4m4 4-4 4"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v12H7.5A2.5 2.5 0 0 1 5 16.5v-12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 16.5A2.5 2.5 0 0 1 8 14h9M9 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="m9.5 14.5 5-5M7.5 17.5l-1 1a3.54 3.54 0 0 1-5-5l3-3a3.54 3.54 0 0 1 5 0M16.5 6.5l1-1a3.54 3.54 0 0 1 5 5l-3 3a3.54 3.54 0 0 1-5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 21s-7-6.5-7-11.5a7 7 0 1 1 14 0c0 5-7 11.5-7 11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function QuoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c0 4-2 6-5 6v2zm13 0c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c0 4-2 6-5 6v2z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

function ExternalLinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LibraryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6h10M6 10h10M6 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LandmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2 3 7h18l-9-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatMetadataLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toLocaleUpperCase());
}

function metadataClass(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const RELATION_DESCRIPTIONS: Record<RelationType, string> = {
  branch_of: "Direct denomination, regional branch, or school within a broader tradition (Solid line)",
  diverged_from: "Direct historical offshoot or lineage divergence (Solid line)",
  schism: "Major documented ecclesiastical break or theological schism (Solid line)",
  influenced_by: "Documented historical, cultural, or textual influence (Dotted line)",
  syncretized_with: "Blended practices or theological synthesis across traditions (Dotted line)",
  parallel_concept: "Thematic or conceptual parallel without direct genetic lineage (Dotted line)",
  fringe_reinterpretation: "Alternative, esoteric, or speculative reinterpretation (Dotted line)",
};

const TIER_DESCRIPTIONS: Record<EpistemicTier, string> = {
  academic_consensus: "Broadly established and supported by mainstream academic literature.",
  minority_scholarly: "Documented scholarly perspective without universal academic consensus.",
  theological_claim: "Confessional claim grounded in internal tradition or sacred texts.",
  speculative_fringe: "Speculative or contested hypothesis outside mainstream historical consensus.",
};

interface RelationListProps {
  direction: "inbound" | "outbound";
  relations: RelationRef[];
  nodeById: Map<string, GraphNode>;
  onSelectNode: (nodeId: string) => void;
}

function RelationList({ direction, relations, nodeById, onSelectNode }: RelationListProps) {
  const [filter, setFilter] = useState<"all" | "solid" | "dotted">("all");
  const inbound = direction === "inbound";
  const branchCount = relations.filter((relation) => relation.type === "branch_of").length;
  const heading = inbound
    ? branchCount > 0 ? "Branches & inbound links" : "Inbound backlinks"
    : "Parents & outbound links";

  const solidRelations = useMemo(
    () => relations.filter((r) => r.style === "solid" || r.type === "branch_of" || r.type === "diverged_from" || r.type === "schism"),
    [relations],
  );
  const dottedRelations = useMemo(
    () => relations.filter((r) => r.style === "dotted" || (r.type !== "branch_of" && r.type !== "diverged_from" && r.type !== "schism")),
    [relations],
  );

  const displayedRelations = useMemo(() => {
    if (filter === "solid") return solidRelations;
    if (filter === "dotted") return dottedRelations;
    return relations;
  }, [dottedRelations, filter, relations, solidRelations]);

  return (
    <section className={`relation-group relation-group--${direction}`}>
      <header className="relation-group__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="relation-group__icon" aria-hidden="true">
            <ArrowIcon direction={direction} />
          </span>
          <h3>{heading}</h3>
          <span className="relation-group__count">{relations.length}</span>
        </div>

        {relations.length > 3 && (
          <div className="relation-filter-tabs">
            <button
              type="button"
              className={`relation-filter-tab ${filter === "all" ? "is-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({relations.length})
            </button>
            {solidRelations.length > 0 && (
              <button
                type="button"
                className={`relation-filter-tab ${filter === "solid" ? "is-active" : ""}`}
                onClick={() => setFilter("solid")}
                title="Direct branches and schisms (solid lines)"
              >
                ━ Lineage ({solidRelations.length})
              </button>
            )}
            {dottedRelations.length > 0 && (
              <button
                type="button"
                className={`relation-filter-tab ${filter === "dotted" ? "is-active" : ""}`}
                onClick={() => setFilter("dotted")}
                title="Thematic parallels and influences (dotted lines)"
              >
                ┄ Dotted ({dottedRelations.length})
              </button>
            )}
          </div>
        )}
      </header>

      {displayedRelations.length > 0 ? (
        <ul className="relation-list">
          {displayedRelations.map((relation, index) => {
            const relatedNode = nodeById.get(relation.nodeId);
            const relatedTitle = relatedNode?.title ?? relation.title;
            const relationKey = `${direction}-${relation.nodeId}-${relation.type}-${index}`;
            const isDotted = relation.style === "dotted" || (relation.type !== "branch_of" && relation.type !== "diverged_from" && relation.type !== "schism");
            const relationDesc = RELATION_DESCRIPTIONS[relation.type] || "Comparative relation";
            const placeName = relatedNode?.origin_geo?.place_name || relatedNode?.originGeo?.place_name;

            return (
              <li className="relation-list__item" key={relationKey}>
                <div
                  className={`relation-card ${isDotted ? "relation-card--dotted" : "relation-card--solid"}`}
                  style={{ "--related-node-color": relatedNode?.color ?? "#94a3b8" } as CSSProperties}
                >
                  <button
                    type="button"
                    className="relation-card__main-action"
                    onClick={() => onSelectNode(relation.nodeId)}
                    aria-label={`Open ${relatedTitle}, ${formatMetadataLabel(relation.type)}`}
                  >
                    <span className="relation-card__node-dot" aria-hidden="true" />
                    <span className="relation-card__content">
                      <span className="relation-card__topline">
                        <span className="relation-card__title">{relatedTitle}</span>
                        <span className="relation-card__line-indicator" title={isDotted ? "Dotted connection (Parallel / Influence)" : "Solid connection (Direct branch / Schism)"}>
                          {isDotted ? "┄ Dotted Arc" : "━ Solid Arc"}
                        </span>
                        <ArrowIcon direction={direction} className="relation-card__arrow" />
                      </span>

                      <span className="relation-card__metadata">
                        <span className={`relation-card__type relation-card__type--${metadataClass(relation.type)}`}>
                          {formatMetadataLabel(relation.type)}
                        </span>
                        <span
                          className={`relation-card__certainty relation-card__certainty--${metadataClass(relation.certainty)}`}
                          title={TIER_DESCRIPTIONS[relation.certainty]}
                        >
                          {formatMetadataLabel(relation.certainty)}
                        </span>
                        {relatedNode?.eraStart && (
                          <span className="relation-card__era">{relatedNode.eraStart}</span>
                        )}
                        {placeName && (
                          <span className="relation-card__place" title={placeName}>
                            📍 {placeName.split(",")[0]}
                          </span>
                        )}
                      </span>

                      {relatedNode?.summary && (
                        <p className="relation-card__summary-snippet">
                          {relatedNode.summary}
                        </p>
                      )}

                      <span className="relation-card__desc-note">
                        {relationDesc}
                      </span>
                    </span>
                  </button>

                  {relation.citation && (
                    <div className="relation-card__citation-box">
                      <QuoteIcon className="relation-card__quote-icon" />
                      <span className="relation-card__citation-text">
                        <strong>Source:</strong> {relation.citation}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="relation-group__empty">
          {inbound ? "No recorded inbound connections match the filter." : "No recorded outbound relations match the filter."}
        </p>
      )}
    </section>
  );
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

export default function DocumentPane({
  selectedNode,
  selectedLink,
  nodes,
  open,
  onClose,
  onSelectNode,
}: DocumentPaneProps) {
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const inertWhenClosed = open ? {} : ({ inert: "" } as Record<string, string>);
  const [activeArtifact, setActiveArtifact] = useState<TraditionArtifact | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveArtifact(null);
  }, [selectedNode?.id]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activeArtifact) {
          setActiveArtifact(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeArtifact, onClose, open]);

  // If inspecting an edge
  if (selectedLink && !selectedNode) {
    const sourceNode = nodeById.get(selectedLink.source);
    const targetNode = nodeById.get(selectedLink.target);
    const canonicalType = selectedLink.relation_type || selectedLink.relationType || 'thematic_parallel';
    const epistemicTier = (selectedLink.epistemic_tier || selectedLink.epistemicTier || selectedLink.certainty) as EpistemicTier;
    const isDotted = selectedLink.style === 'dotted' || (selectedLink.type !== 'branch_of' && selectedLink.type !== 'diverged_from' && selectedLink.type !== 'schism');
    const tierOption = EPISTEMIC_TIER_OPTIONS.find((t) => t.value === epistemicTier);
    const relationOption = RELATION_TYPE_OPTIONS.find((r) => r.value === selectedLink.type);

    return (
      <aside
        className={`document-pane${open ? " document-pane--open" : ""}`}
        style={{ "--document-accent": "#64d8c0" } as CSSProperties}
        aria-label="Relation details"
        aria-hidden={!open}
        data-open={open}
        {...inertWhenClosed}
      >
        <header className="document-pane__header">
          <div className="document-pane__identity">
            <span className="document-pane__node-mark" aria-hidden="true" />
            <div>
              <span className="document-pane__eyebrow">Relation inspection</span>
              <h2 className="document-pane__title">{formatTaxonomyLabel(selectedLink.type)}</h2>
            </div>
          </div>
          <button
            className="document-pane__close icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close relation inspector"
            title="Close inspector"
            tabIndex={open ? 0 : -1}
          >
            <CloseIcon className="icon-button__icon" />
          </button>
        </header>

        <div className="document-pane__scroll">
          <section className="document-overview" aria-label="Relation metadata">
            <div className="document-badges">
              <span
                className={`document-badge document-badge--tier document-badge--${metadataClass(epistemicTier)}`}
                title={tierOption?.description || "Epistemic tier"}
              >
                <span className="document-badge__status" aria-hidden="true" />
                {formatMetadataLabel(epistemicTier)}
              </span>
              <span
                className={`document-badge ${isDotted ? "document-badge--dotted" : "document-badge--solid"}`}
                title={isDotted ? "Dotted connection on map & graph: conceptual or comparative parallel" : "Solid line: direct lineage or schism"}
              >
                {isDotted ? "┄ Dotted Arc (Parallel)" : "━ Solid Arc (Lineage)"}
              </span>
              <span className="document-badge document-badge--cluster" title="Canonical type">
                {formatTaxonomyLabel(canonicalType)}
              </span>
            </div>

            {/* Relation Flow Diagram Card */}
            <div className="edge-diagram-card">
              <div className="edge-diagram-flow">
                <span className="edge-diagram-flow__point" style={{ color: sourceNode?.color ?? "#94a3b8" }}>
                  ● {sourceNode?.title ?? selectedLink.source}
                </span>
                <span className="edge-diagram-flow__line">
                  {isDotted ? "┄┄┄┄┄▶" : "━━━━━▶"}
                </span>
                <span className="edge-diagram-flow__point" style={{ color: targetNode?.color ?? "#94a3b8" }}>
                  ● {targetNode?.title ?? selectedLink.target}
                </span>
              </div>
              <p className="edge-diagram-desc">
                {relationOption?.description || RELATION_DESCRIPTIONS[selectedLink.type] || "Comparative relation between traditions."}
              </p>
              <div className="edge-diagram-tier-note">
                <strong>Epistemic Grounding:</strong> {tierOption?.description || TIER_DESCRIPTIONS[epistemicTier]}
              </div>
            </div>

            <div className="edge-endpoints" style={{ marginTop: '1.2rem' }}>
              <div className="edge-endpoint-card">
                <span className="edge-endpoint-label">Source tradition (Origin)</span>
                {sourceNode ? (
                  <button
                    type="button"
                    className="relation-card"
                    style={{ "--related-node-color": sourceNode.color } as CSSProperties}
                    onClick={() => onSelectNode(sourceNode.id)}
                  >
                    <span className="relation-card__node-dot" aria-hidden="true" />
                    <span className="relation-card__content">
                      <span className="relation-card__title">{sourceNode.title}</span>
                      <span className="relation-card__metadata">
                        <span>{sourceNode.eraStart}</span> · <span>{sourceNode.cluster}</span>
                        {sourceNode.origin_geo?.place_name && (
                          <span> · 📍 {sourceNode.origin_geo.place_name}</span>
                        )}
                      </span>
                      <p className="relation-card__summary-snippet">{sourceNode.summary}</p>
                    </span>
                  </button>
                ) : (
                  <span>{selectedLink.source}</span>
                )}
              </div>

              <div className="edge-endpoint-card" style={{ marginTop: '0.8rem' }}>
                <span className="edge-endpoint-label">Target tradition (Destination)</span>
                {targetNode ? (
                  <button
                    type="button"
                    className="relation-card"
                    style={{ "--related-node-color": targetNode.color } as CSSProperties}
                    onClick={() => onSelectNode(targetNode.id)}
                  >
                    <span className="relation-card__node-dot" aria-hidden="true" />
                    <span className="relation-card__content">
                      <span className="relation-card__title">{targetNode.title}</span>
                      <span className="relation-card__metadata">
                        <span>{targetNode.eraStart}</span> · <span>{targetNode.cluster}</span>
                        {targetNode.origin_geo?.place_name && (
                          <span> · 📍 {targetNode.origin_geo.place_name}</span>
                        )}
                      </span>
                      <p className="relation-card__summary-snippet">{targetNode.summary}</p>
                    </span>
                  </button>
                ) : (
                  <span>{selectedLink.target}</span>
                )}
              </div>
            </div>

            <div className="edge-citation-section" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                Scholarly citation &amp; evidence
              </h3>
              {selectedLink.citation ? (
                <blockquote className="edge-citation-blockquote">
                  <QuoteIcon className="edge-citation-quote-icon" />
                  <p>{selectedLink.citation}</p>
                </blockquote>
              ) : (
                <p className="edge-citation-none">
                  No explicit citation string recorded; relation classified under {formatMetadataLabel(epistemicTier)} taxonomy.
                </p>
              )}
            </div>
          </section>
        </div>
      </aside>
    );
  }

  if (!selectedNode) return null;

  const inbound = selectedNode.backlinks?.inbound ?? [];
  const outbound = selectedNode.backlinks?.outbound ?? [];
  const relationCount = inbound.length + outbound.length;

  const originPlace = selectedNode.origin_geo?.place_name || selectedNode.originGeo?.place_name;
  const extinctYear = selectedNode.extinct_year ?? selectedNode.extinctYear;

  return (
    <aside
      className={`document-pane${open ? " document-pane--open" : ""}`}
      style={{ "--document-accent": selectedNode.color } as CSSProperties}
      aria-label={`${selectedNode.title} document`}
      aria-hidden={!open}
      data-open={open}
      {...inertWhenClosed}
    >
      <header className="document-pane__header">
        <div className="document-pane__identity">
          <span className="document-pane__node-mark" aria-hidden="true" />
          <div>
            <span className="document-pane__eyebrow">Tradition document</span>
            <h2 className="document-pane__title">{selectedNode.title}</h2>
          </div>
        </div>
        <button
          className="document-pane__close icon-button"
          type="button"
          onClick={onClose}
          aria-label={`Close ${selectedNode.title}`}
          title="Close document"
          tabIndex={open ? 0 : -1}
        >
          <CloseIcon className="icon-button__icon" />
        </button>
      </header>

      <div className="document-pane__scroll">
        <section className="document-overview" aria-label="Document metadata">
          <div className="document-badges">
            <span
              className={`document-badge document-badge--tier document-badge--${metadataClass(selectedNode.epistemicTier)}`}
              title="Epistemic tier"
            >
              <span className="document-badge__status" aria-hidden="true" />
              {formatMetadataLabel(selectedNode.epistemicTier)}
            </span>
            <span className="document-badge document-badge--era" title="Origin era">
              {selectedNode.eraStart}
            </span>
            <span className="document-badge document-badge--cluster" title="Tradition cluster">
              {selectedNode.cluster}
            </span>
            {extinctYear !== null && extinctYear !== undefined && (
              <span className="document-badge document-badge--extinct" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }} title="Historical status">
                Extinct c. {formatYearLabel(extinctYear)}
              </span>
            )}
            {selectedNode.displayWeight > 1 && (
              <span
                className="document-badge document-badge--hub"
                title="Editorial prominence keeps this umbrella tradition visible at overview zoom; it is not an adherent count."
              >
                Atlas hub
              </span>
            )}
          </div>

          {originPlace && (
            <div className="document-geo-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.6rem' }}>
              <MapPinIcon style={{ width: 14, height: 14, color: selectedNode.color }} />
              <span>{originPlace}</span>
            </div>
          )}

          <p className="document-overview__summary">{selectedNode.summary}</p>

          {/* Key Tenets & Core Beliefs Card */}
          {((selectedNode.key_tenets && selectedNode.key_tenets.length > 0) ||
            (selectedNode.keyTenets && selectedNode.keyTenets.length > 0)) && (
            <div className="key-tenets-card">
              <div className="key-tenets-header">
                <CompassIcon className="key-tenets-icon" />
                <h3>Core Tenets &amp; Beliefs</h3>
              </div>
              <ul className="key-tenets-list">
                {(selectedNode.key_tenets || selectedNode.keyTenets || []).map((tenet, idx) => (
                  <li key={idx} className="key-tenet-item">
                    <span className="key-tenet-badge">0{idx + 1}</span>
                    <span className="key-tenet-text">{tenet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Historical Artifacts & Sacred Imagery Gallery */}
          {selectedNode.artifacts && selectedNode.artifacts.length > 0 && (
            <div className="artifacts-section">
              <div className="artifacts-section__header">
                <LandmarkIcon className="artifacts-section__icon" />
                <h3>Historical Artifacts &amp; Imagery</h3>
              </div>
              <div className="artifacts-grid">
                {selectedNode.artifacts.map((art, idx) => {
                  const imgPath = resolveAssetPath(art.imageUrl || art.url);
                  const isFailed = !imgPath || failedImages[imgPath];
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="artifact-card"
                      onClick={() => setActiveArtifact(art)}
                      title={`Inspect ${art.title}`}
                    >
                      {imgPath && !isFailed ? (
                        <div className="artifact-thumb-wrap">
                          <img
                            src={imgPath}
                            alt={art.title}
                            className="artifact-thumb"
                            loading="lazy"
                            onError={() => imgPath && setFailedImages((prev) => ({ ...prev, [imgPath]: true }))}
                          />
                          <div className="artifact-thumb-overlay">
                            <span>🔍 Inspect</span>
                          </div>
                        </div>
                      ) : (
                        <div className="artifact-thumb-fallback" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                          <LandmarkIcon style={{ width: 28, height: 28, color: selectedNode.color, opacity: 0.85 }} />
                        </div>
                      )}
                      <div className="artifact-info">
                        <span className="artifact-title">{art.title}</span>
                        {(art.provenance || art.period) && (
                          <span className="artifact-meta">
                            {art.provenance && <span>📍 {art.provenance}</span>}
                            {art.period && <span> · ⏳ {art.period}</span>}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedNode.aliases.length > 0 && (
            <p className="document-overview__aliases">
              <span>Also known as</span>
              {selectedNode.aliases.join(" · ")}
            </p>
          )}

          {selectedNode.canonicalTexts.length > 0 && (
            <div className="canonical-texts">
              <div className="canonical-texts__heading">
                <BookIcon className="canonical-texts__icon" />
                <h3>Primary texts</h3>
              </div>
              <ul className="canonical-texts__list">
                {selectedNode.canonicalTexts.map((text) => (
                  <li className="canonical-texts__item" key={text}>{text}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Scholarly Sources & References */}
          {selectedNode.sources && selectedNode.sources.length > 0 && (
            <div className="sources-section">
              <div className="sources-section__header">
                <LibraryIcon className="sources-section__icon" />
                <h3>Scholarly References &amp; Sources</h3>
              </div>
              <ul className="sources-list">
                {selectedNode.sources.map((src, idx) => {
                  const title = typeof src === "string" ? src : src.title;
                  const url = typeof src === "string" ? null : src.url;
                  return (
                    <li key={idx} className="source-item">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-link"
                          title={`Open ${title} in new tab`}
                        >
                          <span>{title}</span>
                          <ExternalLinkIcon className="source-link__icon" />
                        </a>
                      ) : (
                        <span className="source-text">{title}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <article className="document-content markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNode.content}</ReactMarkdown>
        </article>

        <section className="backlinks" aria-labelledby="backlinks-heading">
          <header className="backlinks__header">
            <div className="backlinks__heading-wrap">
              <LinkIcon className="backlinks__icon" />
              <div>
                <span className="backlinks__eyebrow">Knowledge graph</span>
                <h2 id="backlinks-heading">Backlinks &amp; relations</h2>
              </div>
            </div>
            <span className="backlinks__total">{relationCount}</span>
          </header>

          <RelationList
            direction="inbound"
            relations={inbound}
            nodeById={nodeById}
            onSelectNode={onSelectNode}
          />
          <RelationList
            direction="outbound"
            relations={outbound}
            nodeById={nodeById}
            onSelectNode={onSelectNode}
          />
        </section>

        {/* Community Verification, Upvotes & Correction Suggestions */}
        <DocumentFeedback node={selectedNode} />
      </div>

      {/* Lightbox Modal for Full-Size Artifact Inspection */}
      {activeArtifact && (
        <div
          className="artifact-lightbox-backdrop"
          onClick={() => setActiveArtifact(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeArtifact.title}
        >
          <div className="artifact-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="artifact-lightbox-close icon-button"
              onClick={() => setActiveArtifact(null)}
              aria-label="Close image preview"
            >
              <CloseIcon className="icon-button__icon" />
            </button>
            {(() => {
              const imgPath = resolveAssetPath(activeArtifact.imageUrl || activeArtifact.url);
              const isFailed = !imgPath || failedImages[imgPath];
              const sourceLink = activeArtifact.sourceUrl || (activeArtifact.url?.startsWith('http') ? activeArtifact.url : undefined);

              return (
                <>
                  {imgPath && !isFailed ? (
                    <div className="artifact-lightbox-img-wrap">
                      <img
                        src={imgPath}
                        alt={activeArtifact.title}
                        className="artifact-lightbox-img"
                        onError={() => imgPath && setFailedImages((prev) => ({ ...prev, [imgPath]: true }))}
                      />
                    </div>
                  ) : (
                    <div className="artifact-lightbox-img-wrap" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <LandmarkIcon style={{ width: 44, height: 44, color: selectedNode.color, opacity: 0.85 }} />
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Archival artifact representation</span>
                    </div>
                  )}
                  <div className="artifact-lightbox-content">
                    <h3 className="artifact-lightbox-title">{activeArtifact.title}</h3>
                    <div className="artifact-lightbox-badges">
                      {activeArtifact.provenance && (
                        <span className="document-badge">📍 {activeArtifact.provenance}</span>
                      )}
                      {activeArtifact.period && (
                        <span className="document-badge document-badge--era">⏳ {activeArtifact.period}</span>
                      )}
                    </div>
                    {activeArtifact.description && (
                      <p className="artifact-lightbox-desc">{activeArtifact.description}</p>
                    )}
                    {sourceLink && (
                      <div style={{ marginTop: '14px' }}>
                        <a
                          href={sourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-link"
                          style={{ display: 'inline-flex', fontSize: '0.85rem', color: '#93c5fd' }}
                        >
                          <span>Verify entry on Wikipedia / Archive</span>
                          <ExternalLinkIcon className="source-link__icon" />
                        </a>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </aside>
  );
}


