/* The backend graph carries no coordinates — it's a dependency graph, not a
   diagram — so the drawing is computed here.

   This is a layered drawing: rows run top to bottom, a node sits below what
   depends on it, and lines run downwards. Getting that right means breaking
   cycles (real repositories import in circles), assigning rows, and ordering
   each row so the lines between rows cross as little as possible.

   All three are delegated to dagre rather than hand-rolled — the ordering
   step in particular needs dummy nodes for edges that span several rows, and
   that is where a home-grown layout falls over. What is ours is the choice of
   spacing. The lines themselves are drawn by React Flow. */

import dagre from "@dagrejs/dagre";

interface LayoutNode {
  id: string;
  kind: string;
}

interface LayoutEdge {
  source: string;
  target: string;
}

export interface Point {
  x: number;
  y: number;
}

/** The node card's rendered size. Dagre reserves space from these, so they
 *  have to match what `GraphNodeCard` and `OverflowNode` actually draw. */
const NODE_WIDTH = 184;
const NODE_HEIGHT = 68;

/** Gap between nodes in a row, and between rows. Generous vertically: a line
 *  that has to turn needs somewhere to turn. */
const NODE_SEPARATION = 48;
const RANK_SEPARATION = 96;

export function layoutPositions(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
): Record<string, Point> {
  const ids = new Set(nodes.map((node) => node.id));
  const drawable = edges.filter(
    (edge) =>
      edge.source !== edge.target &&
      ids.has(edge.source) &&
      ids.has(edge.target),
  );

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: "TB",
    nodesep: NODE_SEPARATION,
    ranksep: RANK_SEPARATION,
    ranker: "network-simplex",
    marginx: 40,
    marginy: 40,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  // Inserted in id order so the same graph always draws the same way: node
  // ids are path-derived and stable, so the layout is stable across
  // re-parses and a selection survives a refresh.
  for (const node of [...nodes].sort(byId)) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of [...drawable].sort(bySourceThenTarget)) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  const positions: Record<string, Point> = {};
  for (const node of nodes) {
    const placed = graph.node(node.id);
    if (!placed) continue;
    // Dagre centres a node on its coordinates; React Flow positions by corner.
    positions[node.id] = {
      x: placed.x - NODE_WIDTH / 2,
      y: placed.y - NODE_HEIGHT / 2,
    };
  }

  return positions;
}

const byId = (a: LayoutNode, b: LayoutNode) => a.id.localeCompare(b.id);
const bySourceThenTarget = (a: LayoutEdge, b: LayoutEdge) =>
  a.source.localeCompare(b.source) || a.target.localeCompare(b.target);
