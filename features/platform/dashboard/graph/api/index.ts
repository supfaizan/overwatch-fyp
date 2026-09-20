/* The only place that knows the view endpoint's wire format.
 *
 * `POST /graph/view` reads and changes nothing; it is a POST because the
 * request carries a list of open containers and two filter sets, which do not
 * belong in a URL. `repo_full_name` stays a query parameter: the backend
 * authorises on it, and a node id alone never grants access to anything. */

import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import { layoutPositions } from "../../layout";
import type {
  GraphView,
  Granularity,
  OpenContainer,
  ViewEdgeType,
  ViewFlowEdge,
  ViewFlowNode,
  ViewNodeLabel,
  ViewOptions,
  ViewQuery,
} from "../types";
import type { JobStatus } from "@/features/platform/ingestion/types";

interface ViewNodeResponse {
  id: string;
  name: string;
  label: ViewNodeLabel;
  kind: string | null;
  path: string | null;
  depth: number;
  file_count: number;
  definition_count: number;
  child_count: number;
  language: string | null;
  parent_id: string | null;
  expandable: boolean;
}

interface ViewEdgeResponse {
  source: string;
  target: string;
  type: ViewEdgeType;
  weight: number;
  collapsed: boolean;
}

interface ViewResponse {
  repo_full_name: string;
  parse_status: JobStatus;
  graph_version: string | null;
  nodes: ViewNodeResponse[];
  edges: ViewEdgeResponse[];
  expanded: {
    id: string;
    name: string;
    label: ViewNodeLabel;
    kind: string | null;
    path: string | null;
    parent_id: string | null;
  }[];
  truncated: boolean;
}

interface OptionsResponse {
  node_labels: ViewNodeLabel[];
  edge_types: ViewEdgeType[];
  granularities: Granularity[];
}

/** Fields are omitted rather than sent as null, so the server's own defaults
 *  apply and "no filter" never has to be spelled out twice. */
function toBody(query: ViewQuery): Record<string, unknown> {
  return {
    expand: query.expanded,
    ...(query.expandTo ? { expand_to: query.expandTo } : {}),
    ...(query.nodeLabels ? { node_labels: query.nodeLabels } : {}),
    ...(query.edgeTypes ? { edge_types: query.edgeTypes } : {}),
  };
}

export async function getGraphView(
  repoFullName: string,
  query: ViewQuery,
): Promise<GraphView> {
  const { data } = await api.post<ViewResponse>(
    `${SERVICES.GRAPH}/view`,
    toBody(query),
    { params: { repo_full_name: repoFullName } },
  );

  const nodes = data.nodes ?? [];
  const edges = data.edges ?? [];
  const positions = layoutPositions(
    nodes.map((node) => ({ id: node.id, kind: node.kind ?? node.label })),
    edges.map((edge) => ({ source: edge.source, target: edge.target })),
  );

  return {
    repoFullName: data.repo_full_name,
    parseStatus: data.parse_status,
    graphVersion: data.graph_version,
    nodes: nodes.map(toFlowNode(positions)),
    edges: edges.map(toFlowEdge),
    expanded: (data.expanded ?? []).map(toOpenContainer),
    truncated: data.truncated ?? false,
  };
}

const toFlowNode =
  (positions: Record<string, { x: number; y: number }>) =>
  (node: ViewNodeResponse): ViewFlowNode => ({
    id: node.id,
    type: "graphNode",
    position: positions[node.id] ?? { x: 0, y: 0 },
    data: {
      label: node.name,
      nodeLabel: node.label,
      kind: node.kind,
      path: node.path,
      fileCount: node.file_count,
      definitionCount: node.definition_count,
      childCount: node.child_count,
      parentId: node.parent_id,
      expandable: node.expandable,
    },
  });

const toFlowEdge = (edge: ViewEdgeResponse): ViewFlowEdge => ({
  // The backend keys an edge by (source, target, type) — mirror that, so React
  // Flow ids stay stable as the view opens and closes.
  id: `${edge.source}->${edge.target}:${edge.type}`,
  source: edge.source,
  target: edge.target,
  data: { kind: edge.type, weight: edge.weight, collapsed: edge.collapsed },
});

const toOpenContainer = (row: ViewResponse["expanded"][number]): OpenContainer => ({
  id: row.id,
  name: row.name,
  label: row.label,
  kind: row.kind,
  path: row.path,
  parentId: row.parent_id,
});

export async function getViewOptions(): Promise<ViewOptions> {
  const { data } = await api.get<OptionsResponse>(`${SERVICES.GRAPH}/view/options`);
  return {
    nodeLabels: data.node_labels ?? [],
    edgeTypes: data.edge_types ?? [],
    granularities: data.granularities ?? [],
  };
}
