'use client';

import { Handle, type NodeProps, Position } from '@xyflow/react';
import { dotSize } from '../lib/force-layout';
import { useViewStore } from '../store';
import type { OverflowFlowNode } from '../types';
import { hiddenHandle } from './web-node';

/** The web's stand-in for children there was no room for. Clicking draws the rest. */
export default function WebOverflow({ data }: NodeProps<OverflowFlowNode>) {
  const reveal = useViewStore((state) => {
    return state.reveal;
  });
  const size = dotSize();

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        reveal(data.container_id);
      }}
      title={`Draw the remaining ${data.hidden} in ${data.container_name}`}
      style={{ width: size, height: size }}
      className="flex cursor-pointer items-center justify-center rounded-full border border-dashed border-border-strong bg-background font-mono text-xs text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
    >
      <Handle type="target" position={Position.Top} className={hiddenHandle} />+{data.hidden}
      <Handle type="source" position={Position.Bottom} className={hiddenHandle} />
    </button>
  );
}
