/* Stage geometry: turns node coordinates into CSS positions and SVG paths. */

import type { CSSProperties } from "react";
import { STAGE_SIZE } from "../static/system";
import type { SystemNode } from "../types";

/** Position a stage point as percentages, so it scales with the stage. */
export function stagePosition(x: number, y: number): CSSProperties {
  return {
    left: `${(x / STAGE_SIZE.width) * 100}%`,
    top: `${(y / STAGE_SIZE.height) * 100}%`,
  };
}

/** A gently bowed curve between two nodes, for the hand-drawn sketch layer. */
export function sketchPath(from: SystemNode, to: SystemNode, bow = 16): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  // Push the control point sideways, perpendicular to the edge.
  const cx = (from.x + to.x) / 2 - (dy / length) * bow;
  const cy = (from.y + to.y) / 2 + (dx / length) * bow;
  return `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`;
}
