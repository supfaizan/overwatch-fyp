import type { Edge, Node } from '@xyflow/react';

// mirrors the backend schemas (app/graph)

export type ParseStatus = 'pending' | 'in_progress' | 'done' | 'failed';

/** `Repository` is the root of the tree: always drawn and always open. */
export type NodeLabel = 'Repository' | 'Module' | 'File' | 'Symbol' | 'Package' | 'Route' | 'Channel';

export type EdgeType =
  | 'IMPORTS'
  | 'USES_PACKAGE'
  | 'CALLS'
  | 'RENDERS'
  | 'EXTENDS'
  | 'IMPLEMENTS'
  | 'HANDLES'
  | 'REQUESTS'
  | 'SENDS'
  | 'RECEIVES';

export type ViewNode = {
  id: string;
  name: string;
  label: NodeLabel;
  /** finer than the label: `module` / `external` / `routes`, or a symbol's `function` / `class` */
  kind: string | null;
  path: string | null;
  depth: number;
  file_count: number;
  definition_count: number;
  /** what opening it would reveal */
  child_count: number;
  language: string | null;
  parent_id: string | null;
  expandable: boolean;
  expanded: boolean;
};

export type ViewEdge = { source: string; target: string; type: EdgeType; weight: number; collapsed: boolean };

/** The children of an open folder there was no room to draw; opening it draws the rest. */
export type Overflow = { id: string; container_id: string; container_name: string; shown: number; hidden: number };

export type GraphView = {
  repo_full_name: string;
  parse_status: ParseStatus;
  graph_version: string | null;
  nodes: ViewNode[];
  edges: ViewEdge[];
  containment: { parent: string; child: string }[];
  overflows: Overflow[];
  expanded: { id: string; name: string; label: NodeLabel; kind: string | null; path: string | null; parent_id: string | null }[];
  /** a cap cut the result short */
  truncated: boolean;
};

export type ViewOptions = {
  node_labels: NodeLabel[];
  edge_types: EdgeType[];
  granularities: ('module' | 'file' | 'symbol')[];
  /** children one folder shows before the rest are gathered behind an overflow marker */
  page_size: number;
  max_nodes: number;
  max_expanded: number;
};

export type ViewQuery = { expand: string[]; reveal: string[] };

export type GraphFlowNode = Node<ViewNode, 'graphNode'>;
export type OverflowFlowNode = Node<Overflow, 'overflow'>;
export type CanvasNode = GraphFlowNode | OverflowFlowNode;

/** Several relationships between one pair of nodes, drawn as one line that names them all. */
export type RelationEdge = Edge<{ types: EdgeType[]; weight: number; collapsed: boolean }>;

/** A view laid out for the canvas. */
export type Canvas = {
  view: GraphView;
  nodes: CanvasNode[];
  edges: RelationEdge[];
};
