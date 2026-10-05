/* Drawing a flow on whatever the canvas currently shows.

   A flow's steps are exact definitions, files and routes, but the canvas may
   be showing them rolled up into shut folders, or paged behind a "+N more"
   marker. Each step is therefore *projected* onto the box that currently
   stands for it — itself if drawn, else the deepest drawn container holding
   it — so a walkthrough reads at every level of detail, and gets more
   precise as folders are opened.

   Pure functions over view data: no React, no fetching. */

import { isGraphNode } from "./nodes";
import type { CanvasNode, ViewFlowEdge } from "../types";

/** What projection needs to know about a step. */
export interface ProjectableStep {
  nodeId: string;
  /** Containers holding the step, outermost first (from the server). */
  containers: readonly string[];
}

/** One step's place on the canvas, and which numbered steps share a box. */
export interface FlowMark {
  /** 1-based step numbers drawn on this box. */
  steps: number[];
  active: boolean;
}

/** The box standing for each step, or null where none is drawn (e.g. the
 *  step's kind is filtered out). Same order and length as `steps`. */
export function projectSteps(
  steps: readonly ProjectableStep[],
  nodes: readonly CanvasNode[],
): (string | null)[] {
  const drawn = new Set<string>();
  const open = new Set<string>();
  const overflowOf = new Map<string, string>();
  let root: string | null = null;

  for (const node of nodes) {
    drawn.add(node.id);
    if (!isGraphNode(node)) {
      overflowOf.set(node.data.containerId, node.id);
      continue;
    }
    if (node.data.expanded) open.add(node.id);
    if (node.data.nodeLabel === "Repository") root = node.id;
  }

  return steps.map((step) => {
    if (drawn.has(step.nodeId)) return step.nodeId;
    const holders = root ? [root, ...step.containers] : step.containers;
    for (let index = holders.length - 1; index >= 0; index -= 1) {
      const holder = holders[index];
      if (!drawn.has(holder)) continue;
      // Open but the step is not drawn under it: it is paged behind the
      // marker, which stands for exactly the children not shown.
      if (open.has(holder)) return overflowOf.get(holder) ?? holder;
      return holder;
    }
    return null;
  });
}

/** Boxes to badge: step numbers per box, and whether the active step is one
 *  of them. Several steps can land on one shut folder. */
export function flowMarks(
  projected: readonly (string | null)[],
  cursor: number,
): Record<string, FlowMark> {
  const marks: Record<string, FlowMark> = {};
  projected.forEach((id, index) => {
    if (!id) return;
    const mark = (marks[id] ??= { steps: [], active: false });
    mark.steps.push(index + 1);
    if (index === cursor) mark.active = true;
  });
  return marks;
}

/** Each step's move from the step that led to it, between different boxes.
 *
 *  Moves follow `parents`, not list order: in a call tree the step after a
 *  finished branch is a sibling, reached from their shared caller — a line
 *  from the end of the previous branch would be a call that never happens.
 *  Steps that land on the same box are one place on screen, not a move. */
export function flowMoves(
  projected: readonly (string | null)[],
  parents: readonly (number | null)[],
): [string, string][] {
  const moves = new Map<string, [string, string]>();
  projected.forEach((to, index) => {
    const from = drawnAncestor(projected, parents, index);
    if (from && to && from !== to) moves.set(`${from}->${to}`, [from, to]);
  });
  return [...moves.values()];
}

/** The nearest step above `index` that has a box, so a step hidden by a
 *  filter does not break the line through it. */
function drawnAncestor(
  projected: readonly (string | null)[],
  parents: readonly (number | null)[],
  index: number,
): string | null {
  let parent = parents[index] ?? null;
  // Bounded by the number of steps, so malformed parents cannot loop.
  for (let hops = 0; parent !== null && hops < projected.length; hops += 1) {
    const box = projected[parent];
    if (box) return box;
    parent = parents[parent] ?? null;
  }
  return null;
}

/** Moves with no drawn relationship between their boxes. They get a line of
 *  their own, so the path never has gaps where the view rolled an edge up or
 *  a filter hid it. */
export function unlinkedMoves(
  moves: readonly [string, string][],
  edges: readonly ViewFlowEdge[],
): [string, string][] {
  const linked = new Set<string>();
  for (const edge of edges) {
    linked.add(`${edge.source}->${edge.target}`);
    linked.add(`${edge.target}->${edge.source}`);
  }
  return moves.filter(([from, to]) => !linked.has(`${from}->${to}`));
}

/** Containers to open so every step is drawn as itself, outermost first and
 *  without repeats, capped at what one view request may open. */
export function containersToOpen(
  steps: readonly ProjectableStep[],
  limit: number,
): string[] {
  const ordered = new Set<string>();
  for (const step of steps) for (const id of step.containers) ordered.add(id);
  return [...ordered].slice(0, limit);
}
