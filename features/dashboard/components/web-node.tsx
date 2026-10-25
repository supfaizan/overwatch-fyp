'use client';

import { cn } from '@/shared/lib/cn';
import { Handle, type NodeProps, Position, useStore } from '@xyflow/react';
import { describeContents, describeNode } from '../lib/appearance';
import { dotSize } from '../lib/force-layout';
import { useViewStore } from '../store';
import type { GraphFlowNode, NodeLabel } from '../types';
import LevelControl from './level-control';
import NodeGlyph from './node-glyph';
import WalkBadge from './walk-badge';

/** WebEdge draws from the circle's edge, so handles only satisfy React Flow */
export const hiddenHandle = '!invisible';

/** the zoom a name needs before it's drawn: folders always, finer nodes once there's room to read them */
const NAME_ZOOM: Record<NodeLabel, number> = {
  Repository: 0,
  Module: 0,
  Package: 0.7,
  Route: 0.7,
  Channel: 0.7,
  File: 0.7,
  Symbol: 0.9,
};

/** One node of the web: a circle sized by what it is, tinted by its top-level folder, named beneath. */
export default function WebNode({ id, data }: NodeProps<GraphFlowNode>) {
  const active = useViewStore((state) => {
    return state.hovered === id || state.selected === id;
  });
  // a boolean, so zooming only re-renders the nodes whose name crosses its threshold
  const zoomedIn = useStore((state) => {
    return state.transform[2] >= NAME_ZOOM[data.label];
  });
  const size = dotSize(data.label);
  const outside = data.kind === 'external';
  const contents = describeContents(data);
  const named = zoomedIn || active || data.expanded;

  return (
    <div
      className="group relative"
      style={{ width: size, height: size }}
      title={[data.name, describeNode(data.label, data.kind), contents].filter(Boolean).join(' · ')}
    >
      <Handle type="target" position={Position.Top} className={hiddenHandle} />
      <div
        className={cn(
          'flex size-full items-center justify-center rounded-full border border-border-strong bg-surface transition-[border-color,box-shadow] [&_svg]:size-1/2',
          outside && 'border-dashed text-muted',
          // an open folder is scaffolding for what's around it, so it sits back
          data.expanded && 'bg-background',
          active && 'border-primary ring-2 ring-primary/25',
        )}
        style={{
          color: outside ? undefined : data.tint,
          borderColor: active
            ? undefined
            : `color-mix(in srgb, ${data.tint} 45%, var(--color-border-strong))`,
          background: data.expanded
            ? undefined
            : `color-mix(in srgb, ${data.tint} 8%, var(--color-surface))`,
        }}
      >
        <NodeGlyph label={data.label} kind={data.kind} open={data.expanded} />
      </div>
      <span
        className={cn(
          'pointer-events-none absolute top-full left-1/2 mt-1 max-w-40 -translate-x-1/2 truncate rounded-sm bg-surface px-1 font-mono text-xs whitespace-nowrap transition-opacity',
          !named && 'opacity-0',
        )}
      >
        {data.name}
      </span>
      <LevelControl id={id} data={data} quiet />
      <WalkBadge id={id} />
      <Handle type="source" position={Position.Bottom} className={hiddenHandle} />
    </div>
  );
}
