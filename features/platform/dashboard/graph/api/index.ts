/* The only place that knows the view endpoint's wire format.
 *
 * `POST /graph/view` reads and changes nothing; it is a POST because the
 * request carries a list of open containers and two filter sets, which do not
 * belong in a URL. `repo_full_name` stays a query parameter: the backend
 * authorises on it, and a node id alone never grants access to anything. */

import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import { layoutPositions } from "../../layout";
import { mergeByPair, type MergedEdge } from "../lib/edges";
import type {
  GraphView,
  Granularity,
  OpenContainer,
  OverflowFlowNode,
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
  expanded: boolean;
}

interface ViewEdgeResponse {
  source: string;
  target: string;
  type: ViewEdgeType;
  weight: number;
  collapsed: boolean;
}

interface OverflowResponse {
  id: string;
  container_id: string;
  container_name: string;
  shown: number;
  hidden: number;
}

interface ViewResponse {
  repo_full_name: string;
  parse_status: JobStatus;
  graph_version: string | null;
  nodes: ViewNodeResponse[];
  edges: ViewEdgeResponse[];
  containment: { parent: string; child: string }[];
  overflows: OverflowResponse[];
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
  page_size: number;
  max_nodes: number;
}

/** Fields are omitted rather than sent as null, so the server's own defaults
 *  apply and "no filter" never has to be spelled out twice. */
function toBody(query: ViewQuery): Record<string, unknown> {
  return {
    expand: query.expanded,
    reveal: query.revealed,
    ...(query.expandTo ? { expand_to: query.expandTo } : {}),
    ...(query.expandFrom ? { expand_from: query.expandFrom } : {}),
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
  const overflows = data.overflows ?? [];

  // Merge before laying out, so the layout routes exactly the lines that get
  // drawn — one per pair of nodes, not one per relationship type.
  const merged = mergeByPair(data.edges ?? []);
  const containment = data.containment ?? [];

  // Markers are laid out with everything else: they carry real edges, so
  // placing them separately would put them somewhere the edges do not go.
  const positions = layoutPositions(
    [
      ...nodes.map((node) => ({ id: node.id, kind: node.kind ?? node.label })),
      ...overflows.map((overflow) => ({ id: overflow.id, kind: "overflow" })),
    ],
    // Only the tree: which folder holds what is the whole of the drawing.
    // Dependencies are drawn over it, and never move a node off its row.
    containment.map((line) => ({ source: line.parent, target: line.child })),
  );

  return {
    repoFullName: data.repo_full_name,
    parseStatus: data.parse_status,
    graphVersion: data.graph_version,
    nodes: [
      ...nodes.map(toFlowNode(positions)),
      ...overflows.map(toOverflowNode(positions)),
    ],
    edges: merged.map(toFlowEdge),
    containment: containment.map((line) => ({ parent: line.parent, child: line.child })),
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
      expanded: node.expanded,
    },
  });

const toOverflowNode =
  (positions: Record<string, { x: number; y: number }>) =>
  (overflow: OverflowResponse): OverflowFlowNode => ({
    id: overflow.id,
    type: "overflow",
    position: positions[overflow.id] ?? { x: 0, y: 0 },
    data: {
      containerId: overflow.container_id,
      containerName: overflow.container_name,
      shown: overflow.shown,
      hidden: overflow.hidden,
    },
  });

const toFlowEdge = (edge: MergedEdge): ViewFlowEdge => ({
  // Keyed by the pair, so React Flow ids stay stable as the view opens and
  // closes and a line keeps its identity across a refresh.
  id: edge.id,
  source: edge.source,
  target: edge.target,
  data: {
    kind: edge.dominant,
    types: edge.types,
    weight: edge.weight,
    collapsed: edge.collapsed,
  },
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
    pageSize: data.page_size,
    maxNodes: data.max_nodes,
  };
}
