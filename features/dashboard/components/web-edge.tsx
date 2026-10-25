'use client';

import { BaseEdge, type EdgeProps, type InternalNode, useInternalNode } from '@xyflow/react';

type Point = { x: number; y: number };

/** clearance before a circle, so an arrowhead isn't drawn under it */
const ARROW_GAP = 2;
/** how far a relationship bows out, as a share of its length */
const BEND = 0.2;

const centreOf = (node: InternalNode) => {
  const radius = (node.measured.width ?? 0) / 2;
  return {
    x: node.internals.positionAbsolute.x + radius,
    y: node.internals.positionAbsolute.y + radius,
    radius,
  };
};

/** The point `distance` along the way from `from` towards `to`. */
const toward = (from: Point, to: Point, distance: number): Point => {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return {
    x: from.x + (to.x - from.x) / length * distance,
    y: from.y + (to.y - from.y) / length * distance,
  };
};

/**
 * A line between two circles, rim to rim. Folder strands run straight; relationships (`curved`) bow to
 * their left, so the two directions between a pair part, and lines bend around the hub rather than
 * through it.
 */
function WebLine({
  id,
  source,
  target,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  style,
  markerStart,
  markerEnd,
  interactionWidth,
  curved,
}: EdgeProps & { curved: boolean }) {
  const from = useInternalNode(source);
  const to = useInternalNode(target);
  if (!from || !to) {
    return null;
  }
  const start = centreOf(from);
  const end = centreOf(to);
  const bend = curved ? BEND : 0;
  const control = {
    x: (start.x + end.x) / 2 - (end.y - start.y) * bend,
    y: (start.y + end.y) / 2 + (end.x - start.x) * bend,
  };
  // a walkthrough hop against a line's direction carries its arrow at the start
  const head = toward(start, control, start.radius + (markerStart ? ARROW_GAP : 0));
  const tail = toward(end, control, end.radius + ARROW_GAP);

  return (
    <BaseEdge
      id={id}
      path={`M ${head.x} ${head.y} Q ${control.x} ${control.y} ${tail.x} ${tail.y}`}
      // the curve's midpoint
      labelX={(head.x + 2 * control.x + tail.x) / 4}
      labelY={(head.y + 2 * control.y + tail.y) / 4}
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
      style={style}
      markerStart={markerStart}
      markerEnd={markerEnd}
      interactionWidth={interactionWidth}
    />
  );
}

export function WebStrand(props: EdgeProps) {
  return <WebLine {...props} curved={false} />;
}

export function WebRelation(props: EdgeProps) {
  return <WebLine {...props} curved />;
}
