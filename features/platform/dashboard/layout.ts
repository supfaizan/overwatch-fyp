/* The backend graph carries no coordinates — it's a dependency graph, not a
   diagram — so the drawing is computed here.

   **The folder tree, and only the folder tree, decides the drawing.**
   Top-level folders share the first row; open one and what it holds takes the
   row beneath it, and so on down. That is the whole point of the view — it
   should read like a directory opened one level at a time — so dependencies
   are given no say in it at all. They are drawn over the top.

   Letting them in was tried and is wrong twice over: a dependency would drag
   a node onto a row that has nothing to do with where it lives, and the one
   way to stop dagre doing that (`minlen: 0`) makes it throw outright.

   So dagre is given the tree: it assigns the rows and places everything.
   What is ours is the spacing, and the left-to-right order of each folder's
   children — dagre will happily hand them back reversed, which puts a file
   before the folders it should follow, so the last step takes the seats it
   produced and sits the children in them in the order they were given.

   The lines themselves are drawn by React Flow. */

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
  tree: LayoutEdge[],
): Record<string, Point> {
  const ids = new Set(nodes.map((node) => node.id));
  const between = (edge: LayoutEdge) =>
    edge.source !== edge.target && ids.has(edge.source) && ids.has(edge.target);

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
  // Children arrive already sorted — folders before files, then by how
  // connected they are — and dagre keeps that as their left-to-right order
  // under the parent, so a level reads like a directory listing.
  for (const edge of tree.filter(between).sort(bySourceThenTarget)) {
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

  return seatChildrenInOrder(positions, nodes, tree);
}

/**
 * Sit each folder's children in the order they arrived.
 *
 * Dagre decides *where* the seats in a row are; this decides who sits in
 * which. Only siblings ever swap places, so nothing moves to another row and
 * two nodes can never land on top of each other — the set of coordinates is
 * exactly the set dagre produced, just handed out in listing order.
 *
 * Without it the order is whatever dagre's crossing pass happened to settle
 * on, which for a plain tree is often the reverse of what it was given.
 */
function seatChildrenInOrder(
  positions: Record<string, Point>,
  nodes: LayoutNode[],
  tree: LayoutEdge[],
): Record<string, Point> {
  const parentOf = new Map(tree.map((edge) => [edge.target, edge.source]));
  const siblings = new Map<string, string[]>();

  // `nodes` arrives in listing order — folders, then files, then the rest —
  // so walking it in order builds each sibling group already sorted.
  for (const node of nodes) {
    const parent = parentOf.get(node.id);
    if (parent === undefined) continue;
    siblings.set(parent, [...(siblings.get(parent) ?? []), node.id]);
  }

  const seated = { ...positions };
  for (const children of siblings.values()) {
    const placed = children.filter((id) => seated[id] !== undefined);
    const seats = placed
      .map((id) => seated[id].x)
      .sort((left, right) => left - right);
    placed.forEach((id, index) => {
      seated[id] = { ...seated[id], x: seats[index] };
    });
  }
  return seated;
}

const byId = (a: LayoutNode, b: LayoutNode) => a.id.localeCompare(b.id);
const bySourceThenTarget = (a: LayoutEdge, b: LayoutEdge) =>
  a.source.localeCompare(b.source) || a.target.localeCompare(b.target);
