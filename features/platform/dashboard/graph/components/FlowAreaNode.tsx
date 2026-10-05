"use client";

import type { Node, NodeProps } from "@xyflow/react";

export type FlowAreaData = { label: string; width: number; height: number };
export type FlowAreaFlowNode = Node<FlowAreaData, "flowArea">;

/** Where a group of steps lives — a service or a folder — as a labelled
 *  frame rather than an opened folder, so nothing else it holds is drawn. */
export function FlowAreaNode({ data }: NodeProps<FlowAreaFlowNode>) {
  return (
    <div
      style={{ width: data.width, height: data.height }}
      className="rounded-lg border border-dashed border-line-2 bg-ink-900/40"
    >
      <span className="block truncate px-3 pt-1.5 ow-micro text-text-lo" title={data.label}>
        {data.label}
      </span>
    </div>
  );
}
