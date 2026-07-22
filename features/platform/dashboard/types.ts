import type { Edge, Node } from "@xyflow/react";
import type { Priority } from "@/types";
import type { JobStatus } from "@/features/platform/ingestion/types";

/** Backend node kinds (`app/parsing/graph_builder.py`): one node per top-level
 *  directory, plus a single collapsed node for external package imports. */
export type GraphNodeKind = "module" | "external";

/** Node payload rendered by the custom ServiceNode. Declared as a `type`
 *  (not interface) so it satisfies React Flow's `Record<string, unknown>`. */
export type GraphNodeData = {
  label: string;
  kind: GraphNodeKind;
  fileCount: number;
  definitionCount: number;
};

export type ServiceNode = Node<GraphNodeData, "service">;

/** Backend edge types: `DEPENDS_ON` between internal modules,
 *  `EXTERNAL_DEPENDENCY` into the collapsed external node. */
export type GraphEdgeKind = "DEPENDS_ON" | "EXTERNAL_DEPENDENCY";

export type GraphEdgeData = {
  kind: GraphEdgeKind;
  /** Number of resolved imports behind this edge. */
  weight: number;
};

export type GraphEdge = Edge<GraphEdgeData>;

export interface GraphData {
  repoFullName: string;
  parseStatus: JobStatus;
  nodes: ServiceNode[];
  edges: GraphEdge[];
}

/** Out of eval-1 scope (contract checker). The panel is unrouted but kept in
 *  the tree, so the type stays. See the eval-1 plan, "Explicitly out of scope". */
export interface ContractWarning {
  id: string;
  priority: Priority;
  title: string;
  source: string;
  target: string;
  risk: string;
  suggestion: string;
  tgnnConfidence: number;
  nodeIds: string[];
  createdAt: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  highlight?: string[]; // node ids to spotlight on the diagram
}

export interface QueryResult {
  answer: string;
  highlight: string[];
}
