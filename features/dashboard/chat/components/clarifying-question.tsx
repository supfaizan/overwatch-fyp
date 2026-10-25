'use client';

import Button from '@/shared/components/button';
import Kbd from '@/shared/components/kbd';
import Tooltip from '@/shared/components/tooltip';
import { X } from '@phosphor-icons/react/ssr';
import { type KeyboardEvent, useEffect, useId, useRef } from 'react';
import type { ClarifyingQuestion as Question } from '../types';

/**
 * A question back, opened over the chat input until it's answered: pick an option (click, or its
 * number key), type your own answer in the input below, or close it and carry on.
 */
export default function ClarifyingQuestion(
  { ask, onPick, onDismiss, disabled }: {
    ask: Question;
    onPick: (option: string) => void;
    onDismiss: () => void;
    /** while an answer is being written */
    disabled: boolean;
  },
) {
  const questionId = useId();
  const panel = useRef<HTMLDivElement>(null);

  // it takes focus when it opens, so the number keys work straight away
  useEffect(() => {
    panel.current?.focus();
  }, [ask]);

  const onKeyDown = (event: KeyboardEvent) => {
    const option = ask.options[Number(event.key) - 1];
    if (option && !disabled) {
      event.preventDefault();
      onPick(option);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onDismiss();
    }
  };

  return (
    <div
      ref={panel}
      role="dialog"
      aria-labelledby={questionId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-2 shadow-sm focus-visible:outline-2 focus-visible:outline-primary motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
    >
      <div className="flex items-start gap-2 pl-1.5">
        <p id={questionId} className="flex-1 pt-1 text-sm font-medium">{ask.question}</p>
        <Tooltip content="Skip the question">
          <Button
            size="sm"
            variant="tertiary"
            iconOnly
            aria-label="Skip the question"
            onClick={onDismiss}
          >
            <X />
          </Button>
        </Tooltip>
      </div>
      <ol className="flex flex-col gap-1">
        {ask.options.map((option, index) => {
          return (
            <li key={option}>
              <button
                type="button"
                disabled={disabled}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border border-border px-2.5 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  return onPick(option);
                }}
              >
                <Kbd>{index + 1}</Kbd>
                <span className="min-w-0 flex-1">{option}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="px-1.5 text-xs text-muted">Or type your own answer below.</p>
    </div>
  );
}
