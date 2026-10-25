'use client';

import Button from '@/shared/components/button';
import Markdown, { InlineCode } from '@/shared/components/markdown';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { ChatCircleDots, Info, Path } from '@phosphor-icons/react/ssr';
import { type ComponentProps, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useWalkthrough } from '../../hooks';
import { ancestorsOf } from '../../lib/ancestors';
import { prefersReducedMotion } from '../../lib/motion';
import { stepName } from '../../lib/walkthrough';
import { useViewStore } from '../../store';
import {
  answerBlocks,
  answerMarkdown,
  CHIP_RE,
  lineRange,
  questionSegments,
  safeImageSrc,
} from '../lib';
import type { ChatMessage as Message, CodeCitation as Citation, NodeRef } from '../types';
import Callout from './callout';
import CodeCitation from './code-citation';
import FollowUps from './follow-ups';

type ChatMessageProps = { message: Message; repo: string };

/** What the latest answer can ask next: its follow-ups. */
type NextQuestion = {
  /** set on the latest answer only; asks the question as the next message */
  onAsk?: (question: string) => void;
  /** an answer is being written, so nothing else can be asked yet */
  pending?: boolean;
};

export default function ChatMessage(
  { message, repo, onAsk, pending = false }: ChatMessageProps & NextQuestion,
) {
  const { highlight } = useViewStore.getState();
  const fromUser = message.role === 'user';

  return (
    <li
      className={cn('flex flex-col gap-1', fromUser ? 'items-end' : 'items-start')}
      // pointing at an answer lights up what it talks about
      onMouseEnter={() => {
        return message.nodes.length > 0 && highlight(message.nodes.map((node) => {
          return node.node_id;
        }));
      }}
      onMouseLeave={() => {
        return highlight([]);
      }}
    >
      {fromUser
        ? <Question message={message} repo={repo} />
        : <Answer message={message} repo={repo} />}
      {!message.grounded && !fromUser && (
        <span className="flex items-center gap-1 px-1 text-xs text-muted">
          <Info aria-hidden /> Answers only say what the indexed graph shows.
        </span>
      )}
      {message.steps.length > 0 && <WalkThrough message={message} repo={repo} />}
      {onAsk && message.follow_ups.length > 0 && (
        <FollowUps questions={message.follow_ups} onPick={onAsk} disabled={pending} />
      )}
    </li>
  );
}

const stepNodeIds = (message: Message) => {
  return message.steps.map((step) => {
    return step.node_id;
  });
};

/** Plays an answer's steps on the diagram again; a new answer plays them once by itself. */
function WalkThrough({ message, repo }: ChatMessageProps) {
  const { play } = useWalkthrough(repo);
  return (
    <Button
      size="sm"
      variant="tertiary"
      onClick={() => {
        return play(message.id, stepNodeIds(message));
      }}
    >
      <Path aria-hidden />
      Walk through
    </Button>
  );
}

/** What was asked, as typed: plain text with its @-mentions as chips. */
function Question({ message, repo }: ChatMessageProps) {
  const segments = useMemo(() => {
    return questionSegments(message);
  }, [message]);
  return (
    <p className="max-w-5/6 rounded-lg bg-fill-active px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap">
      {segments.map((segment, index) => {
        return segment.type === 'node'
          ? <NodeChip key={index} node={segment.node} repo={repo} mention />
          : segment.text;
      })}
    </p>
  );
}

/**
 * The model's markdown. Raw HTML is dropped, links render as plain text and images load only from
 * our attachments: an answer can quote a repository's own text, so it must not reach other servers.
 */
