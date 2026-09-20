"use client";

import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { Point } from "../../layout";

/** An edge that follows the route the layout computed for it.
 *
 * A line spanning several rows would otherwise be drawn straight from one
 * node to the other, crossing every node in between — which is what made the
 * graph unreadable. The layout already worked out where such a line should
 * bend to get around them; this draws it there.
 *
 * With no route (adjacent rows, nothing in the way) it falls back to React
 * Flow's own stepped path. */
export function RoutedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  labelStyle,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const waypoints = (data?.points as Point[] | undefined) ?? [];

  const [fallbackPath, fallbackLabelX, fallbackLabelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: CORNER,
  });

  const routed = waypoints.length > 0;
  const path = routed
    ? roundedPath([
        { x: sourceX, y: sourceY },
        ...waypoints,
        { x: targetX, y: targetY },
      ])
    : fallbackPath;

  // On a routed line the midpoint of the *route* is clear of the nodes it
  // travels past; the straight-line midpoint is not.
  const midpoint = routed ? waypoints[Math.floor(waypoints.length / 2)] : null;
  const labelX = midpoint?.x ?? fallbackLabelX;
  const labelY = midpoint?.y ?? fallbackLabelY;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            // Labels never intercept the pointer: they sit over the canvas,
            // and a node underneath must stay clickable.
            className="pointer-events-none absolute rounded-sm bg-ink-900/90 px-1 py-0.5"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              ...labelStyle,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

/** How much of a corner to round off. Enough to read as a turn rather than a
 *  kink, small enough not to swallow short segments. */
const CORNER = 10;

/** An SVG path through the points, with the corners rounded.
 *
 * Each bend is replaced by a quadratic curve that starts and ends a little
 * short of it, so the line turns rather than snapping. The radius shrinks on
 * short segments, which is what stops a tight bend from overshooting. */
function roundedPath(points: Point[]): string {
  if (points.length < 2) return "";

  const parts = [`M ${points[0].x},${points[0].y}`];

  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];

    const before = shorten(corner, previous);
    const after = shorten(corner, next);

    parts.push(`L ${before.x},${before.y}`);
    parts.push(`Q ${corner.x},${corner.y} ${after.x},${after.y}`);
  }

  const last = points[points.length - 1];
  parts.push(`L ${last.x},${last.y}`);
  return parts.join(" ");
}

/** A point `CORNER` along the way from `from` towards `to`, or the midpoint
 *  if the segment is shorter than that. */
function shorten(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return { ...from };

  const step = Math.min(CORNER, length / 2);
  return { x: from.x + (dx / length) * step, y: from.y + (dy / length) * step };
}
