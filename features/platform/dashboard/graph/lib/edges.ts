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

import type { ViewEdgeType } from "../types";

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

/** How a merged line reads: "imports, calls · 14". */
export function describeEdge(edge: { types: ViewEdgeType[]; weight: number }): string {
  const types = edge.types.map((type) => type.toLowerCase().replace("_", " "));
  return `${types.join(", ")} · ${edge.weight}`;
}
