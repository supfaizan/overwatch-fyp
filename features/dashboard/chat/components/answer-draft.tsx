'use client';

import Markdown from '@/shared/components/markdown';
import Spinner from '@/shared/components/spinner';
import { cn } from '@/shared/lib/cn';
import { CaretRight, Check, Lightbulb } from '@phosphor-icons/react/ssr';
import { useEffect, useRef, useState } from 'react';
import type { AskDraft } from '../hooks';
import { answerBlocks, draftMarkdown } from '../lib';
import Callout from './callout';

/**
 * An answer while it's being written: the model's reasoning, open until the answer starts and
 * collapsible after, what it looked up on the way, then the answer itself. Its references turn into
 * chips once it's checked.
 */
export default function AnswerDraft({ draft }: { draft: AskDraft }) {
  const answering = draft.answer.length > 0;

  if (!draft.startedAt) {
    return (
      <li className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
        <Spinner className="size-4" /> Reading the code…
      </li>
    );
  }
  // one line says where it's at; it changes by stage, never per word, so a screen reader isn't flooded
  const stage = answering
    ? 'Writing the answer…'
    : draft.looking.length > 0
    ? `Looking things up (${draft.looking.length})…`
    : 'Thinking…';
  return (
    <li className="flex w-full flex-col gap-2">
      {draft.thinking && <Reasoning draft={draft} answering={answering} />}
      {draft.looking.length > 0 && <Lookups looking={draft.looking} answering={answering} />}
      {answering
        ? (
          <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface px-3.5 py-3 text-sm leading-relaxed break-words">
            {answerBlocks(draftMarkdown(draft.answer)).map((block, index, blocks) => {
              const text = (
                <Markdown key={index} highlightCode streaming={index === blocks.length - 1} reveal>
                  {block.text}
                </Markdown>
              );
              return block.type === 'callout'
                ? <Callout key={index} kind={block.kind}>{text}</Callout>
                : text;
            })}
          </div>
        )
        : (
          <p className="flex items-center gap-2 px-1 text-xs text-muted">
            <Spinner className="size-3.5" /> {stage}
          </p>
        )}
      <span className="sr-only" aria-live="polite">{stage}</span>
    </li>
  );
}

/**
 * The lookups made so far, the latest still running; once the answer starts they fold into one line
 * that opens them again.
 */
function Lookups({ looking, answering }: { looking: string[]; answering: boolean }) {
  const [open, setOpen] = useState(false);
  if (answering && !open) {
    return (
      <button
        type="button"
        aria-expanded={false}
        className="flex items-center gap-1.5 self-start rounded px-1 text-xs text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => {
          return setOpen(true);
        }}
      >
        <CaretRight className="size-3" aria-hidden />
        Looked at {looking.length} {looking.length === 1 ? 'place' : 'places'}
      </button>
    );
  }
  return (
    <ol aria-label="Looked up" className="flex flex-col gap-1 px-1 text-xs text-muted">
      {looking.map((text, index) => {
        const running = !answering && index === looking.length - 1;
        return (
          <li key={index} className="flex items-center gap-1.5">
            {running
              ? <Spinner className="size-3.5" />
              : <Check className="size-3.5" aria-hidden />}
            <span className="min-w-0 truncate">{text}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Reasoning({ draft, answering }: { draft: AskDraft; answering: boolean }) {
  // open while it's the only thing happening; folds away once the answer starts, unless reopened
  const [open, setOpen] = useState<boolean | null>(null);
  const expanded = open ?? !answering;
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) {
      body.current?.scrollTo({ top: body.current.scrollHeight });
    }
  }, [draft.thinking, expanded]);

  const seconds = draft.answeringAt && draft.startedAt
    ? Math.max(1, Math.round((draft.answeringAt - draft.startedAt) / 1000))
    : null;

  return (
    <div className="rounded-lg border border-border bg-background text-xs">
      <button
        type="button"
        aria-expanded={expanded}
        className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => {
          return setOpen(!expanded);
        }}
      >
        <Lightbulb
          className={cn('size-3.5', !answering && 'motion-safe:animate-pulse')}
          aria-hidden
        />
        <span className={cn('font-medium', !answering && 'motion-safe:animate-pulse')}>
          {seconds ? `Thought for ${seconds}s` : 'Thinking…'}
        </span>
        <CaretRight
          className={cn('ml-auto size-3 transition-transform', expanded && 'rotate-90')}
          aria-hidden
        />
      </button>
      {expanded && (
        <div
          ref={body}
          className="max-h-40 overflow-y-auto border-t border-border px-2.5 py-2 leading-relaxed whitespace-pre-wrap text-muted"
        >
          {draft.thinking}
        </div>
      )}
    </div>
  );
}
