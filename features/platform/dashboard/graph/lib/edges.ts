/* Deciding what lines to draw, and how they should look.
 *
 * Two rules do most of the work for readability:
 *
 *   1. **One line per pair.** The graph can hold several relationships
 *      between the same two nodes — a file both imports from and calls into
 *      another. Drawn separately they land on identical coordinates, so the
 *      extra lines are invisible and cost only clutter. They are merged into
 *      one line that names everything behind it.
 *
 *   2. **Direction is shown, not implied.** Every line gets an arrowhead, and
 *      when a node is in focus its outgoing and incoming lines are coloured
 *      differently — "what this uses" and "what uses this" are the two
 *      questions people actually have, and a plain line answers neither.
 *
 * Pure functions over view data: no React, no fetching. */

import type { Edge } from "@xyflow/react";
import type { ContainmentLine, ViewEdgeType } from "../types";

/** One relationship as the backend reports it. */
export interface RawEdge {
  source: string;
  target: string;
  type: ViewEdgeType;
  weight: number;
  collapsed: boolean;
}

/** Anything with two ends — merged edges, drawn edges, either. */
interface Linked {
  source: string;
  target: string;
}

/** Which relationship names a merged line, most specific first. An HTTP call
 *  between two folders says more than the import that carries it. */
const PRECEDENCE: ViewEdgeType[] = [
  "REQUESTS",
  "HANDLES",
  "CALLS",
  "RENDERS",
  "EXTENDS",
  "IMPLEMENTS",
  "IMPORTS",
  "USES_PACKAGE",
];

export interface MergedEdge {
  id: string;
  source: string;
  target: string;
  /** Every relationship type between these two nodes, most specific first. */
  types: ViewEdgeType[];
  /** What names the line: colour, dash and legend all follow from this. */
  dominant: ViewEdgeType;
  /** Total underlying relationships, across all the types. */
  weight: number;
  /** True when any of them was rolled up out of a shut container. */
  collapsed: boolean;
}

/** Collapse the lines between each pair of nodes into one. */
export function mergeByPair(edges: RawEdge[]): MergedEdge[] {
  const byPair = new Map<string, MergedEdge>();

  for (const edge of edges) {
    const key = `${edge.source}->${edge.target}`;
    const existing = byPair.get(key);

    if (!existing) {
      byPair.set(key, {
        id: key,
        source: edge.source,
        target: edge.target,
        types: [edge.type],
        dominant: edge.type,
        weight: edge.weight,
        collapsed: edge.collapsed,
      });
      continue;
    }

    existing.types.push(edge.type);
    existing.weight += edge.weight;
    existing.collapsed = existing.collapsed || edge.collapsed;
  }

  for (const merged of byPair.values()) {
    merged.types.sort((a, b) => rank(a) - rank(b));
    merged.dominant = merged.types[0];
  }
  return [...byPair.values()];
}

function rank(type: ViewEdgeType): number {
  const index = PRECEDENCE.indexOf(type);
  return index === -1 ? PRECEDENCE.length : index;
}

/** Where a line stands relative to the node in focus. */
export type Relation = "outgoing" | "incoming" | "unrelated" | "none";

export function relationTo(edge: Linked, focusId: string | null): Relation {
  if (!focusId) return "none";
  if (edge.source === focusId) return "outgoing";
  if (edge.target === focusId) return "incoming";
  return "unrelated";
}

/** The nodes one hop from the node in focus, plus the node itself. */
export function neighbourhood(
  edges: Linked[],
  focusId: string | null,
): Set<string> {
  if (!focusId) return new Set();
  const found = new Set([focusId]);
  for (const edge of edges) {
    if (edge.source === focusId) found.add(edge.target);
    if (edge.target === focusId) found.add(edge.source);
  }
  return found;
}

/** The tree lines, as React Flow edges.
 *
 * Deliberately plain: no arrowhead, no label, no weight, and unaffected by
 * the relationship filters or by which node is in focus. They are the shape
 * of the folder tree, which stays true whatever question is being asked of
 * the graph.
 *
 * They are also the *first* thing to read. A folder view whose structure is
 * fainter than its dependencies has it backwards, so these are drawn solidly
 * and it is the relationship lines that sit back until something is in
 * focus. */
export function containmentEdges(lines: ContainmentLine[]): Edge[] {
  return lines.map((line) => ({
    id: `${line.parent}>${line.child}:holds`,
    source: line.parent,
    target: line.child,
    // The same curve the relationship lines use. A stepped path put corners
    // on every tree line, which read as detail that was not there.
    type: "default",
    selectable: false,
    focusable: false,
    // React Flow draws an invisible, much wider path along every edge so it
    // is easy to click. Nothing here is clickable, and that path sits over
    // the nodes a line passes, swallowing the hover meant for them.
    interactionWidth: 0,
    style: {
      stroke: "var(--ow-idle)",
      strokeWidth: 1.5,
    },
  }));
}

/** How a merged line reads: "imports, calls · 14". */
export function describeEdge(edge: { types: ViewEdgeType[]; weight: number }): string {
  const types = edge.types.map((type) => type.toLowerCase().replace("_", " "));
  return `${types.join(", ")} · ${edge.weight}`;
}
