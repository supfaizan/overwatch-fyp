'use client';

import { cn } from '@/shared/lib/cn';
import { CaretDown, CaretUp } from '@phosphor-icons/react/ssr';
import type { MouseEvent, ReactNode } from 'react';
import { useViewOptions } from '../hooks';
import { useViewStore } from '../store';
import type { ViewNode } from '../types';

/**
 * Opens or shuts a node, pinned to its top-right corner; the node must be a `group`. Shown on
 * hover/focus so the canvas stays quiet; an open folder keeps it, as the way back out, unless `quiet`
 * (where an open folder already looks open, and the button would cover its neighbours).
 */
export default function LevelControl(
  { id, data, quiet = false }: { id: string; data: ViewNode; quiet?: boolean },
) {
  const open = useViewStore((state) => {
    return state.open;
  });
  const close = useViewStore((state) => {
    return state.close;
  });
  const { data: options } = useViewOptions();

  if (data.label === 'Repository') {
    return null;
  }
  // past one page the rest arrives behind a marker, so the control says so before the click
  const paged = Boolean(options && data.child_count > options.page_size);

  return (
    <div
      className={cn(
        'absolute -top-2 -right-2 flex transition-opacity group-hover:opacity-100 focus-within:opacity-100',
        data.expanded && !quiet ? 'opacity-100' : 'opacity-0',
      )}
    >
      {data.expanded
        ? (
          <LevelButton
            label="Close this folder"
            onClick={() => {
              return close(id);
            }}
          >
            <CaretUp aria-hidden />
          </LevelButton>
        )
        : (
          data.expandable && (
            <LevelButton
              label={paged
                ? `Open: ${data.child_count} inside, first ${options?.page_size} drawn`
                : `Open: ${data.child_count} inside`}
              onClick={() => {
                return open(id);
              }}
              warn={paged}
            >
              <CaretDown aria-hidden />
              {data.child_count}
            </LevelButton>
          )
        )}
    </div>
  );
}

function LevelButton(
  { label, onClick, warn, children }: {
    label: string;
    onClick: () => void;
    warn?: boolean;
    children: ReactNode;
  },
) {
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
