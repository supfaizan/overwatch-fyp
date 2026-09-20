"use client";

import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { Point } from "../../layout";

/** An edge that follows the route the layout computed for it.
 *
 * A line spanning several rows would otherwise be drawn straight from one
 * node to the other, crossing every node in between. The layout already
 * worked out which channel such a line should travel down; this draws it
 * there, as a right-angled path with as few corners as the route needs.
 *
 * The layout hands over one waypoint per row the line crosses, nearly all of
 * them in a straight line down the same channel. Treating each as a corner
 * produced a path with thirty anchor points and a visible kink at every one,
 * so every point that does not actually change direction is dropped first —
 * a line down thirteen rows turns twice, not twenty-seven times.
 *
 * The route is otherwise left as the layout drew it. Squaring it off into
 * right angles was worse: each line then left its node along the same
 * horizontal corridor as every other line from that node, so they all lay on
 * top of each other. Letting each one run straight to its own channel keeps
 * them apart. */
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
  const waypoints = simplify((data?.points as Point[] | undefined) ?? []);

  const [fallbackPath, fallbackLabelX, fallbackLabelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: CORNER,
  });

  // Nothing in the way: React Flow's own stepped path is exactly right.
  const corners =
    waypoints.length === 0
      ? null
      : simplify([
          { x: sourceX, y: sourceY },
          ...waypoints,
          { x: targetX, y: targetY },
        ]);

  const path = corners ? roundedPath(corners) : fallbackPath;
  const midpoint = corners ? alongPath(corners, 0.5) : null;

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
              transform: `translate(-50%, -50%) translate(${midpoint?.x ?? fallbackLabelX}px, ${midpoint?.y ?? fallbackLabelY}px)`,
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

/** How much of a corner to round off. */
const CORNER = 12;
/** Distances below this count as "the same", when deciding whether a point
 *  really changes direction. */
const EPSILON = 1;

/** Drop every point that does not change the direction of travel. */
function simplify(points: Point[]): Point[] {
  const kept: Point[] = [];

  for (const point of points) {
    const last = kept[kept.length - 1];
    if (last && Math.abs(point.x - last.x) < EPSILON && Math.abs(point.y - last.y) < EPSILON) {
      continue; // same place twice
    }
    if (kept.length >= 2 && isStraight(kept[kept.length - 2], last, point)) {
      kept[kept.length - 1] = point; // extend the run instead of bending it
      continue;
    }
    kept.push(point);
  }

  return kept;
}

function isStraight(a: Point, b: Point, c: Point): boolean {
  // Twice the area of the triangle: zero when the three are in a line.
  const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const scale = Math.max(Math.hypot(c.x - a.x, c.y - a.y), 1);
  return Math.abs(cross) / scale < EPSILON;
}

/** An SVG path through the points, with the corners rounded. */
function roundedPath(points: Point[]): string {
  if (points.length < 2) return "";
  const parts = [`M ${round(points[0].x)},${round(points[0].y)}`];

  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];

    // The radius shrinks on short segments, so a tight bend cannot overshoot
    // into the one before or after it.
    const radius = Math.min(CORNER, distance(previous, corner) / 2, distance(corner, next) / 2);
    const before = towards(corner, previous, radius);
    const after = towards(corner, next, radius);

    parts.push(`L ${round(before.x)},${round(before.y)}`);
    parts.push(`Q ${round(corner.x)},${round(corner.y)} ${round(after.x)},${round(after.y)}`);
  }

  const last = points[points.length - 1];
  parts.push(`L ${round(last.x)},${round(last.y)}`);
  return parts.join(" ");
}

/** The point a given fraction of the way along the polyline. */
function alongPath(points: Point[], fraction: number): Point {
  const lengths = points.slice(1).map((point, index) => distance(points[index], point));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = total * fraction;

  for (let index = 0; index < lengths.length; index++) {
    if (remaining <= lengths[index]) {
      return towards(points[index], points[index + 1], remaining);
    }
    remaining -= lengths[index];
  }
  return points[points.length - 1];
}

function towards(from: Point, to: Point, step: number): Point {
  const length = distance(from, to);
  if (length === 0) return { ...from };
  return {
    x: from.x + ((to.x - from.x) / length) * step,
    y: from.y + ((to.y - from.y) / length) * step,
  };
}

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const round = (value: number) => Math.round(value * 10) / 10;
