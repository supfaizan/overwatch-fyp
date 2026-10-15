'use client';

import { ArrowSquareOut, LinkSimple } from '@phosphor-icons/react';
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import type { MouseEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import { embedFor, hostOf } from '../embeds';
import { useLinkPreview } from '../hooks';
import { setCardKind } from '../link-cards';
import { CARD_KIND, type CardKind } from '../types';

const SWITCHES: { kind: CardKind; label: string }[] = [
  { kind: CARD_KIND.inline, label: 'Link' },
  { kind: CARD_KIND.block, label: 'Card' },
  { kind: CARD_KIND.embed, label: 'Embed' },
];

type Known = { title?: string; site?: string; icon?: string };

/** What Confluence already knew about the link (its smart link's JSON-LD), so the card needn't ask. */
function fromSource(raw: unknown): Known {
  const data = (raw as { attrs?: { data?: Record<string, unknown> } } | null)?.attrs?.data;
  const generator = data?.generator as { name?: string; icon?: string | { url?: string } } | undefined;
  return {
    title: typeof data?.name === 'string' ? data.name : undefined,
    site: generator?.name,
    icon: typeof generator?.icon === 'string' ? generator.icon : generator?.icon?.url,
  };
}

/** A link as a chip, a card or an embed; while editing, the selected one can switch between them. */
export default function LinkCardView({ node, editor, getPos, selected }: NodeViewProps) {
  const kind = node.type.name as CardKind;
  const url = String(node.attrs.url ?? '');
  const embed = kind === CARD_KIND.embed ? embedFor(url) : null;
  const known = fromSource(node.attrs.raw);
  const preview = useLinkPreview(url, !embed && !(kind === CARD_KIND.inline && known.title));
  const title = known.title ?? preview.data?.title ?? hostOf(url);
  const icon = known.icon ?? preview.data?.icon_url;
  const site = known.site ?? preview.data?.site_name ?? hostOf(url);
  const editing = editor.isEditable;
  // while editing, a click selects the card; ⌘/Ctrl-click still follows it
  const follow = (event: MouseEvent) => {
    if (editing && !event.metaKey && !event.ctrlKey) event.preventDefault();
  };
  const switcher = editing && selected && (
    <span contentEditable={false} role="group" aria-label="Show link as" className="absolute top-full left-0 z-10 mt-1 flex gap-0.5 rounded-md border border-border bg-surface p-0.5 text-xs shadow-chrome">
      {SWITCHES.map((option) => {
        const unavailable = option.kind === CARD_KIND.embed && !embedFor(url);
        return (
          <button
            key={option.kind}
            type="button"
            disabled={unavailable}
            aria-pressed={option.kind === kind}
            title={unavailable ? `${hostOf(url)} can't be embedded` : undefined}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              const pos = getPos();
              if (typeof pos === 'number') setCardKind(editor, pos, option.kind);
            }}
            className={cn('cursor-pointer rounded px-2 py-1 hover:bg-fill-hover disabled:cursor-not-allowed disabled:opacity-40', option.kind === kind && 'bg-fill-active font-medium')}
          >
            {option.label}
          </button>
        );
      })}
    </span>
  );
  const favicon = icon ? <img src={icon} alt="" className="size-4 shrink-0 rounded-sm" /> : <LinkSimple aria-hidden className="size-4 shrink-0 text-muted" />;

  if (kind === CARD_KIND.inline) {
    return (
      <NodeViewWrapper as="span" className="relative">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={follow}
          title={editing ? `${url} (⌘/Ctrl-click to open)` : url}
          className={cn('inline-flex max-w-full items-center gap-1 rounded border border-border bg-surface px-1.5 align-baseline text-[0.95em] text-primary no-underline hover:bg-fill-hover', selected && 'outline-2 outline-primary')}
        >
          {favicon}
          <span className="truncate">{title}</span>
        </a>
        {switcher}
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className={cn('relative my-3 rounded-lg', selected && 'outline-2 outline-offset-2 outline-primary')}>
      {embed ? (
        <figure className="m-0 overflow-hidden rounded-lg border border-border bg-surface">
          <iframe
            src={embed.src}
            title={title}
            loading="lazy"
            allow="fullscreen; picture-in-picture; clipboard-write"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms"
            // while editing, the page keeps the clicks until the embed is selected
            className={cn('block aspect-video w-full border-0', editing && !selected && 'pointer-events-none')}
          />
          <figcaption className="flex items-center gap-2 border-t border-border px-3 py-2 text-xs text-muted">
            <span className="truncate">{embed.provider}</span>
            <span className="flex-1" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
              Open <ArrowSquareOut aria-hidden className="size-3.5" />
            </a>
          </figcaption>
        </figure>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={follow} className="flex overflow-hidden rounded-lg border border-border bg-surface text-foreground no-underline hover:border-border-hover">
          <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
            <span className="line-clamp-2 font-medium text-primary">{title}</span>
            {preview.data?.description && <span className="line-clamp-2 text-sm text-muted">{preview.data.description}</span>}
            <span className="mt-auto flex items-center gap-1.5 text-xs text-muted">{favicon}<span className="truncate">{site}</span></span>
          </span>
          {preview.data?.image_url && <img src={preview.data.image_url} alt="" loading="lazy" className="hidden w-48 shrink-0 object-cover sm:block" />}
        </a>
      )}
      {switcher}
    </NodeViewWrapper>
  );
}
