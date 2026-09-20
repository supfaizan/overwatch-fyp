/* Pure mapping from a chapter's SceneMode to how the sample graph looks.
   Keeping this free of React makes every scene easy to read and test. */

import {
  CONTRACT_BREAK,
  LOGIN_FLOW,
  PUSH,
  QUESTION,
  TICKETS,
} from "../static/scenarios";
import { EDGES, NODES, edgeId } from "../static/system";
import type {
  EdgeId,
  EdgeTone,
  NodeId,
  NodeTone,
  Scene,
  SceneMode,
} from "../types";

const QUIET: Pick<Scene, "sketch" | "tags" | "pulse"> = {
  sketch: false,
  tags: [],
  pulse: null,
};

function nodeTones(toneOf: (id: NodeId) => NodeTone): Scene["nodes"] {
  return Object.fromEntries(
    NODES.map((node) => [node.id, toneOf(node.id)]),
  ) as Record<NodeId, NodeTone>;
}

function edgeTones(
  toneOf: (source: NodeId, target: NodeId) => EdgeTone,
): Scene["edges"] {
  return Object.fromEntries(
    EDGES.map((edge) => [edgeId(edge), toneOf(edge.source, edge.target)]),
  ) as Record<EdgeId, EdgeTone>;
}

/** Light up a set of nodes and the edges between them; dim everything else. */
function spotlight(ids: readonly NodeId[]): Scene {
  const lit = new Set(ids);
  return {
    ...QUIET,
    nodes: nodeTones((id) => (lit.has(id) ? "focus" : "dim")),
    edges: edgeTones((source, target) =>
      lit.has(source) && lit.has(target) ? "focus" : "dim",
    ),
  };
}

/** The login flow, walked up to (and including) `step`. */
function flowScene(step: number): Scene {
  const path: readonly NodeId[] = LOGIN_FLOW.steps.map((s) => s.nodeId);
  const current = Math.min(Math.max(step, 0), path.length - 1);

  return {
    ...QUIET,
    nodes: nodeTones((id) => {
      const position = path.indexOf(id);
      if (position === -1) return "dim";
      if (position < current) return "focus";
      return position === current ? "current" : "idle";
    }),
    edges: edgeTones((source, target) => {
      const position = path.indexOf(source);
      if (position === -1 || path[position + 1] !== target) return "dim";
      return position < current ? "focus" : "idle";
    }),
    pulse: { nodeId: path[current], step: current },
  };
}

export function buildScene(mode: SceneMode, flowStep = 0): Scene {
  switch (mode) {
    case "intro":
      return {
        ...QUIET,
        sketch: true,
        nodes: nodeTones(() => "sketch"),
        edges: edgeTones(() => "hidden"),
      };

    case "map":
      return {
        ...QUIET,
        nodes: nodeTones(() => "idle"),
        edges: edgeTones(() => "idle"),
      };

    case "ask":
      return spotlight(QUESTION.nodeIds);

    case "flow":
      return flowScene(flowStep);

    case "tickets": {
      const ticketed = new Set<NodeId>(TICKETS.map((t) => t.nodeId));
      return {
        ...QUIET,
        nodes: nodeTones((id) => (ticketed.has(id) ? "focus" : "idle")),
        edges: edgeTones(() => "idle"),
        tags: TICKETS.map((t) => ({ nodeId: t.nodeId, label: t.key })),
      };
    }

    case "contracts": {
      const { source, target } = CONTRACT_BREAK;
      return {
        ...QUIET,
        nodes: nodeTones((id) =>
          id === source || id === target ? "alert" : "dim",
        ),
        edges: edgeTones((s, t) =>
          s === source && t === target ? "alert" : "dim",
        ),
      };
    }

    case "live":
      return {
        ...QUIET,
        nodes: nodeTones((id) => (id === PUSH.nodeId ? "changed" : "idle")),
        edges: edgeTones(() => "idle"),
      };

    case "complete":
      return {
        ...QUIET,
        nodes: nodeTones(() => "healthy"),
        edges: edgeTones(() => "healthy"),
      };
  }
}