function Answer({ message, repo }: ChatMessageProps) {
  const markdown = useMemo(() => {
    return answerMarkdown(message);
  }, [message]);
  const byRef = useMemo(() => {
    return new Map(message.nodes.map((node) => {
      return [node.ref, node];
    }));
  }, [message]);
  const citations = useMemo(() => {
    return new Map(message.citations.map((citation) => {
      return [citation.ref, citation];
    }));
  }, [message]);
  // the citation whose chip or card is pointed at, so the pair lights up together
  const [active, setActive] = useState<string | null>(null);
  const components = useMemo(
    () => {
      return {
        a: ({ children }: { children?: ReactNode }) => {
          return <span>{children}</span>;
        },
        img: ({ src, alt }: ComponentProps<'img'>) => {
          return <SafeImage src={src} alt={alt} />;
        },
        inlineCode: ({ children, ...props }: ComponentProps<'code'>) => {
          const ref = CHIP_RE.exec(String(children))?.[1] ?? null;
          const node = byRef.get(ref);
          if (node) {
            return <NodeChip node={node} repo={repo} />;
          }
          const citation = ref ? citations.get(ref) : undefined;
          if (citation) {
            return (
              <CitationChip
                citation={citation}
                cardId={`${message.id}-${citation.ref}`}
                onPoint={setActive}
              />
            );
          }
          return <InlineCode {...props}>{children}</InlineCode>;
        },
      };
    },
    [byRef, citations, message.id, repo],
  );

  // code a step shows sits in that step, not again below
  const loose = message.citations.filter((citation) => {
    return !message.steps.some((step) => {
      return step.citation_ref === citation.ref;
    });
  });

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface px-3.5 py-3 text-sm leading-relaxed break-words">
      {answerBlocks(markdown).map((block, index) => {
        const text = (
          <Markdown key={index} components={components} highlightCode>{block.text}</Markdown>
        );
        return block.type === 'callout'
          ? <Callout key={index} kind={block.kind}>{text}</Callout>
          : text;
      })}
      {message.ask && (
        // its options open over the chat input; the answer keeps the question itself
        <p className="flex items-center gap-1.5 font-medium">
          <ChatCircleDots className="size-4 shrink-0 text-primary" aria-hidden />
          {message.ask.question}
        </p>
      )}
      {message.steps.length > 0 && (
        <Steps message={message} repo={repo} activeCitation={active}>
          {(text) => {
            return (
              <Markdown components={components} highlightCode>
                {answerMarkdown(message, text)}
              </Markdown>
            );
          }}
        </Steps>
      )}
      {loose.length > 0 && (
        <section aria-label="Cited code" className="flex flex-col gap-2">
          {loose.map((citation) => {
            return (
              <CodeCitation
                key={citation.ref}
                id={`${message.id}-${citation.ref}`}
                repo={repo}
                citation={citation}
                active={active === citation.ref}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}

/**
 * An answer's steps, each with the node it happens in, what happens and the code showing it. The step
 * on the diagram is lit and kept in view; picking a step shows it there and pauses.
 */
function Steps(
  { message, repo, activeCitation, children }: ChatMessageProps & {
    activeCitation: string | null;
    /** a step's text, rendered like the rest of the answer */
    children: (text: string) => ReactNode;
  },
) {
  const { play } = useWalkthrough(repo);
  const cursor = useViewStore((state) => {
    return state.walk?.answerId === message.id ? state.walk.cursor : null;
  });
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (cursor === null) {
      return;
    }
    list.current?.children[cursor]?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [cursor]);

  const pick = (index: number) => {
    const { walk, goTo } = useViewStore.getState();
    if (walk?.answerId === message.id) {
      goTo(index);
    } else {
      play(message.id, stepNodeIds(message), index);
    }
  };

  return (
    <ol ref={list} aria-label="Steps" className="flex flex-col gap-2">
      {message.steps.map((step, index) => {
        const active = index === cursor;
        const name = message.nodes.find((node) => {
          return node.ref === step.ref;
        })?.name ?? stepName(step.node_id, repo);
        const citation = message.citations.find((c) => {
          return c.ref === step.citation_ref;
        });
        return (
          <li
            key={index}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex flex-col gap-2 rounded-md border px-3 py-2 transition-colors',
              active ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <button
              type="button"
              aria-label={`Show step ${index + 1} on the diagram: ${name}`}
              className="flex min-w-0 cursor-pointer items-center gap-2 self-start rounded text-left transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() => {
                return pick(index);
              }}
              onMouseEnter={() => {
                return useViewStore.getState().highlight([step.node_id]);
              }}
            >
              <span
                className={cn(
                  'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-xs tabular-nums transition-colors',
                  active ? 'bg-primary text-white' : 'border border-border text-muted',
                )}
              >
                {index + 1}
              </span>
              <span className="min-w-0 truncate font-mono text-xs font-medium">{name}</span>
            </button>
            {step.text && children(step.text)}
            {citation && (
              <CodeCitation
                id={`${message.id}-${citation.ref}`}
                repo={repo}
                citation={citation}
                active={activeCitation === citation.ref}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** An inline code citation, numbered like its card below the answer; clicking it brings the card into view. */
function CitationChip(
  { citation, cardId, onPoint }: {
    citation: Citation;
    cardId: string;
    onPoint: (ref: string | null) => void;
  },
) {
  return (
    <Tooltip content={`${citation.path}:${lineRange(citation)}`}>
      <a
        href={`#${cardId}`}
        aria-label={`Code ${citation.ref.slice(1)}: ${citation.path}, line ${lineRange(citation)}`}
        className="mx-0.5 inline-flex h-4 min-w-4 -translate-y-px items-center justify-center rounded-full border border-border-strong bg-background px-1 align-middle font-mono text-[0.7rem] leading-none font-medium text-muted no-underline transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById(cardId)?.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'nearest',
          });
        }}
        onMouseEnter={() => {
          return onPoint(citation.ref);
        }}
        onMouseLeave={() => {
          return onPoint(null);
        }}
        onFocus={() => {
          return onPoint(citation.ref);
        }}
        onBlur={() => {
          return onPoint(null);
        }}
      >
        {citation.ref.slice(1)}
      </a>
    </Tooltip>
  );
}

/** An image from an attachment or inline data; anything else shows as its description instead. */
function SafeImage({ src, alt }: { src: unknown; alt?: string }) {
  const safe = safeImageSrc(src);
  if (!safe) {
    return <span className="text-xs text-muted">[image not shown{alt ? `: ${alt}` : ''}]</span>;
  }
  return (
    <img
      src={safe}
      alt={alt ?? ''}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="my-2 max-w-full rounded-md border border-border"
    />
  );
}

/** A node in a message; clicking it selects the node on the diagram, opening the folders it's in. */
function NodeChip(
  { node, repo, mention = false }: { node: NodeRef; repo: string; mention?: boolean },
) {
  const where = node.node_id.startsWith(`${repo}:`)
    ? node.node_id.slice(repo.length + 1)
    : node.node_id;

  return (
    <Tooltip content={where}>
      <button
        type="button"
        className="inline rounded px-1 font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => {
          return useViewStore.getState().focus(node.node_id, ancestorsOf(node.node_id, repo));
        }}
        onMouseEnter={() => {
          return useViewStore.getState().highlight([node.node_id]);
        }}
      >
        {/* a question's mention keeps the `@` it was typed with; package names may already start with one */}
        {mention && !node.name.startsWith('@') ? `@${node.name}` : node.name}
      </button>
    </Tooltip>
  );
}
