import dagre from '@dagrejs/dagre';

type Point = { x: number; y: number };

/** Must match what NodeCard and OverflowNode draw: dagre reserves space from these. */
export const NODE_WIDTH = 184;
const NODE_HEIGHT = 68;

/**
 * Positions from the folder tree only: a folder's children take the row beneath it.
 * Dependencies get no say (they'd drag nodes onto unrelated rows) and are drawn over the top.
 */
export function layoutPositions(
  nodeIds: string[],
  tree: { parent: string; child: string }[],
): Record<string, Point> {
  const ids = new Set(nodeIds);
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: 'TB',
    nodesep: 28,
    ranksep: 110,
    ranker: 'network-simplex',
    marginx: 40,
    marginy: 40,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  // inserted in id order so the same graph always draws the same way
  for (const id of [...nodeIds].sort()) {
    graph.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const line of tree) {
    if (line.parent !== line.child && ids.has(line.parent) && ids.has(line.child)) {
      graph.setEdge(line.parent, line.child);
    }
  }
  dagre.layout(graph);

  const positions: Record<string, Point> = {};
  for (const id of nodeIds) {
    const placed = graph.node(id);
    // dagre centres a node on its coordinates; React Flow positions by corner
    if (placed) {
      positions[id] = { x: placed.x - NODE_WIDTH / 2, y: placed.y - NODE_HEIGHT / 2 };
    }
  }
  return seatChildrenInOrder(positions, nodeIds, tree);
}

/**
 * Dagre picks where a row's seats are but often hands siblings back reversed; re-seat them in the
 * order the server listed them (folders, then files). Only siblings swap, so nothing can overlap.
 */
function seatChildrenInOrder(
  positions: Record<string, Point>,
  nodeIds: string[],
  tree: { parent: string; child: string }[],
) {
  const parentOf = new Map(tree.map((line) => [line.child, line.parent]));
  const siblings = new Map<string, string[]>();
  for (const id of nodeIds) {
    const parent = parentOf.get(id);
    if (parent !== undefined && positions[id]) {
      siblings.set(parent, [...(siblings.get(parent) ?? []), id]);
    }
  }

  const seated = { ...positions };
  for (const children of siblings.values()) {
    const seats = children.map((id) => seated[id].x).sort((a, b) => a - b);
    children.forEach((id, index) => {
      seated[id] = { ...seated[id], x: seats[index] };
    });
  }
  return seated;
}
