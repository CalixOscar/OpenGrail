/* SPDX-License-Identifier: MIT */

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";

import { useAtlasState } from "../state/AtlasState";
import { isNodeTemporallyVisible } from "../state/temporalVisibility";
import { scoreGraphNodeSearch, type GraphNode } from "../types/graph";
import SearchCombobox from "./SearchCombobox";

export interface SidebarProps {
  nodes: GraphNode[];
  clusters: string[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ expanded, ...props }: SVGProps<SVGSVGElement> & { expanded?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      data-expanded={expanded || undefined}
      {...props}
    >
      <path
        d="m7.5 4.75 5 5.25-5 5.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseIcon({ collapsed, ...props }: SVGProps<SVGSVGElement> & { collapsed?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 4v16" stroke="currentColor" strokeWidth="1.5" />
      <path
        d={collapsed ? "m13 9 3 3-3 3" : "m16 9-3 3 3 3"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GrailMark() {
  return (
    <svg className="sidebar-brand__mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="3.25" fill="currentColor" />
      <circle cx="10" cy="12" r="2.25" fill="currentColor" opacity=".9" />
      <circle cx="30" cy="11" r="2.25" fill="currentColor" opacity=".75" />
      <circle cx="31" cy="29" r="2.25" fill="currentColor" opacity=".9" />
      <circle cx="9" cy="29" r="2.25" fill="currentColor" opacity=".65" />
      <path d="M12 13.5 17.5 18M28 12.5 22.5 18M29 27.5 22.5 22M11 27.5 17.5 22" stroke="currentColor" strokeWidth="1.4" opacity=".75" />
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1" opacity=".3" />
    </svg>
  );
}

export default function Sidebar({
  nodes,
  clusters,
  selectedNodeId,
  onSelectNode,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const { currentYear, temporalMode, activeTiers } = useAtlasState();
  const searchId = useId();
  const treeId = useId();
  const [query, setQuery] = useState("");

  const temporallyVisibleNodes = useMemo(() => {
    return nodes.filter(
      (node) =>
        activeTiers.has(node.epistemicTier) &&
        isNodeTemporallyVisible(node, currentYear, temporalMode),
    );
  }, [activeTiers, currentYear, nodes, temporalMode]);

  const clusterNames = useMemo(() => {
    const ordered = new Set(clusters);
    temporallyVisibleNodes.forEach((node) => ordered.add(node.cluster));
    return [...ordered];
  }, [clusters, temporallyVisibleNodes]);

  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
    () => new Set(clusterNames),
  );
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(
    () => new Set(),
  );

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const nodeById = useMemo(
    () => new Map(temporallyVisibleNodes.map((node) => [node.id, node])),
    [temporallyVisibleNodes],
  );

  const parentById = useMemo(() => {
    const parents = new Map<string, string>();
    temporallyVisibleNodes.forEach((node) => {
      const parent = node.backlinks.outbound.find((relation) => {
        const candidate = nodeById.get(relation.nodeId);
        return relation.type === "branch_of" && candidate?.cluster === node.cluster;
      });
      if (parent) parents.set(node.id, parent.nodeId);
    });
    return parents;
  }, [nodeById, temporallyVisibleNodes]);

  const childrenByParent = useMemo(() => {
    const children = new Map<string, GraphNode[]>();
    parentById.forEach((parentId, childId) => {
      const child = nodeById.get(childId);
      if (!child) return;
      const current = children.get(parentId) ?? [];
      current.push(child);
      children.set(parentId, current);
    });
    children.forEach((entries) => entries.sort((a, b) => a.title.localeCompare(b.title)));
    return children;
  }, [nodeById, parentById]);

  const matchingNodeIds = useMemo(() => {
    if (!normalizedQuery) return new Set(temporallyVisibleNodes.map((node) => node.id));
    return new Set(
      temporallyVisibleNodes
        .filter((node) => scoreGraphNodeSearch(node, normalizedQuery) > 0)
        .map((node) => node.id),
    );
  }, [normalizedQuery, temporallyVisibleNodes]);

  const visibleNodeIds = useMemo(() => {
    if (!normalizedQuery) return matchingNodeIds;
    const visible = new Set(matchingNodeIds);
    matchingNodeIds.forEach((nodeId) => {
      let parentId = parentById.get(nodeId);
      const visited = new Set<string>();
      while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        visible.add(parentId);
        parentId = parentById.get(parentId);
      }
    });
    return visible;
  }, [matchingNodeIds, normalizedQuery, parentById]);

  const allNodesByCluster = useMemo(() => {
    const grouped = new Map<string, GraphNode[]>();
    clusterNames.forEach((cluster) => grouped.set(cluster, []));

    temporallyVisibleNodes.forEach((node) => {
      const current = grouped.get(node.cluster) ?? [];
      current.push(node);
      grouped.set(node.cluster, current);
    });

    grouped.forEach((clusterNodes) => {
      clusterNodes.sort((a, b) => a.title.localeCompare(b.title));
    });
    return grouped;
  }, [clusterNames, temporallyVisibleNodes]);

  const rootNodesByCluster = useMemo(() => {
    const roots = new Map<string, GraphNode[]>();
    clusterNames.forEach((cluster) => roots.set(cluster, []));
    temporallyVisibleNodes.forEach((node) => {
      if (!visibleNodeIds.has(node.id)) return;
      const parentId = parentById.get(node.id);
      if (parentId && visibleNodeIds.has(parentId)) return;
      const current = roots.get(node.cluster) ?? [];
      current.push(node);
      roots.set(node.cluster, current);
    });
    roots.forEach((entries) => entries.sort((left, right) => {
      const childDelta = (childrenByParent.get(right.id)?.length ?? 0) -
        (childrenByParent.get(left.id)?.length ?? 0);
      return childDelta || left.title.localeCompare(right.title);
    }));
    return roots;
  }, [childrenByParent, clusterNames, parentById, temporallyVisibleNodes, visibleNodeIds]);

  const visibleClusters = useMemo(
    () => clusterNames.filter((cluster) => (rootNodesByCluster.get(cluster)?.length ?? 0) > 0),
    [clusterNames, rootNodesByCluster],
  );
  const visibleClusterKey = visibleClusters.join("\u0000");
  const visibleNodeCount = matchingNodeIds.size;

  const rootBranchKey = useMemo(
    () => visibleClusters.flatMap((cluster) => rootNodesByCluster.get(cluster) ?? [])
      .filter((node) => (childrenByParent.get(node.id)?.length ?? 0) > 0)
      .map((node) => node.id)
      .join("\u0000"),
    [childrenByParent, rootNodesByCluster, visibleClusters],
  );

  useEffect(() => {
    setExpandedClusters((current) => {
      const next = new Set(current);
      clusterNames.forEach((cluster) => next.add(cluster));
      return next;
    });
  }, [clusterNames]);

  useEffect(() => {
    if (!rootBranchKey) return;
    setExpandedBranches((current) => {
      const next = new Set(current);
      rootBranchKey.split("\u0000").forEach((nodeId) => next.add(nodeId));
      return next;
    });
  }, [rootBranchKey]);

  useEffect(() => {
    if (!normalizedQuery) return;
    setExpandedClusters((current) => {
      const next = new Set(current);
      visibleClusters.forEach((cluster) => next.add(cluster));
      return next;
    });
    // The serialized key keeps this effect tied to the visible cluster names.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedQuery, visibleClusterKey]);

  useEffect(() => {
    const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) : undefined;
    if (!selectedNode) return;
    setExpandedClusters((current) => {
      if (current.has(selectedNode.cluster)) return current;
      const next = new Set(current);
      next.add(selectedNode.cluster);
      return next;
    });
    setExpandedBranches((current) => {
      const next = new Set(current);
      let parentId = parentById.get(selectedNode.id);
      const visited = new Set<string>();
      while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        next.add(parentId);
        parentId = parentById.get(parentId);
      }
      return next;
    });
  }, [nodeById, parentById, selectedNodeId]);

  const toggleCluster = (cluster: string) => {
    setExpandedClusters((current) => {
      const next = new Set(current);
      if (next.has(cluster)) next.delete(cluster);
      else next.add(cluster);
      return next;
    });
  };

  const toggleBranch = (nodeId: string) => {
    setExpandedBranches((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const renderTreeNode = (node: GraphNode, depth: number): ReactNode => {
    const children = (childrenByParent.get(node.id) ?? [])
      .filter((child) => visibleNodeIds.has(child.id));
    const hasChildren = children.length > 0;
    const expanded = normalizedQuery ? true : expandedBranches.has(node.id);
    const selected = node.id === selectedNodeId;

    return (
      <li
        className="tradition-branch"
        key={node.id}
        style={{ "--tree-depth": Math.min(depth, 5) } as CSSProperties}
      >
        <div className="tradition-branch__row">
          {hasChildren ? (
            <button
              className="tradition-branch__toggle"
              type="button"
              onClick={() => toggleBranch(node.id)}
              aria-label={`${expanded ? "Collapse" : "Expand"} ${node.title} branches`}
              aria-expanded={expanded}
            >
              <ChevronIcon expanded={expanded} />
            </button>
          ) : (
            <span className="tradition-branch__spacer" aria-hidden="true" />
          )}
          <button
            className={`tradition-node${selected ? " tradition-node--selected" : ""}`}
            style={{ "--node-color": node.color } as CSSProperties}
            type="button"
            onClick={() => onSelectNode(node.id)}
            aria-current={selected ? "page" : undefined}
          >
            <span className="tradition-node__indicator" aria-hidden="true" />
            <span className="tradition-node__copy">
              <span className="tradition-node__title">{node.title}</span>
              <span className="tradition-node__era">{node.eraStart}</span>
            </span>
            {hasChildren && (
              <span className="tradition-node__branch-count" title={`${children.length} direct branches`}>
                {children.length}
              </span>
            )}
          </button>
        </div>
        {hasChildren && expanded && (
          <ul className="tradition-branch__children">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  if (collapsed) {
    return (
      <aside className="sidebar sidebar--collapsed" aria-label="Tradition navigator" data-collapsed="true">
        <div className="sidebar-rail">
          <div className="sidebar-rail__brand" title="OpenGrail">
            <GrailMark />
            <span className="sr-only">OpenGrail</span>
          </div>
          <button
            className="sidebar-rail__toggle icon-button"
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand tradition navigator"
            title="Expand navigator"
          >
            <CollapseIcon collapsed className="icon-button__icon" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar" aria-label="Tradition navigator" data-collapsed="false">
      <header className="sidebar-header">
        <div className="sidebar-brand">
          <GrailMark />
          <div className="sidebar-brand__copy">
            <span className="sidebar-brand__name">OpenGrail</span>
            <span className="sidebar-brand__descriptor">Comparative religion atlas</span>
          </div>
        </div>
        <button
          className="sidebar-header__toggle icon-button"
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Collapse tradition navigator"
          title="Collapse navigator"
        >
          <CollapseIcon className="icon-button__icon" />
        </button>
      </header>

      <SearchCombobox
        id={searchId}
        variant="sidebar"
        label="Search traditions"
        labelHidden
        placeholder="Search traditions"
        query={query}
        onQueryChange={setQuery}
        nodes={temporallyVisibleNodes}
        onSelect={(node) => onSelectNode(node.id)}
        ariaControlsExtra={treeId}
      />

      <div className="sidebar-section-heading">
        <span>Tradition atlas</span>
        <span className="sidebar-section-heading__count">{nodes.length}</span>
      </div>

      <nav id={treeId} className="tradition-tree" aria-label="Traditions by cluster">
        {visibleClusters.map((cluster) => {
          const clusterNodes = allNodesByCluster.get(cluster) ?? [];
          const rootNodes = rootNodesByCluster.get(cluster) ?? [];
          const clusterDisplayCount = normalizedQuery
            ? clusterNodes.filter((node) => matchingNodeIds.has(node.id)).length
            : clusterNodes.length;
          const isExpanded = expandedClusters.has(cluster);
          const sectionId = `${treeId}-${cluster.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          const clusterColor = clusterNodes[0]?.color ?? "#94a3b8";

          return (
            <section className="tradition-cluster" key={cluster}>
              <button
                className="tradition-cluster__toggle"
                type="button"
                onClick={() => toggleCluster(cluster)}
                aria-expanded={isExpanded}
                aria-controls={sectionId}
              >
                <ChevronIcon expanded={isExpanded} className="tradition-cluster__chevron" />
                <span
                  className="tradition-cluster__dot"
                  style={{ "--cluster-color": clusterColor } as CSSProperties}
                  aria-hidden="true"
                />
                <span className="tradition-cluster__name">{cluster}</span>
                <span className="tradition-cluster__count">{clusterDisplayCount}</span>
              </button>

              {isExpanded && (
                <ul id={sectionId} className="tradition-cluster__list">
                  {rootNodes.map((node) => renderTreeNode(node, 0))}
                </ul>
              )}
            </section>
          );
        })}

        {visibleNodeCount === 0 && (
          <div className="tradition-tree__empty" role="status">
            <SearchIcon className="tradition-tree__empty-icon" />
            <p>No traditions match “{query.trim()}”.</p>
            <button type="button" onClick={() => setQuery("")}>Clear search</button>
          </div>
        )}
      </nav>

      <footer className="sidebar-footer">
        <span className="sidebar-footer__status-dot" aria-hidden="true" />
        <span>
          {normalizedQuery
            ? `${visibleNodeCount} of ${nodes.length} traditions`
            : `${clusters.length || clusterNames.length} clusters · ${nodes.length} traditions`}
        </span>
      </footer>
    </aside>
  );
}
