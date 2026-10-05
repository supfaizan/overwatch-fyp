import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { getNode } from "../../static/system";
import type { EdgeTone, SystemEdge } from "../../types";

/** Base stroke per tone. Lit tones use a muted base so the moving dashes
 *  drawn on top stay visible. */
const BASE_STROKE: Record<EdgeTone, string> = {
  hidden: "var(--ow-line-2)",
  idle: "var(--ow-line-2)",
  focus: "var(--ow-signal-border)",
  dim: "var(--ow-line-1)",
  alert: "var(--ow-critical-border)",
  healthy: "var(--ow-success-border)",
};

/** Tones that carry travelling dashes, and their colour. */
const SIGNAL_STROKE: Partial<Record<EdgeTone, string>> = {
  focus: "var(--ow-signal)",
  healthy: "var(--ow-success)",
  alert: "var(--ow-critical)",
};

/** Delay between edges drawing in, so the map assembles rather than pops. */
const DRAW_STAGGER_MS = 70;
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

interface GraphEdgeProps {
  edge: SystemEdge;
  tone: EdgeTone;
  /** Position in the draw-in sequence. */
  order: number;
}

export function GraphEdge({ edge, tone, order }: GraphEdgeProps) {
  const from = getNode(edge.source);
  const to = getNode(edge.target);
  const points = { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  const drawn = tone !== "hidden";
  const delay = drawn ? order * DRAW_STAGGER_MS : 0;
  const signal = SIGNAL_STROKE[tone];

  // Internal edges draw themselves in along their length. External edges are
  // dashed, which rules that out, so they fade in instead.
  const external = to.kind === "external";
  const reveal: CSSProperties = external
    ? { strokeDasharray: "4 5", opacity: drawn ? 1 : 0 }
    : { strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1 };

  return (
    <g>
      <line
        {...points}
        pathLength={external ? undefined : 1}
        stroke={BASE_STROKE[tone]}
        strokeWidth={1.25}
        strokeLinecap="round"
        style={{
          ...reveal,
          transition: `stroke-dashoffset 1s ${EASE_OUT} ${delay}ms, opacity 0.6s ease ${delay}ms, stroke 0.5s ease`,
        }}
      />
      <line
        {...points}
        stroke={signal ?? "transparent"}
        strokeWidth={1.75}
        strokeLinecap="round"
        className={cn(
          "ow-edge-flow transition-opacity duration-500",
          signal ? "opacity-100" : "opacity-0",
          tone === "healthy" && "opacity-50",
        )}
      />
    </g>
  );
}
