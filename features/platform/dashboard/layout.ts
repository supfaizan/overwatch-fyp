/* The backend graph carries no coordinates — it's a dependency graph, not a
   diagram — so positions are derived here.

   Nodes are placed in dependency layers: a module sits one row below every
   module that imports it, so consumers land at the top and leaves at the
   bottom. The collapsed external-dependency node is forced to the last row.

   Layering is a bounded relaxation rather than a topological sort because
   import cycles are common in real repositories and must not hang the canvas. */

interface LayoutNode {
  id: string;
  kind: string;
}

interface LayoutEdge {
  source: string;
  target: string;
  kind: string;
}

const COLUMN_WIDTH = 230;
const ROW_HEIGHT = 150;

export function layoutPositions(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
): Record<string, { x: number; y: number }> {
  const depth: Record<string, number> = {};
  for (const node of nodes) depth[node.id] = 0;

  const internal = edges.filter(
    (e) =>
      e.kind === "DEPENDS_ON" &&
      e.source !== e.target &&
      e.source in depth &&
      e.target in depth,
  );

  // Relax at most `nodes.length` times: enough for the longest acyclic path,
  // and a hard stop if the import graph contains a cycle.
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const edge of internal) {
      if (depth[edge.target] < depth[edge.source] + 1) {
        depth[edge.target] = depth[edge.source] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }

  const moduleNodes = nodes.filter((n) => n.kind !== "external");
  const externalNodes = nodes.filter((n) => n.kind === "external");

  const maxModuleDepth = moduleNodes.reduce(
    (max, n) => Math.max(max, depth[n.id]),
    0,
  );
  for (const node of externalNodes) depth[node.id] = maxModuleDepth + 1;

  // Group by row, ordering within a row by id so the layout is stable across
  // re-parses (node ids are path-derived and stable by design).
  const rows = new Map<number, string[]>();
  for (const node of [...nodes].sort((a, b) => a.id.localeCompare(b.id))) {
    const row = rows.get(depth[node.id]) ?? [];
    row.push(node.id);
    rows.set(depth[node.id], row);
  }

  const widest = Math.max(...[...rows.values()].map((r) => r.length), 1);
  const positions: Record<string, { x: number; y: number }> = {};

  for (const [row, ids] of rows) {
    // Centre each row against the widest one so the graph reads as a pyramid
    // rather than flushing everything left.
    const offset = ((widest - ids.length) * COLUMN_WIDTH) / 2;
    ids.forEach((id, index) => {
      positions[id] = { x: offset + index * COLUMN_WIDTH, y: row * ROW_HEIGHT };
    });
  }

  return positions;
}
