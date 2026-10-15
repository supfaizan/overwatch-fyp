'use client';

import { DotsThree } from '@phosphor-icons/react/ssr';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import { useViewStore } from '../store';
import type { OverflowFlowNode } from '../types';

const handle = '!size-1.5 !border-0 !bg-border-strong';

/** Stands for the children there was no room for; their relationships are drawn against it. Clicking draws the rest. */
export default function OverflowNode({ data }: NodeProps<OverflowFlowNode>) {
  const reveal = useViewStore((state) => state.reveal);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        reveal(data.container_id);
      }}
      title={`Draw the remaining ${data.hidden} in ${data.container_name}`}
      className="w-46 cursor-pointer rounded-md border border-dashed border-border-strong bg-background px-3 py-2.5 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
    >
      <Handle type="target" position={Position.Top} className={handle} />
      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-fill-hover text-muted">
          <DotsThree className="size-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs">{data.hidden} more</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-muted">in {data.container_name}</span>
        <span className="shrink-0 font-medium text-primary">Draw</span>
      </div>
      <Handle type="source" position={Position.Bottom} className={handle} />
    </button>
  );
}
