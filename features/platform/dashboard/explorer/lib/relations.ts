/* Turning a neighbourhood into the sections the detail view renders.
 *
 * Pure functions over API data: no React, no fetching, so the grouping rules
 * are readable and testable on their own. */

import type { GraphEdgeType, Neighbourhood, RelationGroup } from "../types";

/** Structural edges: the detail view lists these as "contains" instead. */
const CONTAINMENT: ReadonlySet<GraphEdgeType> = new Set([
  "CONTAINS",
  "DEFINES",
  "HAS_MEMBER",
]);

/** Section order, so the most useful relationships come first. */
const PRIORITY: GraphEdgeType[] = [
  "CALLS",
  "REQUESTS",
  "HANDLES",
  "RENDERS",
  "IMPORTS",
  "EXTENDS",
  "IMPLEMENTS",
  "USES_PACKAGE",
  "DEPENDS_ON",
  "USES_EXTERNAL",
];

/**
 * Group a node's relationships into sections, one per type and direction.
 *
 * Containment is excluded: those children are already shown as "contains",
 * and repeating them as relationships would bury the interesting edges.
 */
export function groupRelations(
  nodeId: string,
  neighbourhood: Neighbourhood,
): RelationGroup[] {
  const byId = new Map(neighbourhood.nodes.map((node) => [node.id, node]));
  const grouped = new Map<string, RelationGroup>();

  for (const relation of neighbourhood.relations) {
    if (CONTAINMENT.has(relation.type)) continue;

    const isOutgoing = relation.source === nodeId;
    const isIncoming = relation.target === nodeId;
    if (!isOutgoing && !isIncoming) continue; // two hops out; not this node's edge

    const otherId = isOutgoing ? relation.target : relation.source;
    const other = byId.get(otherId);
    if (!other) continue;

    const direction = isOutgoing ? "out" : "in";
    const key = `${relation.type}:${direction}`;
    const group =
      grouped.get(key) ?? { type: relation.type, direction, nodes: [] };

    if (!group.nodes.some((node) => node.id === other.id)) {
      group.nodes.push(other);
    }
    grouped.set(key, group);
  }

  return [...grouped.values()].sort(sectionOrder);
}

function sectionOrder(a: RelationGroup, b: RelationGroup): number {
  const byType = rank(a.type) - rank(b.type);
  if (byType !== 0) return byType;
  // Outgoing first: "what this uses" reads before "what uses this".
  return a.direction === b.direction ? 0 : a.direction === "out" ? -1 : 1;
}

function rank(type: GraphEdgeType): number {
  const index = PRIORITY.indexOf(type);
  return index === -1 ? PRIORITY.length : index;
}

/** Section heading, phrased from the current node's point of view. */
export function relationHeading(group: RelationGroup): string {
  const headings: Record<GraphEdgeType, [outgoing: string, incoming: string]> = {
    CALLS: ["Calls", "Called by"],
    REQUESTS: ["Requests", "Requested by"],
    HANDLES: ["Handles", "Handled by"],
    RENDERS: ["Renders", "Rendered by"],
    IMPORTS: ["Imports", "Imported by"],
    EXTENDS: ["Extends", "Extended by"],
    IMPLEMENTS: ["Implements", "Implemented by"],
    USES_PACKAGE: ["Uses package", "Used by"],
    DEPENDS_ON: ["Depends on", "Depended on by"],
    USES_EXTERNAL: ["Uses external", "Used by"],
    CONTAINS: ["Contains", "Contained by"],
    DEFINES: ["Defines", "Defined in"],
    HAS_MEMBER: ["Members", "Member of"],
  };
  const [outgoing, incoming] = headings[group.type] ?? [group.type, group.type];
  return group.direction === "out" ? outgoing : incoming;
}

/** Heading for the children of a node, which depends on what the node is. */
export function containsHeading(labels: readonly string[]): string {
  if (labels.includes("Module")) return "Files";
  if (labels.includes("File")) return "Definitions";
  if (labels.includes("Symbol")) return "Members";
  return "Contains";
}

/** Short, human label for what a node is. */
export function describeNode(node: {
  kind: string | null;
  labels: readonly string[];
}): string {
  if (node.kind) return node.kind;
  return node.labels.find((label) => label !== "GraphNode")?.toLowerCase() ?? "node";
}
