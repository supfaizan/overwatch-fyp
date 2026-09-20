/* The backend graph carries no coordinates — it's a dependency graph, not a
   diagram — so positions are derived here.

   Nodes are placed in dependency layers: a node sits below the nodes that
   depend on it, so consumers land at the top and leaves at the bottom. The
   two synthetic containers — external packages and HTTP routes — are forced
   to the last row, because nothing inside the repository sits beneath them.

   Real repositories import in cycles (features ↔ components ↔ lib), and a
   cycle has no "depth". Back edges are therefore dropped before layering:
   they still render as edges, they just do not push a node further down. An
   earlier version relaxed depths repeatedly instead, which let a cycle add a
   row per pass — nine modules once spread over thirty rows, most of them off
   screen. */

interface LayoutNode {
  id: string;
  kind: string;
}

interface LayoutEdge {
  source: string;
  target: string;
}

/** Kinds that always sit at the bottom: they are outside the repository, or
 *  they are its outward-facing surface. */
const SINK_KINDS: ReadonlySet<string> = new Set(["external", "routes"]);

const COLUMN_WIDTH = 230;
const ROW_HEIGHT = 150;

export function layoutPositions(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
): Record<string, { x: number; y: number }> {
  const ids = new Set(nodes.map((node) => node.id));
  const dependencies = edges.filter(
    (edge) =>
      edge.source !== edge.target &&
      ids.has(edge.source) &&
      ids.has(edge.target),
  );

  const depth = layerDepths(nodes, forwardEdges(nodes, dependencies));

  // Everything outside the repository sits below everything inside it.
  const deepest = nodes
    .filter((node) => !SINK_KINDS.has(node.kind))
    .reduce((max, node) => Math.max(max, depth.get(node.id) ?? 0), 0);
  for (const node of nodes) {
    if (SINK_KINDS.has(node.kind)) depth.set(node.id, deepest + 1);
  }

  return positionsByRow(nodes, depth);
}

/**
 * Edges that point "downwards", with cycle-closing edges removed.
 *
 * A depth-first walk in stable id order classifies each edge: one that points
 * back at a node still on the stack closes a cycle, and is dropped.
 */
function forwardEdges(nodes: LayoutNode[], edges: LayoutEdge[]): LayoutEdge[] {
  const outgoing = new Map<string, LayoutEdge[]>();
  for (const edge of edges) {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  }

  const kept: LayoutEdge[] = [];
  const finished = new Set<string>();
  const onStack = new Set<string>();

  const visit = (start: string) => {
    // Iterative so a deep or wide graph cannot overflow the stack.
    const stack: { id: string; index: number }[] = [{ id: start, index: 0 }];
    onStack.add(start);

    while (stack.length > 0) {
      const frame = stack.at(-1)!;
      const candidates = outgoing.get(frame.id) ?? [];

      if (frame.index >= candidates.length) {
        onStack.delete(frame.id);
        finished.add(frame.id);
        stack.pop();
        continue;
      }

      const edge = candidates[frame.index++];
      if (onStack.has(edge.target)) continue; // closes a cycle: drop it
      kept.push(edge);
      if (!finished.has(edge.target)) {
        onStack.add(edge.target);
        stack.push({ id: edge.target, index: 0 });
      }
    }
  };

  for (const node of [...nodes].sort(byId)) {
    if (!finished.has(node.id)) visit(node.id);
  }
  return kept;
}

/** Longest path from a root, over an acyclic edge set. */
function layerDepths(nodes: LayoutNode[], edges: LayoutEdge[]): Map<string, number> {
  const depth = new Map(nodes.map((node) => [node.id, 0]));
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();

  for (const edge of edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }

  // Kahn's algorithm, seeded in id order so the result is stable.
  const queue = [...incoming.entries()]
    .filter(([, count]) => count === 0)
    .map(([id]) => id)
    .sort();

  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const target of outgoing.get(id) ?? []) {
      depth.set(target, Math.max(depth.get(target) ?? 0, (depth.get(id) ?? 0) + 1));
      const remaining = (incoming.get(target) ?? 1) - 1;
      incoming.set(target, remaining);
      if (remaining === 0) queue.push(target);
    }
  }

  return depth;
}

function positionsByRow(
  nodes: LayoutNode[],
  depth: Map<string, number>,
): Record<string, { x: number; y: number }> {
  const rows = new Map<number, string[]>();
  // Ordering within a row by id keeps the layout stable across re-parses;
  // node ids are path-derived and stable by design.
  for (const node of [...nodes].sort(byId)) {
    const row = depth.get(node.id) ?? 0;
    rows.set(row, [...(rows.get(row) ?? []), node.id]);
  }

  const widest = Math.max(...[...rows.values()].map((row) => row.length), 1);
  const positions: Record<string, { x: number; y: number }> = {};

  for (const [row, rowIds] of rows) {
    // Centre each row against the widest one so the graph reads as a pyramid
    // rather than flushing everything left.
    const offset = ((widest - rowIds.length) * COLUMN_WIDTH) / 2;
    rowIds.forEach((id, index) => {
      positions[id] = { x: offset + index * COLUMN_WIDTH, y: row * ROW_HEIGHT };
    });
  }

  return positions;
}

const byId = (a: LayoutNode, b: LayoutNode) => a.id.localeCompare(b.id);
