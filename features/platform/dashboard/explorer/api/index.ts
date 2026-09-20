/* Explorer API layer: the only place that knows the backend's wire format.
 *
 * Every request carries `repo_full_name`, which the backend uses to authorise
 * and to scope the query — a node id alone never grants access to it. */

import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import type {
  GraphCoverage,
  GraphLabel,
  GraphNodeDetail,
  GraphNodeSummary,
  Neighbourhood,
  ResolutionCoverage,
} from "../types";

interface NodeSummaryResponse {
  id: string;
  name?: string | null;
  kind?: string | null;
  path?: string | null;
  file_path?: string | null;
  signature?: string | null;
  label?: string | null;
  labels?: string[] | null;
}

interface NodeDetailResponse {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
  children: NodeSummaryResponse[];
}

interface NeighboursResponse {
  nodes: NodeSummaryResponse[];
  edges: {
    source: string;
    target: string;
    type: string;
    count?: number | null;
    weight?: number | null;
  }[];
}

interface StatsResponse {
  repo_full_name: string;
  graph_version: string | null;
  indexed_at: string | null;
  nodes_by_label: Record<string, number>;
  edges_by_type: Record<string, number>;
  files: number | null;
  symbols: number | null;
  symbol_layer: string | null;
  resolution: Record<string, number> | null;
  skipped: Record<string, number> | null;
}

/** Ids are long and contain "#" and "/", so they always travel as params. */
const graphParams = (repoFullName: string, extra: Record<string, unknown> = {}) => ({
  params: { repo_full_name: repoFullName, ...extra },
});

function toSummary(node: NodeSummaryResponse): GraphNodeSummary {
  const labels = (node.labels ?? (node.label ? [node.label] : [])) as GraphLabel[];
  return {
    id: node.id,
    // Files are named by their path when the backend has no separate name.
    name: node.name ?? node.path ?? node.id,
    kind: node.kind ?? null,
    labels,
    path: node.file_path ?? node.path ?? null,
    signature: node.signature ?? null,
  };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

export async function getNodeDetail(
  repoFullName: string,
  nodeId: string,
): Promise<GraphNodeDetail> {
  const { data } = await api.get<NodeDetailResponse>(
    `${SERVICES.GRAPH}/node`,
    graphParams(repoFullName, { node_id: nodeId }),
  );
  const properties = data.properties ?? {};

  return {
    id: data.id,
    labels: (data.labels ?? []) as GraphLabel[],
    name:
      asString(properties.name) ??
      asString(properties.path) ??
      asString(properties.qualified_name) ??
      data.id,
    kind: asString(properties.kind),
    path: asString(properties.file_path) ?? asString(properties.path),
    signature: asString(properties.signature),
    docstring: asString(properties.docstring),
    startLine: asNumber(properties.start_line),
    endLine: asNumber(properties.end_line),
    language: asString(properties.language),
    children: (data.children ?? []).map(toSummary),
  };
}

export async function getNeighbours(
  repoFullName: string,
  nodeId: string,
  options: { depth?: number; limit?: number } = {},
): Promise<Neighbourhood> {
  const { data } = await api.get<NeighboursResponse>(
    `${SERVICES.GRAPH}/neighbours`,
    graphParams(repoFullName, {
      node_id: nodeId,
      depth: options.depth ?? 1,
      limit: options.limit ?? 100,
    }),
  );

  return {
    nodes: (data.nodes ?? []).map(toSummary),
    relations: (data.edges ?? []).map((edge) => ({
      source: edge.source,
      target: edge.target,
      type: edge.type as Neighbourhood["relations"][number]["type"],
      count: edge.count ?? null,
    })),
  };
}

export async function searchGraph(
  repoFullName: string,
  term: string,
  limit = 20,
): Promise<GraphNodeSummary[]> {
  const { data } = await api.get<{ results: NodeSummaryResponse[] }>(
    `${SERVICES.GRAPH}/search`,
    graphParams(repoFullName, { q: term, limit }),
  );
  return (data.results ?? []).map(toSummary);
}

export async function getCoverage(repoFullName: string): Promise<GraphCoverage> {
  const { data } = await api.get<StatsResponse>(
    `${SERVICES.GRAPH}/stats`,
    graphParams(repoFullName),
  );

  return {
    repoFullName: data.repo_full_name,
    graphVersion: data.graph_version,
    indexedAt: data.indexed_at,
    nodesByLabel: data.nodes_by_label ?? {},
    edgesByType: data.edges_by_type ?? {},
    files: data.files,
    symbols: data.symbols,
    symbolLayer: data.symbol_layer,
    resolution: toResolution(data.resolution),
    skipped: data.skipped ?? {},
  };
}

function toResolution(raw: Record<string, number> | null): ResolutionCoverage | null {
  if (!raw) return null;
  return {
    internalImportResolution: raw.internal_import_resolution ?? 0,
    importsToFiles: raw.imports_to_files ?? 0,
    importsToPackages: raw.imports_to_packages ?? 0,
    importsUnresolved: raw.imports_unresolved ?? 0,
    callsTotal: raw.calls_total ?? 0,
    callsResolved: raw.calls_resolved ?? 0,
    callsToPackages: raw.calls_to_packages ?? 0,
    callsAccounted: raw.calls_accounted ?? 0,
    routesTotal: raw.routes_total ?? 0,
    httpCallsTotal: raw.http_calls_total ?? 0,
    httpCallsMatched: raw.http_calls_matched ?? 0,
  };
}
