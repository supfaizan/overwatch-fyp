'use client';

import { cn } from '@/shared/lib/cn';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import { describeContents, describeNode } from '../lib/appearance';
import { useViewStore } from '../store';
import type { GraphFlowNode } from '../types';
import LevelControl from './level-control';
import NodeGlyph from './node-glyph';
import WalkBadge from './walk-badge';

const handle = '!size-1.5 !border-0 !bg-border-strong';

/** One box: what it is, what it holds, and the control that opens or shuts it. */
export default function NodeCard({ id, data }: NodeProps<GraphFlowNode>) {
  const active = useViewStore((state) => {
    return state.hovered === id || state.selected === id;
  });

  const isRoot = data.label === 'Repository';
  const outside = data.kind === 'external';
  const contents = describeContents(data);

  return (
    <div
      className={cn(
        'group relative w-46 rounded-md border border-border-strong bg-surface px-3 py-2.5 transition-[border-color,box-shadow]',
        outside && 'border-dashed',
        // an open folder is scaffolding for what's under it, so it sits back
        data.expanded && 'bg-background',
        active && 'border-primary ring-2 ring-primary/25',
      )}
    >
      {!isRoot && <Handle type="target" position={Position.Top} className={handle} />}

      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-sm [&_svg]:size-3.5',
            outside ? 'bg-fill-hover text-muted' : 'bg-primary/10 text-primary',
          )}
        >
          <NodeGlyph label={data.label} kind={data.kind} open={data.expanded} />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium">{data.name}</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
        <span className="truncate">{describeNode(data.label, data.kind)}</span>
        {contents && <span className="shrink-0">{contents}</span>}
      </div>

      <LevelControl id={id} data={data} />
      <WalkBadge id={id} />

      <Handle type="source" position={Position.Bottom} className={handle} />
    </div>
  );
}
