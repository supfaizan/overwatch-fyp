/* How the view looks: one place deciding colour, dash and wording.
 *
 * Pure data and pure functions — no React — so the rendering components stay
 * about layout and interaction. Every colour is an existing design token
 * rather than a new hex value, so the canvas cannot drift from the rest of
 * the product. */

import type { ViewEdgeType, ViewNodeLabel } from "../types";

interface EdgeStyle {
  /** A CSS custom property from the palette, never a literal colour. */
  stroke: string;
  dash?: string;
  /** How the relationship reads on a legend, in the graph's own direction. */
  label: string;
}

export const EDGE_STYLES: Record<ViewEdgeType, EdgeStyle> = {
  IMPORTS: { stroke: "var(--ow-line-2)", label: "imports" },
  CALLS: { stroke: "var(--ow-signal)", label: "calls" },
  RENDERS: { stroke: "var(--ow-stale)", label: "renders" },
  EXTENDS: { stroke: "var(--ow-stale)", dash: "5 4", label: "extends" },
  IMPLEMENTS: { stroke: "var(--ow-stale)", dash: "2 3", label: "implements" },
  USES_PACKAGE: { stroke: "var(--ow-idle)", dash: "5 5", label: "uses package" },
  HANDLES: { stroke: "var(--ow-warn)", label: "handles" },
  REQUESTS: { stroke: "var(--ow-warn)", dash: "5 4", label: "requests" },
};

const FALLBACK_EDGE: EdgeStyle = { stroke: "var(--ow-line-2)", label: "relates to" };

/** With a node in focus, its two kinds of connection are coloured apart.
 *  "What this uses" and "what uses this" are the two questions a dependency
 *  graph gets asked, and one undifferentiated line answers neither. */
export const FOCUS_STROKE = {
  outgoing: "var(--ow-signal)",
  incoming: "var(--ow-warn)",
} as const;

/** How far everything unrelated to the focused node recedes. Far enough that
 *  the neighbourhood reads on its own, near enough to keep the shape of the
 *  graph as context. */
export const RECEDED = { node: 0.18, edge: 0.07 } as const;

export function edgeStyle(type: ViewEdgeType): EdgeStyle {
  return EDGE_STYLES[type] ?? FALLBACK_EDGE;
}

/** What a node is, in one word, for the line under its name. */
export function describeNode(label: ViewNodeLabel, kind: string | null): string {
  if (label === "Module") {
    if (kind === "external") return "packages";
    if (kind === "routes") return "routes";
    return "folder";
  }
  if (label === "Symbol") return kind ?? "definition";
  return label.toLowerCase();
}

/** The line under a node's name: what opening it would show.
 *
 * Counts are subtree totals, so a folder says what it is hiding rather than
 * only what sits directly inside it. */
export function describeContents(data: {
  nodeLabel: ViewNodeLabel;
  fileCount: number;
  definitionCount: number;
  childCount: number;
}): string {
  if (data.nodeLabel === "Module" && data.fileCount > 0) {
    return `${data.fileCount} ${data.fileCount === 1 ? "file" : "files"}`;
  }
  if (data.nodeLabel === "File" && data.definitionCount > 0) {
    return `${data.definitionCount} defs`;
  }
  if (data.childCount > 0) {
    return `${data.childCount} inside`;
  }
  return "";
}

/** How an open container reads in the trail.
 *
 * A folder is clearer as its full path — `features/platform` says more than
 * `platform`. The two synthetic containers have no path, only a sentinel, so
 * they use their display name instead. */
export function containerLabel(container: {
  name: string;
  path: string | null;
  kind: string | null;
}): string {
  const isFolder = container.kind === null || container.kind === "module";
  return (isFolder && container.path) || container.name;
}

/** Whether a node lies inside a container, by id.
 *
 * Used only to keep a chat answer's spotlight visible after its module has
 * been opened: the module named in the answer is gone, so its children stand
 * in for it. Cosmetic — the server remains the authority on containment. */
export function isWithin(nodeId: string, containerId: string): boolean {
  if (nodeId === containerId) return true;
  if (!nodeId.startsWith(containerId)) return false;
  const next = nodeId.charAt(containerId.length);
  return next === "/" || next === "#";
}

/** Node ids to light up, given what the chat answer named. */
export function spotlight(nodeIds: string[], highlighted: string[]): Set<string> {
  if (highlighted.length === 0) return new Set();
  return new Set(
    nodeIds.filter((id) =>
      highlighted.some((target) => isWithin(id, target)),
    ),
  );
}
