'use client';

import Button from '@/shared/components/button';
import { TextArea } from '@/shared/components/input';
import { cn } from '@/shared/lib/cn';
import { PaperPlaneRight } from '@phosphor-icons/react/ssr';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { MIN_MENTION_TERM, useMentionCandidates } from '../hooks';
import { keptMentions, mentionQuery } from '../lib';
import type { Mention, MentionCandidate } from '../types';

/** The backend's limit on a question. */
const MAX_QUESTION_CHARS = 2_000;
/** Pause in typing before the graph is searched, so `@calendar` is one request, not eight. */
const MENTION_SEARCH_DELAY_MS = 150;

type ChatComposerProps = {
  repo: string;
  pending: boolean;
  /** resolves once the answer is in; the draft is kept if it rejects */
  onSend: (question: string, mentionedNodeIds: string[]) => Promise<unknown>;
};

/** The question box. `@` searches the graph's files and symbols; a picked one goes with the question. */
export default function ChatComposer({ repo, pending, onSend }: ChatComposerProps) {
  const listId = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [caret, setCaret] = useState(0);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState<number | null>(null);

  const query = mentionQuery(text, caret);
  const open = query !== null && query.term.length >= MIN_MENTION_TERM && dismissed !== query.start;
  const term = open ? query.term : null;
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      return setSearchTerm(term);
    }, MENTION_SEARCH_DELAY_MS);
    return () => {
      return clearTimeout(timer);
    };
  }, [term]);
  const candidates = useMentionCandidates(repo, term === null ? null : searchTerm);
  const options = open ? (candidates.data ?? []) : [];
  const question = text.trim();

  const pick = (candidate: MentionCandidate) => {
    if (!query) {
      return;
    }
    const name = candidate.name ?? candidate.path ?? candidate.id;
    const next = `${text.slice(0, query.start)}@${name} ${text.slice(caret)}`;
    const at = query.start + name.length + 2;
    setText(next);
    setCaret(at);
    setMentions((current) => {
      return [...current, { nodeId: candidate.id, name }];
    });
    setActive(0);
    requestAnimationFrame(() => {
      return input.current?.setSelectionRange(at, at);
    });
  };

  const send = () => {
    if (!question || pending) {
      return;
    }
    onSend(
      question,
      keptMentions(question, mentions).map((mention) => {
        return mention.nodeId;
      }),
    ).then(
      () => {
        setText('');
        setMentions([]);
      },
      // the panel shows the error; the draft stays so it can be resent
      () => {},
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (options.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActive((index) => {
          return (index + step + options.length) % options.length;
        });
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        pick(options[Math.min(active, options.length - 1)]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setDismissed(query?.start ?? null);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <form
      className="relative flex items-stretch gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      {options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Nodes to mention"
          className="absolute right-0 bottom-full left-0 mb-1 max-h-56 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-chrome"
        >
          {options.map((option, index) => {
            return (
              <li
                key={option.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                className={cn(
                  'flex cursor-pointer flex-col rounded px-2 py-1 text-sm',
                  index === active && 'bg-fill-hover',
                )}
                // keep focus in the box, so typing carries on after the pick
                onMouseDown={(event) => {
                  return event.preventDefault();
                }}
                onClick={() => {
                  return pick(option);
                }}
                onMouseEnter={() => {
                  return setActive(index);
                }}
              >
                <span className="font-mono text-xs font-medium">{option.name ?? option.path}</span>
                <span className="truncate text-xs text-muted">
                  {[option.kind, option.file_path ?? option.path].filter(Boolean).join(' · ')}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <TextArea
        ref={input}
        aria-label="Ask about this repository"
        role="combobox"
        aria-expanded={options.length > 0}
        aria-controls={listId}
        aria-activedescendant={options.length > 0
          ? `${listId}-${Math.min(active, options.length - 1)}`
          : undefined}
        placeholder="Ask about the code. Type @ to mention a file or symbol."
        rows={2}
        maxLength={MAX_QUESTION_CHARS}
        className="min-h-0 resize-none"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setCaret(event.target.selectionStart);
          setActive(0);
        }}
        onSelect={(event) => {
          return setCaret(event.currentTarget.selectionStart);
        }}
        onKeyDown={onKeyDown}
      />
      {/* as tall as the box, so the two line up whatever its height */}
      <Button
        variant="primary"
        iconOnly
        type="submit"
        aria-label="Send"
        className="h-auto"
        loading={pending}
        disabled={!question}
      >
        <PaperPlaneRight />
      </Button>
    </form>
  );
}
