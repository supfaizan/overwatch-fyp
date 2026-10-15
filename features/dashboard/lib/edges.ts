import type { EdgeType, ViewEdge } from '../types';

/** Which relationship names a merged line, most specific first. */
const PRECEDENCE: EdgeType[] = [
  'REQUESTS',
  'HANDLES',
  'CALLS',
  'RENDERS',
  'EXTENDS',
  'IMPLEMENTS',
  'IMPORTS',
  'USES_PACKAGE',
];

const rank = (type: EdgeType) => {
  const index = PRECEDENCE.indexOf(type);
  return index === -1 ? PRECEDENCE.length : index;
};

export type MergedEdge = {
  id: string;
  source: string;
  target: string;
  /** every relationship type between the pair, most specific first */
  types: EdgeType[];
  weight: number;
  collapsed: boolean;
};

/** Relationships between the same pair would draw on identical coordinates, so they become one line. */
export function mergeByPair(edges: ViewEdge[]): MergedEdge[] {
  const byPair = new Map<string, MergedEdge>();
  for (const edge of edges) {
    const id = `${edge.source}->${edge.target}`;
    const existing = byPair.get(id);
    if (existing) {
      existing.types.push(edge.type);
      existing.weight += edge.weight;
      existing.collapsed ||= edge.collapsed;
    } else {
      byPair.set(id, {
        id,
        source: edge.source,
        target: edge.target,
        types: [edge.type],
        weight: edge.weight,
        collapsed: edge.collapsed,
      });
    }
  }
  const merged = [...byPair.values()];
  for (const edge of merged) {
    edge.types.sort((a, b) => rank(a) - rank(b));
  }
  return merged;
}

type Linked = { source: string; target: string };

export type Relation = 'outgoing' | 'incoming' | 'unrelated' | 'none';

/** Where a line stands relative to the node in focus. */
export function relationTo(edge: Linked, focusId: string | null): Relation {
  if (!focusId) {
    return 'none';
  }
  if (edge.source === focusId) {
    return 'outgoing';
  }
  if (edge.target === focusId) {
    return 'incoming';
  }
  return 'unrelated';
}

/** The node in focus and everything one hop from it. */
export function neighbourhood(edges: Linked[], focusId: string | null): Set<string> {
  if (!focusId) {
    return new Set();
  }
  const found = new Set([focusId]);
  for (const edge of edges) {
    if (edge.source === focusId) {
      found.add(edge.target);
    }
    if (edge.target === focusId) {
      found.add(edge.source);
    }
  }
  return found;
}

/** "imports, calls · 14" */
export function describeEdge(edge: { types: EdgeType[]; weight: number }): string {
  return `${
    edge.types.map((type) => type.toLowerCase().replaceAll('_', ' ')).join(', ')
  } · ${edge.weight}`;
}
