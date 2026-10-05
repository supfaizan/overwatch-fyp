/* The flow view's drawing: only the walkthrough's steps, each inside a box
   for the area of the codebase it lives in.

   Opening the real folders to show a flow drags in everything else they
   hold, so the flow view draws the flow on its own: its steps, the calls
   between them, and — as labelled boxes, not opened folders — where each one
   lives. Size is bounded by the flow (tens of steps), never by the repository.

   Pure functions over flow data: no React, no fetching. */

import dagre from "@dagrejs/dagre";
import type { Point } from "../../layout";
import type { FlowStep, FlowVia } from "../../types";

/** Rendered size of a step card; dagre reserves exactly this. */
export const STEP_WIDTH = 224;
export const STEP_HEIGHT = 64;
const NODE_SEPARATION = 36;
const RANK_SEPARATION = 56;
/** Room inside an area box above its first step, for the area's label. */
const AREA_LABEL_SPACE = 28;

/** Top-level folders that hold one deployable each in a monorepo. A step in
 *  `apps/auth/...` belongs to the `apps/auth` area, whatever folder it is
 *  in below that — the service boundary is what a flow crosses. */
const MONOREPO_ROOTS = new Set(["apps", "packages", "libs", "services", "modules", "microservices"]);

export interface FlowStepLayout {
  id: string;
  index: number;
  step: FlowStep;
  position: Point;
}

export interface FlowAreaLayout {
  id: string;
  label: string;
  position: Point;
  width: number;
  height: number;
}

export interface FlowLinkLayout {
  id: string;
  source: string;
  target: string;
  /** Index of the step this link leads into. */
  targetIndex: number;
  via: FlowVia | null;
}

export interface FlowLayout {
  steps: FlowStepLayout[];
  areas: FlowAreaLayout[];
  links: FlowLinkLayout[];
}

export const stepNodeId = (index: number) => `flow-step-${index}`;
const areaNodeId = (area: string) => `flow-area-${area}`;

/** Where a step lives, coarsely enough to group by: its service in a
 *  monorepo (`apps/auth`), otherwise its file's folder. Steps with no file
 *  (a message channel) belong to no area — they sit between areas, which is
 *  exactly what a message between services is. */
export function flowArea(step: Pick<FlowStep, "path">): string | null {
  if (!step.path) return null;
  const segments = step.path.split("/");
  if (segments.length >= 3 && MONOREPO_ROOTS.has(segments[0])) {
    return `${segments[0]}/${segments[1]}`;
  }
  return segments.length > 1 ? segments.slice(0, -1).join("/") : "(root)";
}

/** Lay out a flow: steps as a tree top to bottom, grouped into area boxes. */
export function layoutFlow(steps: readonly FlowStep[]): FlowLayout {
  const graph = new dagre.graphlib.Graph({ compound: true });
  graph.setGraph({
    rankdir: "TB",
    nodesep: NODE_SEPARATION,
    ranksep: RANK_SEPARATION,
    marginx: 40,
    marginy: 40,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  const areas = new Map<string, string>(); // area id -> label
  steps.forEach((step, index) => {
    graph.setNode(stepNodeId(index), { width: STEP_WIDTH, height: STEP_HEIGHT });
    const area = flowArea(step);
    if (area === null) return;
    const id = areaNodeId(area);
    if (!areas.has(id)) {
      areas.set(id, area);
      graph.setNode(id, {});
    }
    graph.setParent(stepNodeId(index), id);
  });

  const links = flowLinks(steps);
  for (const link of links) graph.setEdge(link.source, link.target);

  dagre.layout(graph);

  return {
    steps: steps.map((step, index) => ({
      id: stepNodeId(index),
      index,
      step,
      position: corner(graph.node(stepNodeId(index))),
    })),
    areas: [...areas].map(([id, label]) => {
      const placed = graph.node(id);
      // Dagre fits a cluster tightly around its members; the label needs a
      // strip above them that the box must include.
      return {
        id,
        label,
        position: { x: placed.x - placed.width / 2, y: placed.y - placed.height / 2 - AREA_LABEL_SPACE },
        width: placed.width,
        height: placed.height + AREA_LABEL_SPACE,
      };
    }),
    links,
  };
}

/** One link per step, from the step that led to it. */
export function flowLinks(steps: readonly FlowStep[]): FlowLinkLayout[] {
  return steps.flatMap((step, index) =>
    step.parent === null || step.parent < 0 || step.parent >= steps.length
      ? []
      : [{
          id: `flow-link-${index}`,
          source: stepNodeId(step.parent),
          target: stepNodeId(index),
          targetIndex: index,
          via: step.via,
        }],
  );
}

function corner(placed: { x: number; y: number; width: number; height: number }): Point {
  // Dagre centres a node on its coordinates; React Flow positions by corner.
  return { x: placed.x - placed.width / 2, y: placed.y - placed.height / 2 };
}
