/* The sample system the landing page animates: a small web app with one node
   per top-level directory, matching how the real product groups modules. */

import type { EdgeId, NodeId, SystemEdge, SystemNode } from "../types";

/** Coordinate space every node position is expressed in. */
export const STAGE_SIZE = { width: 600, height: 460 } as const;

export const NODES: readonly SystemNode[] = [
  { id: "web", kind: "module", x: 300, y: 52, sketchTilt: -4 },
  { id: "api", kind: "module", x: 300, y: 164, sketchTilt: 3 },
  { id: "auth", kind: "module", x: 118, y: 284, sketchTilt: -3 },
  { id: "billing", kind: "module", x: 300, y: 284, sketchTilt: 5 },
  { id: "mailer", kind: "module", x: 482, y: 284, sketchTilt: -5 },
  { id: "db", kind: "module", x: 196, y: 404, sketchTilt: 2 },
  { id: "packages", kind: "external", x: 420, y: 404, sketchTilt: -3 },
];

/** Dependencies as the parser resolves them from imports. */
export const EDGES: readonly SystemEdge[] = [
  { source: "web", target: "api" },
  { source: "api", target: "auth" },
  { source: "api", target: "billing" },
  { source: "api", target: "mailer" },
  { source: "auth", target: "db" },
  { source: "billing", target: "db" },
  { source: "billing", target: "packages" },
  { source: "mailer", target: "packages" },
];

/** What the hand-drawn wiki diagram claims: close, but wrong. It invents
 *  web → db and misses three real dependencies. */
export const SKETCH_EDGES: readonly SystemEdge[] = [
  { source: "web", target: "api" },
  { source: "web", target: "db" },
  { source: "api", target: "auth" },
  { source: "api", target: "billing" },
  { source: "auth", target: "db" },
  { source: "mailer", target: "packages" },
];

export const edgeId = (edge: SystemEdge): EdgeId =>
  `${edge.source}->${edge.target}`;

const NODE_BY_ID = new Map(NODES.map((node) => [node.id, node]));

export function getNode(id: NodeId): SystemNode {
  const node = NODE_BY_ID.get(id);
  if (!node) throw new Error(`Unknown landing node: ${id}`);
  return node;
}
