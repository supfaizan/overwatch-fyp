/* Telling the two kinds of canvas node apart.
 *
 * The canvas draws real graph nodes and overflow markers side by side, and
 * they carry different data. One guard, used everywhere, rather than a cast
 * at each call site. */

import type { CanvasNode, OverflowFlowNode, ViewFlowNode } from "../types";

export function isGraphNode(node: CanvasNode): node is ViewFlowNode {
  return node.type === "graphNode";
}

export function isOverflowNode(node: CanvasNode): node is OverflowFlowNode {
  return node.type === "overflow";
}

/** A node's display name, whichever kind it is. */
export function nodeLabel(node: CanvasNode): string {
  return isGraphNode(node) ? node.data.label : `${node.data.hidden} more`;
}
