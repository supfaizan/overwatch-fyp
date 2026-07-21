import type { Edge, Node } from "@xyflow/react";
import type { Confidence, Layer, Priority } from "@/types";

/** Node payload rendered by the custom ServiceNode. Declared as a `type`
 *  (not interface) so it satisfies React Flow's `Record<string, unknown>`. */
export type GraphNodeData = {
  label: string;
  layer: Layer;
  language?: string;
  risk: number; // 0-1 T-GNN co-change score (drives the heatmap)
  tickets?: number;
};

export type ServiceNode = Node<GraphNodeData, "service">;

export type GraphEdgeData = {
  confidence: Confidence;
  note?: string;
};

export type GraphEdge = Edge<GraphEdgeData>;

export interface GraphData {
  nodes: ServiceNode[];
  edges: GraphEdge[];
}

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
