'use client';

import Tooltip from '@/shared/components/tooltip';
import type { DecisionSource } from '@/shared/decisions/types';
import { sourceCardId } from './sources-evidence';

/** A citation in a decision's background, like [S1]: clicking it brings its source's card into view. */
export default function CitationChip(
  { source, onPoint }: { source: DecisionSource; onPoint: (sourceId: string | null) => void },
) {
  const point = () => {
    return onPoint(source.id);
  };
  const unpoint = () => {
    return onPoint(null);
  };
  return (
    <Tooltip content={source.title}>
      <a
        href={`#${sourceCardId(source.id)}`}
        aria-label={`Source ${source.id}: ${source.title}`}
        className="mx-0.5 inline-flex h-4 min-w-4 -translate-y-px items-center justify-center rounded-full border border-border-strong bg-background px-1 align-middle font-mono text-[0.7rem] leading-none font-medium text-muted no-underline transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        onClick={(event) => {
          event.preventDefault();
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          document.getElementById(sourceCardId(source.id))?.scrollIntoView({
            behavior: reduced ? 'auto' : 'smooth',
            block: 'nearest',
          });
        }}
        onMouseEnter={point}
        onMouseLeave={unpoint}
        onFocus={point}
        onBlur={unpoint}
      >
        {source.id}
      </a>
    </Tooltip>
  );
}
