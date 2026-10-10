import type { Canvas, GraphView } from '../types';
import { mergeByPair } from './edges';
import { layoutPositions } from './layout';

/** Lay a view out for React Flow. Edges are merged first, so layout and drawing agree on the lines. */
export function toCanvas(view: GraphView): Canvas {
  // overflow markers carry real edges, so they're laid out with everything else
  const positions = layoutPositions([...view.nodes.map((node) => node.id), ...view.overflows.map((overflow) => overflow.id)], view.containment);
  const at = (id: string) => positions[id] ?? { x: 0, y: 0 };

  return {
    view,
    nodes: [
      ...view.nodes.map((node) => ({ id: node.id, type: 'graphNode' as const, position: at(node.id), data: node })),
      ...view.overflows.map((overflow) => ({ id: overflow.id, type: 'overflow' as const, position: at(overflow.id), data: overflow })),
    ],
    edges: mergeByPair(view.edges).map(({ id, source, target, types, weight, collapsed }) => ({
      id,
      source,
      target,
      data: { types, weight, collapsed },
    })),
  };
}
