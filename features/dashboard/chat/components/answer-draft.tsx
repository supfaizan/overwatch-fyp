'use client';

import Markdown from '@/shared/components/markdown';
import { cn } from '@/shared/lib/cn';
import { CaretRight, Check } from '@phosphor-icons/react/ssr';
import { useEffect, useRef, useState } from 'react';
import type { AskDraft } from '../hooks';
import { answerBlocks, draftMarkdown } from '../lib';
import Callout from './callout';

/**
 * An answer while it's being written: one quiet line says what's happening now (thinking, the
 * latest lookup, or writing). It opens onto the reasoning and the lookups, and folds into a summary
 * once the answer starts. Its references turn into chips once it's checked.
 */
export default function AnswerDraft({ draft }: { draft: AskDraft }) {
  const answering = draft.answer.length > 0;

  if (!draft.startedAt) {
    return (
      <li className="px-1 text-xs" aria-live="polite">
        <Shimmer>Reading the code…</Shimmer>
      </li>
    );
  }
  // the live line changes by stage, never per word, so a screen reader isn't flooded
  const stage = answering
    ? 'Writing the answer…'
    : draft.looking.length > 0
    ? `Looking things up (${draft.looking.length})…`
    : 'Thinking…';
  const showProgress = !answering || draft.thinking.length > 0 || draft.looking.length > 0;
  return (
    <li className="flex w-full flex-col gap-2">
      {showProgress && <Progress draft={draft} answering={answering} />}
      {answering && (
        <div className="flex w-full flex-col gap-3 text-sm leading-relaxed break-words">
          {answerBlocks(draftMarkdown(draft.answer)).map((block, index, blocks) => {
            // a draft's citations are stripped, so it has no code blocks
            if (block.type === 'code') {
              return null;
            }
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
      )}
      <span className="sr-only" aria-live="polite">{stage}</span>
    </li>
  );
}

/** Muted text a soft highlight sweeps across; static for anyone who asks for less motion. */
function Shimmer({ children }: { children: string }) {
  return (
    <span className="min-w-0 truncate text-muted motion-safe:animate-shimmer motion-safe:text-shimmer">
      {children}
    </span>
  );
}

/**
 * What's happening now, on one line; opening it shows the reasoning and every lookup. Once the
 * answer starts, the line becomes a summary ("Thought for 12s · looked at 3 places").
 */
function Progress({ draft, answering }: { draft: AskDraft; answering: boolean }) {
  const [open, setOpen] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const { thinking, looking } = draft;
  const hasDetail = thinking.length > 0 || looking.length > 0;

  useEffect(() => {
    if (open && !answering) {
      body.current?.scrollTo({ top: body.current.scrollHeight });
    }
  }, [thinking, looking.length, open, answering]);

  const latest = looking.at(-1);
  const label = answering
    ? summary(draft)
    : latest
    ? `${latest}…`
    : 'Thinking…';

  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <button
        type="button"
        aria-expanded={open}
        disabled={!hasDetail}
        className="group flex max-w-full items-center gap-1.5 self-start rounded px-1 text-muted transition-colors enabled:hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => {
          return setOpen(!open);
        }}
      >
        {answering ? <span className="min-w-0 truncate">{label}</span> : <Shimmer>{label}</Shimmer>}
        {hasDetail && (
          <CaretRight
            className={cn('size-3 shrink-0 transition-transform', open && 'rotate-90')}
            aria-hidden
          />
        )}
      </button>
      {open && hasDetail && (
        <div
          ref={body}
          className="ml-2 flex max-h-64 flex-col gap-2.5 overflow-y-auto border-l border-border pl-3 text-muted"
        >
          {thinking && <p className="leading-relaxed whitespace-pre-wrap">{thinking}</p>}
          {looking.length > 0 && (
            <ol aria-label="Looked up" className="flex flex-col gap-1">
              {looking.map((text, index) => {
                const running = !answering && index === looking.length - 1;
                return (
                  <li key={index} className="flex items-center gap-1.5">
                    <span
                      className="flex size-3.5 shrink-0 items-center justify-center"
                      aria-hidden
                    >
                      {running
                        ? (
                          <span className="size-1.5 rounded-full bg-current motion-safe:animate-pulse" />
                        )
                        : <Check className="size-3" />}
                    </span>
                    <span className="min-w-0 truncate">{text}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

/** "Thought for 12s · looked at 3 places", leaving out whichever part didn't happen. */
function summary({ thinking, looking, startedAt, answeringAt }: AskDraft): string {
  const parts: string[] = [];
  if (thinking) {
    const seconds = answeringAt && startedAt
      ? Math.max(1, Math.round((answeringAt - startedAt) / 1000))
      : null;
    parts.push(seconds ? `Thought for ${seconds}s` : 'Thought');
  }
  if (looking.length > 0) {
    parts.push(
      `${parts.length ? 'looked' : 'Looked'} at ${looking.length} ${
        looking.length === 1 ? 'place' : 'places'
      }`,
    );
  }
  return parts.join(' · ');
}
