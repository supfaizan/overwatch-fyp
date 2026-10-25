'use client';

import { cn } from '@/shared/lib/cn';
import { createContext, useContext } from 'react';
import type { WalkMark } from '../lib/walkthrough';

export const NO_MARKS = new Map<string, WalkMark>();

/** Each drawn node's walkthrough step numbers, so nodes read their own without changing their data. */
export const WalkMarksContext = createContext(NO_MARKS);

/** A node's walkthrough step numbers, pinned to its top-left corner; the node must be `relative`. */
export default function WalkBadge({ id }: { id: string }) {
  const mark = useContext(WalkMarksContext).get(id);
  if (!mark) {
    return null;
  }
  return (
    <span
      aria-label={`Walkthrough step ${mark.numbers.join(', ')}`}
      className={cn(
        'pointer-events-none absolute -top-2 -left-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium tabular-nums transition-colors',
        mark.current
          ? 'bg-primary text-white'
          : 'border border-primary bg-surface text-primary',
      )}
    >
      {mark.numbers.join('·')}
    </span>
  );
}
