'use client';

import { Info } from '@phosphor-icons/react/ssr';
import { useMemo, type ComponentProps, type ReactNode } from 'react';
import Markdown, { InlineCode } from '@/shared/components/markdown';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { ancestorsOf } from '../../lib/ancestors';
import { useViewStore } from '../../store';
import { answerMarkdown, CHIP_RE, questionSegments, safeImageSrc } from '../lib';
import type { ChatMessage as Message, NodeRef } from '../types';

type ChatMessageProps = { message: Message; repo: string };

export default function ChatMessage({ message, repo }: ChatMessageProps) {
  const { highlight } = useViewStore.getState();
  const fromUser = message.role === 'user';

  return (
    <li
      className={cn('flex flex-col gap-1', fromUser ? 'items-end' : 'items-start')}
      // pointing at an answer lights up what it talks about
      onMouseEnter={() => message.nodes.length > 0 && highlight(message.nodes.map((node) => node.node_id))}
      onMouseLeave={() => highlight([])}
    >
      {fromUser ? <Question message={message} repo={repo} /> : <Answer message={message} repo={repo} />}
      {!message.grounded && !fromUser && (
        <span className="flex items-center gap-1 px-1 text-xs text-muted">
          <Info aria-hidden /> Answers only say what the indexed graph shows.
        </span>
      )}
    </li>
  );
}

/** What was asked, as typed: plain text with its @-mentions as chips. */
function Question({ message, repo }: ChatMessageProps) {
  const segments = useMemo(() => questionSegments(message), [message]);
  return (
    <p className="max-w-5/6 rounded-lg bg-fill-active px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap">
      {segments.map((segment, index) =>
        segment.type === 'node' ? <NodeChip key={index} node={segment.node} repo={repo} mention /> : segment.text,
      )}
    </p>
  );
}

/**
 * The model's markdown. Raw HTML is dropped, links render as plain text and images load only from
 * our attachments: an answer can quote a repository's own text, so it must not reach other servers.
 */
function Answer({ message, repo }: ChatMessageProps) {
  const markdown = useMemo(() => answerMarkdown(message), [message]);
  const byRef = useMemo(() => new Map(message.nodes.map((node) => [node.ref, node])), [message]);
  const components = useMemo(
    () => ({
      a: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
      img: ({ src, alt }: ComponentProps<'img'>) => <SafeImage src={src} alt={alt} />,
      inlineCode: ({ children, ...props }: ComponentProps<'code'>) => {
        const node = byRef.get(CHIP_RE.exec(String(children))?.[1] ?? null);
        if (node) return <NodeChip node={node} repo={repo} />;
        return <InlineCode {...props}>{children}</InlineCode>;
      },
    }),
    [byRef, repo],
  );

  return (
    <div className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm leading-relaxed break-words">
      <Markdown components={components}>{markdown}</Markdown>
    </div>
  );
}

/** An image from an attachment or inline data; anything else shows as its description instead. */
function SafeImage({ src, alt }: { src: unknown; alt?: string }) {
  const safe = safeImageSrc(src);
  if (!safe) return <span className="text-xs text-muted">[image not shown{alt ? `: ${alt}` : ''}]</span>;
  return <img src={safe} alt={alt ?? ''} loading="lazy" referrerPolicy="no-referrer" className="my-2 max-w-full rounded-md border border-border" />;
}

/** A node in a message; clicking it selects the node on the diagram, opening the folders it's in. */
function NodeChip({ node, repo, mention = false }: { node: NodeRef; repo: string; mention?: boolean }) {
  const where = node.node_id.startsWith(`${repo}:`) ? node.node_id.slice(repo.length + 1) : node.node_id;

  return (
    <Tooltip content={where}>
      <button
        type="button"
        className="inline rounded px-1 font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => useViewStore.getState().focus(node.node_id, ancestorsOf(node.node_id, repo))}
        onMouseEnter={() => useViewStore.getState().highlight([node.node_id])}
      >
        {/* a question's mention keeps the `@` it was typed with; package names may already start with one */}
        {mention && !node.name.startsWith('@') ? `@${node.name}` : node.name}
      </button>
    </Tooltip>
  );
}
