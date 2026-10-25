import type { Canvas, CanvasNode, GraphView } from '../types';
import { moduleTints } from './appearance';
import { mergeByPair } from './edges';
import { dotSize, forcePositions } from './force-layout';
import { layoutPositions } from './layout';

/** The two ways to draw a view: a force-directed web, or the folder tree top to bottom. */
export const DIAGRAM = { graph: 'graph', tree: 'tree' } as const;
export type Diagram = (typeof DIAGRAM)[keyof typeof DIAGRAM];

/**
 * Lay a view out for React Flow. Edges are merged first, so layout and drawing agree on the lines.
 * `previous` holds the web's last positions, so it grows rather than reshuffles; the tree ignores it.
 */
export function toCanvas(
  view: GraphView,
  diagram: Diagram,
  previous: Record<string, { x: number; y: number }> = {},
): Canvas {
  const merged = mergeByPair(view.edges);
  // overflow markers carry real edges, so they're laid out with everything else
  const positions = diagram === DIAGRAM.graph
    ? forcePositions(
      [
        ...view.nodes.map((node) => {
          return { id: node.id, size: dotSize(node.label), name: node.name };
        }),
        ...view.overflows.map((overflow) => {
          return { id: overflow.id, size: dotSize(), name: `+${overflow.hidden}` };
        }),
      ],
      view.containment,
      previous,
    )
    : layoutPositions([
      ...view.nodes.map((node) => {
        return node.id;
      }),
      ...view.overflows.map((overflow) => {
        return overflow.id;
      }),
    ], view.containment);
  const tintOf = moduleTints(view);
  const at = (id: string) => {
    return positions[id] ?? { x: 0, y: 0 };
  };

  return {
    view,
    nodes: [
      ...view.nodes.map((node) => {
        return {
          id: node.id,
          type: 'graphNode' as const,
          position: at(node.id),
          data: { ...node, tint: tintOf(node.id) },
        };
      }),
      ...view.overflows.map((overflow) => {
        return {
          id: overflow.id,
          type: 'overflow' as const,
          position: at(overflow.id),
          data: overflow,
        };
      }),
    ],
    edges: merged.map(({ id, source, target, types, weight, collapsed }) => {
      return {
        id,
        source,
        target,
        data: { types, weight, collapsed },
      };
    }),
  };
}

/** Where each node of a new layout glides from: where it is now, or, if new, where its folder is. */
export function startsOf(drawn: CanvasNode[], next: Canvas): Map<string, { x: number; y: number }> {
  const was = new Map(drawn.map((node) => {
    return [node.id, node.position];
  }));
  const parentOf = new Map([
    ...next.view.containment.map((line) => {
      return [line.child, line.parent] as const;
    }),
    ...next.view.overflows.map((overflow) => {
      return [overflow.id, overflow.container_id] as const;
    }),
  ]);
  const starts = new Map<string, { x: number; y: number }>();
  for (const node of next.nodes) {
    let holder: string | undefined = node.id;
    while (holder !== undefined && !was.has(holder)) {
      holder = parentOf.get(holder);
    }
    const from = holder === undefined ? undefined : was.get(holder);
    if (from) {
      starts.set(node.id, from);
    }
  }
  return starts;
}
