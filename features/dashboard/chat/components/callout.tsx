'use client';

import { cn } from '@/shared/lib/cn';
import type { Icon } from '@phosphor-icons/react';
import { Info, Lightbulb, Warning } from '@phosphor-icons/react/ssr';
import type { ReactNode } from 'react';
import type { CalloutKind } from '../lib';

const TONE: Record<CalloutKind, { icon: Icon; label: string; box: string; tint: string }> = {
  note: { icon: Info, label: 'Note', box: 'border-border bg-background', tint: 'text-muted' },
  tip: {
    icon: Lightbulb,
    label: 'Tip',
    box: 'border-primary/30 bg-primary/5',
    tint: 'text-primary',
  },
  warning: {
    icon: Warning,
    label: 'Watch out',
    box: 'border-warning/50 bg-warning/10',
    tint: 'text-warning-strong',
  },
};

/**
 * The one thing in an answer not to miss: a note, a tip or a warning, set apart from the prose. A
 * `note` role, not an alert, so a screen reader reads it in place rather than interrupting.
 */
export default function Callout({ kind, children }: { kind: CalloutKind; children: ReactNode }) {
  const { icon: Glyph, label, box, tint } = TONE[kind];
  return (
    <div
      role="note"
      aria-label={label}
      className={cn('flex gap-2 rounded-md border px-3 py-2', box)}
    >
      <Glyph className={cn('mt-0.5 size-4 shrink-0', tint)} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
