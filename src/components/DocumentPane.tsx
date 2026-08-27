/* SPDX-License-Identifier: AGPL-3.0-or-later OR LicenseRef-OpenGrail-Commercial */
/* See LICENSE and LICENSE-COMMERCIAL.md for the applicable terms. */

import { useEffect, useMemo, type CSSProperties, type SVGProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { GraphNode, RelationRef } from "../types/graph";

export interface DocumentPaneProps {
  selectedNode: GraphNode | null;
  nodes: GraphNode[];
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

function formatMetadataLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toLocaleUpperCase());
}

function metadataClass(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-");
}

interface RelationListProps {
  direction: "inbound" | "outbound";
  relations: RelationRef[];
  nodeById: Map<string, GraphNode>;
  onSelectNode: (nodeId: string) => void;
}

function RelationList({ direction, relations, nodeById, onSelectNode }: RelationListProps) {
  const inbound = direction === "inbound";
  const branchCount = relations.filter((relation) => relation.type === "branch_of").length;
  const heading = inbound
    ? branchCount > 0 ? "Branches & inbound links" : "Inbound backlinks"
    : "Parents & outbound links";

  return (
    <section className={`relation-group relation-group--${direction}`}>
      <header className="relation-group__header">
        <span className="relation-group__icon" aria-hidden="true">
          <ArrowIcon direction={direction} />
        </span>
        <h3>{heading}</h3>
        <span className="relation-group__count">{relations.length}</span>
      </header>

      {relations.length > 0 ? (
        <ul className="relation-list">
          {relations.map((relation, index) => {
            const relatedNode = nodeById.get(relation.nodeId);
            const relatedTitle = relatedNode?.title ?? relation.title;
            const relationKey = `${direction}-${relation.nodeId}-${relation.type}-${index}`;

            return (
              <li className="relation-list__item" key={relationKey}>
                <button
                  className="relation-card"
                  style={{ "--related-node-color": relatedNode?.color ?? "#94a3b8" } as CSSProperties}
                  type="button"
                  onClick={() => onSelectNode(relation.nodeId)}
                  aria-label={`Open ${relatedTitle}, ${formatMetadataLabel(relation.type)}`}
                >
                  <span className="relation-card__node-dot" aria-hidden="true" />
                  <span className="relation-card__content">
                    <span className="relation-card__topline">
                      <span className="relation-card__title">{relatedTitle}</span>
                      <ArrowIcon direction={direction} className="relation-card__arrow" />
                    </span>
                    <span className="relation-card__metadata">
                      <span className={`relation-card__type relation-card__type--${metadataClass(relation.type)}`}>
                        {formatMetadataLabel(relation.type)}
                      </span>
                      <span
                        className={`relation-card__certainty relation-card__certainty--${metadataClass(relation.certainty)}`}
                      >
                        {formatMetadataLabel(relation.certainty)}
                      </span>
                    </span>
                    {relation.citation && (
                      <span className="relation-card__citation">{relation.citation}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="relation-group__empty">
          {inbound ? "No recorded inbound connections." : "No recorded parent or outbound relations."}
        </p>
      )}
    </section>
  );
}

export default function DocumentPane({
  selectedNode,
  nodes,
  open,
  onClose,
  onSelectNode,
}: DocumentPaneProps) {
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const inertWhenClosed = open ? {} : ({ inert: "" } as Record<string, string>);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!selectedNode) return null;

  const inbound = selectedNode.backlinks?.inbound ?? [];
  const outbound = selectedNode.backlinks?.outbound ?? [];
  const relationCount = inbound.length + outbound.length;

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
            {selectedNode.displayWeight > 1 && (
              <span
                className="document-badge document-badge--hub"
                title="Editorial prominence keeps this umbrella tradition visible at overview zoom; it is not an adherent count."
              >
                Atlas hub
              </span>
            )}
          </div>

          <p className="document-overview__summary">{selectedNode.summary}</p>

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
                <h2 id="backlinks-heading">Backlinks & influences</h2>
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
      </div>
    </aside>
  );
}
