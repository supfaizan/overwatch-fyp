'use client';

import { cn } from '@/shared/lib/cn';
import { useState } from 'react';

type InlineTitleInputProps = {
  /** The saved title; the draft starts from it. */
  value: string;
  /** Called with the trimmed title when it changed and isn't empty. */
  onSave: (title: string) => void;
  /** Shows the title without letting it change. */
  disabled?: boolean;
  /** @default 255 */
  maxLength?: number;
  /** @default 'Title' */
  'aria-label'?: string;
  /** Goes on the input (size, weight, margins). */
  className?: string;
};

/**
 * A page or dialog's title, edited where it's shown: it looks like a heading until hovered or focused.
 * - Saves on blur or Enter; an empty or unchanged title goes back to the saved one.
 * - Give it `key={value}` when the saved title can change from elsewhere, so the draft follows it.
 */
export default function InlineTitleInput(
  {
    value,
    onSave,
    disabled = false,
    maxLength = 255,
    'aria-label': ariaLabel = 'Title',
    className,
  }: InlineTitleInputProps,
) {
  const [draft, setDraft] = useState(value);
  const commit = () => {
    const title = draft.trim();
    if (title && title !== value) {
      onSave(title);
    } else {
      setDraft(value);
    }
  };
  return (
    <input
      aria-label={ariaLabel}
      className={cn(
        'w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-xl font-semibold outline-none hover:border-border focus:border-primary disabled:hover:border-transparent',
        className,
      )}
      value={draft}
      maxLength={maxLength}
      disabled={disabled}
      onChange={(e) => {
        return setDraft(e.target.value);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        return e.key === 'Enter' && e.currentTarget.blur();
      }}
    />
  );
}
