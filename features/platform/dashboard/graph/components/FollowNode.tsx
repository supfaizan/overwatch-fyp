"use client";

import { useCallback, useEffect } from "react";
import { useNodesInitialized, useReactFlow } from "@xyflow/react";

/** Room around a followed node, no closer than reading distance, and quick
 *  enough to keep up with a walkthrough's step interval. */
const FOLLOW_PADDING = 1.2;
const FOLLOW_MIN_ZOOM = 0.55;
const FOLLOW_MAX_ZOOM = 1.1;
const FOLLOW_MS = 450;

function useFitToNode() {
  const { fitView } = useReactFlow();
  return useCallback(
    (nodeId: string) =>
      fitView({
        nodes: [{ id: nodeId }],
        padding: FOLLOW_PADDING,
        minZoom: FOLLOW_MIN_ZOOM,
        maxZoom: FOLLOW_MAX_ZOOM,
        duration: FOLLOW_MS,
      }),
    [fitView],
  );
}

/** While `following`, keeps `nodeId` on screen as it changes. Rendered inside
 *  `<ReactFlow>` for the viewport API. */
export function FollowNode({ nodeId, following }: { nodeId: string | null; following: boolean }) {
  const fitToNode = useFitToNode();

  useEffect(() => {
    if (following && nodeId) void fitToNode(nodeId);
  }, [nodeId, following, fitToNode]);

  return null;
}

/** Brings `nodeId` into view once the view it belongs to has arrived and been
 *  measured, then reports it done. For a one-off request ("show this step on
 *  the map") that waits on the folders holding it being fetched. Rendered
 *  after any fit-to-content so it is the move that sticks. */
export function FocusWhenDrawn({
  nodeId,
  isDrawn,
  onDone,
}: {
  nodeId: string | null;
  isDrawn: boolean;
  onDone: () => void;
}) {
  const fitToNode = useFitToNode();
  const measured = useNodesInitialized();

  useEffect(() => {
    if (!nodeId || !isDrawn || !measured) return;
    void fitToNode(nodeId);
    onDone();
  }, [nodeId, isDrawn, measured, fitToNode, onDone]);

  return null;
}
