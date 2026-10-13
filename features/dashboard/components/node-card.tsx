'use client';

import { CaretDown, CaretUp } from '@phosphor-icons/react/ssr';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { MouseEvent, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { useViewOptions } from '../hooks';
import { describeContents, describeNode } from '../lib/appearance';
import { useViewStore } from '../store';
import type { GraphFlowNode } from '../types';
import NodeGlyph from './node-glyph';

const handle = '!size-1.5 !border-0 !bg-border-strong';

/** One box: what it is, what it holds, and the control that opens or shuts it. */
export default function NodeCard({ id, data }: NodeProps<GraphFlowNode>) {
  const open = useViewStore((state) => state.open);
  const close = useViewStore((state) => state.close);
  const active = useViewStore((state) => state.hovered === id || state.selected === id);
  const { data: options } = useViewOptions();

  const isRoot = data.label === 'Repository';
  const outside = data.kind === 'external';
  const contents = describeContents(data);
  // past one page the rest arrives behind a marker, so the control says so before the click
  const paged = Boolean(options && data.child_count > options.page_size);

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

      {/* shown on hover/focus so the canvas stays quiet; an open folder keeps it, as the way back out */}
      <div
        className={cn(
          'absolute -top-2 -right-2 flex transition-opacity group-hover:opacity-100 focus-within:opacity-100',
          data.expanded ? 'opacity-100' : 'opacity-0',
        )}
      >
        {!isRoot &&
          (data.expanded ? (
            <LevelButton label="Close this folder" onClick={() => close(id)}>
              <CaretUp aria-hidden />
            </LevelButton>
          ) : (
            data.expandable && (
              <LevelButton
                label={paged ? `Open: ${data.child_count} inside, first ${options?.page_size} drawn` : `Open: ${data.child_count} inside`}
                onClick={() => open(id)}
                warn={paged}
              >
                <CaretDown aria-hidden />
                {data.child_count}
              </LevelButton>
            )
          ))}
      </div>

      <Handle type="source" position={Position.Bottom} className={handle} />
    </div>
  );
}

function LevelButton({ label, onClick, warn, children }: { label: string; onClick: () => void; warn?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // otherwise the canvas reads the click as selecting the node
      onClick={(event: MouseEvent) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        'flex h-5 cursor-pointer items-center gap-0.5 rounded-sm border px-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary [&_svg]:size-3',
        warn
          ? 'border-warning/50 bg-warning/10 text-warning-strong hover:border-warning'
          : 'border-border-strong bg-surface text-muted hover:border-primary hover:text-primary',
      )}
    >
      {children}
    </button>
  );
}
