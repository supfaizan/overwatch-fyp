"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useViewStore } from "../stores/view-store";
import type { OverflowFlowNode } from "../types";

/** The children of an open folder that there was no room to draw.
 *
 * It is a real box, not a footnote: the relationships of everything it stands
 * for are drawn against it, exactly as they would be against a shut folder.
 * Clicking it draws the rest. */
export function OverflowNode({ data }: NodeProps<OverflowFlowNode>) {
  const reveal = useViewStore((state) => state.reveal);

  return (
    <button
      type="button"
      onClick={() => reveal(data.containerId)}
      title={`Draw the remaining ${data.hidden} in ${data.containerName}`}
      className={cn(
        "w-[184px] rounded-md border border-dashed border-line-2 bg-surface-1 px-3 py-2.5 text-left transition-colors",
        "hover:border-signal hover:bg-surface-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-1.5 !border-0 !bg-line-2"
      />

      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-surface-3 text-text-lo">
          <MoreHorizontal className="size-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-text-mid">
          {data.hidden} more
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="ow-micro truncate text-text-dim">
          IN {data.containerName}
        </span>
        <span className="ow-micro shrink-0 text-signal">DRAW</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-1.5 !border-0 !bg-line-2"
      />
    </button>
  );
}
