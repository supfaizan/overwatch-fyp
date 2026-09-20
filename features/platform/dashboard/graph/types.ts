/* The interactive graph view.
 *
 * The canvas draws the repository at whatever level of detail you ask for:
 * every folder shut, some opened down to their files, one file opened to its
 * definitions. The backend does the rolling-up — a shut folder carries the
 * relationships of everything inside it — so these types describe a picture
 * that is already correct, not raw graph data to be summarised here.
 *
 * camelCase throughout; the snake_case mapping lives in ./api. */

import type { Edge, Node } from "@xyflow/react";
import type { Point } from "../layout";
import type { JobStatus } from "@/features/platform/ingestion/types";

/** Node labels a view may draw. The repository is the frame, never a box. */
export type ViewNodeLabel = "Module" | "File" | "Symbol" | "Package" | "Route";

/** Relationships a view may draw, from `GET /graph/view/options`.
 *  Containment is excluded: it builds the hierarchy rather than crossing it. */
export type ViewEdgeType =
  | "IMPORTS"
  | "USES_PACKAGE"
  | "CALLS"
  | "RENDERS"
  | "EXTENDS"
  | "IMPLEMENTS"
  | "HANDLES"
  | "REQUESTS";

/** How far `expandTo` opens the tree in one step. */
export type Granularity = "module" | "file" | "symbol";

/** One box on the canvas. */
export type ViewNodeData = {
  label: string;
  nodeLabel: ViewNodeLabel;
  /** Finer than the label: `module` / `external` / `routes`, or a symbol's
   *  `function` / `class`. */
  kind: string | null;
  path: string | null;
  fileCount: number;
  definitionCount: number;
  /** How many nodes it contains — what opening it would reveal. */
  childCount: number;
  /** The container it was drawn under, so it can be closed again. */
  parentId: string | null;
  expandable: boolean;
};

export type ViewFlowNode = Node<ViewNodeData, "graphNode">;

/** Stands for the children of an open folder that there was no room to draw.
 *  It behaves like a shut folder — the relationships of everything it holds
 *  are drawn against it — and opening it reveals the rest. */
export type OverflowNodeData = {
  containerId: string;
  containerName: string;
  shown: number;
  hidden: number;
};

export type OverflowFlowNode = Node<OverflowNodeData, "overflow">;

/** Everything the canvas draws: real graph nodes and overflow markers. */
export type CanvasNode = ViewFlowNode | OverflowFlowNode;

/** One drawn line. Several relationships between the same two nodes land on
 *  identical coordinates, so they are merged into one line that names all of
 *  them — otherwise the extras are invisible and cost only clutter. */
export type ViewEdgeData = {
  /** What names the line: colour, dash and legend all follow from this. */
  kind: ViewEdgeType;
  /** Every relationship behind it, most specific first. */
  types: ViewEdgeType[];
  /** How many underlying relationships this line stands for. */
  weight: number;
  /** True when either end was rolled up into a shut container, so the line
   *  represents relationships between things you cannot currently see. */
  collapsed: boolean;
  /** Bends the line follows to get around the nodes it travels past. Empty
   *  when it runs between neighbouring rows with nothing in the way. */
  points: Point[];
};

export type ViewFlowEdge = Edge<ViewEdgeData>;

/** A container currently held open. Described rather than just named, because
 *  it is no longer on the canvas to be looked up. */
export interface OpenContainer {
  id: string;
  name: string;
  label: ViewNodeLabel;
  kind: string | null;
  path: string | null;
  parentId: string | null;
}

export interface GraphView {
  repoFullName: string;
  parseStatus: JobStatus;
  graphVersion: string | null;
  nodes: CanvasNode[];
  edges: ViewFlowEdge[];
  expanded: OpenContainer[];
  /** A cap cut the result short — said out loud rather than shown quietly. */
  truncated: boolean;
}

/** What the server will accept as a filter. Fetched rather than hardcoded, so
 *  a new relationship type appears in the UI without a frontend release. */
export interface ViewOptions {
  nodeLabels: ViewNodeLabel[];
  edgeTypes: ViewEdgeType[];
  granularities: Granularity[];
  /** How many children one folder contributes before the rest are gathered.
   *  Server-owned, so the UI can warn ahead of a click without repeating it. */
  pageSize: number;
  maxNodes: number;
}

/** The request: what is open, and what may be drawn. */
export interface ViewQuery {
  expanded: string[];
  /** Folders whose children are drawn in full — what a "+6 more" click adds. */
  revealed: string[];
  expandTo: Granularity | null;
  /** Confines `expandTo` to one folder's subtree. */
  expandFrom: string | null;
  /** null means "no filter" — every label / type the server allows. */
  nodeLabels: ViewNodeLabel[] | null;
  edgeTypes: ViewEdgeType[] | null;
}
