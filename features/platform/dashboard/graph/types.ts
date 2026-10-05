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
import type { JobStatus } from "@/features/platform/ingestion/types";

/** Node labels a view may draw. `Repository` is the root of the tree: it is
 *  always drawn, always open, and never shut. */
export type ViewNodeLabel =
  | "Repository"
  | "Module"
  | "File"
  | "Symbol"
  | "Package"
  | "Route"
  | "Channel";

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
  | "REQUESTS"
  | "SENDS"
  | "RECEIVES";

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
  /** The folder it was drawn under, which is where its tree line comes from. */
  parentId: string | null;
  expandable: boolean;
  /** True when this folder is open and what it holds is drawn beneath it. */
  expanded: boolean;
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
};

export type ViewFlowEdge = Edge<ViewEdgeData>;

/** One line of the tree: an open folder and something it holds. Kept apart
 *  from the relationship edges because it means something else entirely —
 *  structure, not dependency — and is drawn, filtered and read differently. */
export interface ContainmentLine {
  parent: string;
  child: string;
}

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
  containment: ContainmentLine[];
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
  /** How many containers one request may hold open. */
  maxExpanded: number;
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
