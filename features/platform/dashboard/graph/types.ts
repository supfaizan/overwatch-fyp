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

export type ViewEdgeData = {
  kind: ViewEdgeType;
  /** How many underlying relationships this line stands for. */
  weight: number;
  /** True when either end was rolled up into a shut container, so the line
   *  represents relationships between things you cannot currently see. */
  collapsed: boolean;
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
  nodes: ViewFlowNode[];
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
}

/** The request: what is open, and what may be drawn. */
export interface ViewQuery {
  expanded: string[];
  expandTo: Granularity | null;
  /** null means "no filter" — every label / type the server allows. */
  nodeLabels: ViewNodeLabel[] | null;
  edgeTypes: ViewEdgeType[] | null;
}
