import { type Edge, MarkerType } from '@xyflow/react';
import { ancestorsOf, EXTERNAL_MODULE, ROUTES_MODULE } from './ancestors';
import { WALK_STROKE } from './appearance';

/** How long each step of a walkthrough is shown while it plays. */
export const WALK_STEP_MS = 1_600;

/**
 * The folders to open to draw a step: those holding it that aren't open yet, or none when opening
 * them would pass the backend's cap on open folders (a closed folder then stands in for the step).
 */
export function foldersToOpen(expanded: string[], ancestors: string[], max: number): string[] {
  const closed = ancestors.filter((id) => {
    return !expanded.includes(id);
  });
  return expanded.length + closed.length > max ? [] : closed;
}

/**
 * What stands for each step on the diagram: the step itself if it's drawn, else the innermost drawn
 * folder holding it, else the repository; null if none of those is drawn.
 */
export function walkStandIns(steps: string[], drawn: Set<string>, repo: string): (string | null)[] {
  return steps.map((step) => {
    return [step, ...ancestorsOf(step, repo).reverse(), repo].find((id) => {
      return drawn.has(id);
    }) ?? null;
  });
}

export type WalkMark = { numbers: number[]; current: boolean };

/** The step numbers (1-based) each drawn node carries; a closed folder holding several carries them all. */
export function walkMarks(standIns: (string | null)[], cursor: number): Map<string, WalkMark> {
  const marks = new Map<string, WalkMark>();
  standIns.forEach((id, index) => {
    if (id === null) {
      return;
    }
    const mark = marks.get(id) ?? { numbers: [], current: false };
    marks.set(id, {
      numbers: [...mark.numbers, index + 1],
      current: mark.current || index === cursor,
    });
  });
  return marks;
}

/** The hops walked so far between drawn nodes, in order; the last is the one just taken. */
export function walkPath(standIns: (string | null)[], cursor: number): [string, string][] {
  const hops: [string, string][] = [];
  for (let index = 1; index <= cursor && index < standIns.length; index++) {
    const from = standIns[index - 1];
    const to = standIns[index];
    if (from !== null && to !== null && from !== to) {
      hops.push([from, to]);
    }
  }
  return hops;
}

/** A step's short name: `login` for `repo:src/auth.ts#login@2`, `react` for `repo:pkg:npm/react`. */
export function stepName(nodeId: string, repo: string): string {
  if (!nodeId.startsWith(`${repo}:`)) {
    return nodeId.split('/').at(-1) ?? nodeId;
  }
  const rest = nodeId.slice(repo.length + 1);
  if (rest === EXTERNAL_MODULE) {
    return 'external dependencies';
  }
  if (rest === ROUTES_MODULE) {
    return 'routes';
  }
  if (rest.startsWith('pkg:')) {
    // `pkg:npm/@scope/name` keeps its scope
    return rest.split('/').slice(1).join('/') || rest;
  }
  const [path, symbol] = rest.split('#', 2);
  if (symbol !== undefined) {
    return symbol.replace(/@\d+$/, '');
  }
  return path.split('/').at(-1) ?? path;
}

/**
 * Draw a walkthrough's path over the relationship lines: a line already joining two steps becomes
 * part of it, and steps with none between them get one of their own, dashed. The latest hop is
 * strongest and, with `animate`, flows.
 */
export function walkEdges(edges: Edge[], path: [string, string][], animate: boolean): Edge[] {
  if (path.length === 0) {
    return edges;
  }
  const byId = new Map(edges.map((edge) => {
    return [edge.id, edge];
  }));
  const onPath = new Map<string, Edge>();
  path.forEach(([from, to], index) => {
    const latest = index === path.length - 1;
    const along = byId.get(`${from}->${to}`);
    const against = byId.get(`${to}->${from}`);
    const marker = { type: MarkerType.ArrowClosed, width: 16, height: 16, color: WALK_STROKE };
    const base = along ?? against ?? {
      id: `walk:${from}->${to}`,
      source: from,
      target: to,
      selectable: false,
      focusable: false,
      interactionWidth: 0,
    };
    onPath.set(base.id, {
      ...base,
      label: undefined,
      zIndex: 2,
      animated: latest && animate,
      // a line drawn the other way still points along the walk
      markerEnd: along || !against ? marker : undefined,
      markerStart: !along && against ? marker : undefined,
      style: {
        stroke: WALK_STROKE,
        strokeWidth: 2.5,
        strokeDasharray: along || against ? undefined : '6 4',
        opacity: latest ? 1 : 0.6,
        transition: 'opacity 140ms, stroke 140ms',
      },
    });
  });
  const added = [...onPath.values()].filter((edge) => {
    return !byId.has(edge.id);
  });
  // on top of everything else
  return [
    ...edges.filter((edge) => {
      return !onPath.has(edge.id);
    }),
    ...edges.filter((edge) => {
      return onPath.has(edge.id);
    }).map((edge) => {
      return onPath.get(edge.id) ?? edge;
    }),
    ...added,
  ];
}
