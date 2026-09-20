/* Explorer domain types.
 *
 * The diagram shows modules; the explorer goes deeper — files, symbols,
 * packages and HTTP routes — using the backend's graph endpoints. Everything
 * here is the camelCase shape the UI works in; mapping from the API's
 * snake_case lives in ./api. */

/** Node labels the backend stores. */
export type GraphLabel =
  | "Repository"
  | "Module"
  | "File"
  | "Symbol"
  | "Package"
  | "Route";

/** Relationship types, as returned by `GET /graph/edge-types`. */
export type GraphEdgeType =
  | "CONTAINS"
  | "DEFINES"
  | "HAS_MEMBER"
  | "IMPORTS"
  | "USES_PACKAGE"
  | "CALLS"
  | "RENDERS"
  | "EXTENDS"
  | "IMPLEMENTS"
  | "HANDLES"
  | "REQUESTS"
  | "DEPENDS_ON"
  | "USES_EXTERNAL";

/** A node as summarised in lists: search hits, children, neighbours. */
export interface GraphNodeSummary {
  id: string;
  name: string;
  /** "function", "class", "component", "module"… — absent for files. */
  kind: string | null;
  labels: GraphLabel[];
  /** Where it lives: a file's own path, or the file a symbol is defined in. */
  path: string | null;
  signature: string | null;
}

/** One node with everything the detail view shows. */
export interface GraphNodeDetail {
  id: string;
  labels: GraphLabel[];
  name: string;
  kind: string | null;
  path: string | null;
  signature: string | null;
  docstring: string | null;
  startLine: number | null;
  endLine: number | null;
  language: string | null;
  /** Files of a module, symbols of a file, members of a class. */
  children: GraphNodeSummary[];
}

/** An edge between two nodes in a neighbourhood. */
export interface GraphRelation {
  source: string;
  target: string;
  type: GraphEdgeType;
  /** How many call sites are behind a CALLS edge, where known. */
  count: number | null;
}

export interface Neighbourhood {
  nodes: GraphNodeSummary[];
  relations: GraphRelation[];
}

/** One side of a node's connections, ready to render. */
export interface RelationGroup {
  type: GraphEdgeType;
  direction: "out" | "in";
  nodes: GraphNodeSummary[];
}

/** What the graph contains and how much of the code it could resolve. */
export interface GraphCoverage {
  repoFullName: string;
  graphVersion: string | null;
  indexedAt: string | null;
  nodesByLabel: Record<string, number>;
  edgesByType: Record<string, number>;
  files: number | null;
  symbols: number | null;
  /** "included" or "omitted_over_cap" — the graph says when it degraded. */
  symbolLayer: string | null;
  resolution: ResolutionCoverage | null;
  /** Files the indexer deliberately skipped, by reason. */
  skipped: Record<string, number>;
}

/** Resolution rates the backend reports rather than implies. */
export interface ResolutionCoverage {
  internalImportResolution: number;
  importsToFiles: number;
  importsToPackages: number;
  importsUnresolved: number;
  callsTotal: number;
  callsResolved: number;
  callsToPackages: number;
  callsAccounted: number;
  routesTotal: number;
  httpCallsTotal: number;
  httpCallsMatched: number;
}
