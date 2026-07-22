import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import { layoutPositions } from "../layout";
import { WARNINGS } from "../static";
import type {
  ContractWarning,
  GraphData,
  GraphEdge,
  GraphEdgeKind,
  GraphNodeKind,
  QueryResult,
  ServiceNode,
} from "../types";
import type { JobStatus } from "@/features/platform/ingestion/types";

interface BackendGraphResponse {
  repo_full_name: string;
  parse_status: JobStatus;
  nodes: Array<{
    id: string;
    name: string;
    kind: GraphNodeKind;
    file_count: number;
    definition_count: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: GraphEdgeKind;
    weight: number;
  }>;
}

interface AskResponse {
  answer: string;
  highlighted_node_ids: string[];
}

interface FlowResponse {
  step_node_ids: string[];
}

export async function getGraph(repoFullName: string): Promise<GraphData> {
  const { data } = await api.get<BackendGraphResponse>(SERVICES.GRAPH, {
    params: { repo_full_name: repoFullName },
  });

  const positions = layoutPositions(
    data.nodes,
    data.edges.map((e) => ({ source: e.source, target: e.target, kind: e.type })),
  );

  const nodes: ServiceNode[] = data.nodes.map((node) => ({
    id: node.id,
    type: "service",
    position: positions[node.id] ?? { x: 0, y: 0 },
    data: {
      label: node.name,
      kind: node.kind,
      fileCount: node.file_count,
      definitionCount: node.definition_count,
    },
  }));

  const edges: GraphEdge[] = data.edges.map((edge) => ({
    // The backend keys edges by (source, target, type) — mirror that so React
    // Flow ids stay stable across re-parses.
    id: `${edge.source}->${edge.target}:${edge.type}`,
    source: edge.source,
    target: edge.target,
    data: { kind: edge.type, weight: edge.weight },
  }));

  return {
    repoFullName: data.repo_full_name,
    parseStatus: data.parse_status,
    nodes,
    edges,
  };
}

/** Out of eval-1 scope (contract checker) — the panel is unrouted but kept in
 *  the tree, so this returns the static fixture rather than calling an endpoint
 *  the backend does not implement. */
export async function getWarnings(): Promise<ContractWarning[]> {
  return WARNINGS;
}

export async function sendQuery(input: {
  repoFullName: string;
  question: string;
  focusedNodeId?: string | null;
}): Promise<QueryResult> {
  const { data } = await api.post<AskResponse>(`${SERVICES.QUERY}/ask`, {
    repo_full_name: input.repoFullName,
    question: input.question,
    focused_node_id: input.focusedNodeId ?? null,
  });
  return { answer: data.answer, highlight: data.highlighted_node_ids };
}

export async function requestFlow(input: {
  repoFullName: string;
  question: string;
}): Promise<string[]> {
  const { data } = await api.post<FlowResponse>(`${SERVICES.QUERY}/flow`, {
    repo_full_name: input.repoFullName,
    question: input.question,
  });
  return data.step_node_ids;
}
