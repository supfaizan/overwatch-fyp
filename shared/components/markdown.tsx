'use client';

import { cn } from '@/shared/lib/cn';
import type { ComponentProps } from 'react';
import { Streamdown } from 'streamdown';

type Components = NonNullable<ComponentProps<typeof Streamdown>['components']>;

/** Links open in a new tab and tell the destination nothing about where they came from. */
const SafeLink: Components['a'] = ({ href, children }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
};

/** Images never load by default: an image URL is a request to whoever wrote it. Pass `components.img` to allow some. */
const ImagePlaceholder: Components['img'] = ({ alt }) => {
  return <span className="text-xs text-muted">[image{alt ? `: ${alt}` : ''}]</span>;
};

/** `code` in a sentence: a light primary tint, readable in both themes (Streamdown's default is a dark block). */
/** The inline-code look; `rich-text-editor.tsx` spells out the same classes, so keep the two in step. */
const INLINE_CODE_CLASS =
  'rounded bg-primary/10 px-1 py-0.5 font-mono text-[0.85em] text-primary-strong dark:text-primary';

export function InlineCode(
  { children, className, node: _node, ...props }: ComponentProps<'code'> & { node?: unknown },
) {
  return (
    <code className={cn(INLINE_CODE_CLASS, className)} {...props}>
      {children}
    </code>
  );
}

type MarkdownProps = {
  /** The Markdown to render. */
  children: string;
  /**
   * Element overrides, merged over the safe defaults (e.g. `inlineCode`, `img`, `a`).
   * @default links open in a new tab; images show as their description; inline code is tinted (`InlineCode`)
   */
  components?: Components;
  className?: string;
};

/**
 * Renders Markdown (GFM: lists, tables, code blocks with a copy button) as React, never as raw HTML.
 * - For text we didn't write: tracker descriptions, comments, AI answers. Raw HTML in it is dropped.
 * - Images don't load unless `components.img` allows them; decide per use which sources are safe.
 * - Overriding `inlineCode` for some spans only? Fall back to the exported `InlineCode` for the rest.
 * - Static: renders the whole string at once. It isn't a streaming view.
 */
export default function Markdown({ children, components, className }: MarkdownProps) {
  return (
    <Streamdown
      mode="static"
      skipHtml
      controls={{ table: false, code: true, mermaid: false }}
      className={cn('text-sm leading-relaxed break-words', className)}
      components={{ a: SafeLink, img: ImagePlaceholder, inlineCode: InlineCode, ...components }}
    >
      {children}
    </Streamdown>
  );
}
