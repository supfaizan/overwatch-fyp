'use client';

import { cn } from '@/shared/lib/cn';
import { code as highlighter, type HighlightResult } from '@streamdown/code';
import { type CSSProperties, Fragment, useEffect, useReducer, useRef } from 'react';

type Language = Parameters<typeof highlighter.highlight>[0]['language'];

type CodeLinesProps = {
  code: string;
  /** The number of the first line, as in the file. */
  startLine: number;
  language: string | null;
  /** Lines to mark, inclusive, by their number in the file. */
  marked?: { start: number; end: number };
  /** Scroll the first marked line into view once rendered. */
  scrollToMarked?: boolean;
  className?: string;
};

/** Code with its file's line numbers, coloured once the language loads, and optionally a marked range. */
export default function CodeLines(
  { code, startLine, language, marked, scrollToMarked = false, className }: CodeLinesProps,
) {
  const tokens = useHighlight(code, language);
  const firstMarked = useRef<HTMLSpanElement>(null);
  const lines = code.split('\n');

  useEffect(() => {
    if (scrollToMarked) {
      firstMarked.current?.scrollIntoView({ block: 'center' });
    }
  }, [scrollToMarked, tokens]);

  return (
    <pre className={cn('overflow-auto py-2 font-mono text-xs leading-5', className)}>
      <code className="grid min-w-max grid-cols-[auto_1fr]">
        {lines.map((line, index) => {
          const number = startLine + index;
          const isMarked = Boolean(marked && number >= marked.start && number <= marked.end);
          return (
            <Fragment key={number}>
              <span
                ref={isMarked && number === marked?.start ? firstMarked : undefined}
                aria-hidden
                className={cn(
                  'border-l-2 border-transparent pr-3 pl-2.5 text-right text-muted tabular-nums select-none',
                  isMarked && 'border-primary bg-primary/10 text-primary',
                )}
              >
                {number}
              </span>
              <span className={cn('pr-4 whitespace-pre', isMarked && 'bg-primary/10')}>
                {tokens?.[index]
                  ? tokens[index].map((token, at) => {
                    return (
                      <span key={at} style={tokenStyle(token.htmlStyle)} className={TOKEN_CLASS}>
                        {token.content}
                      </span>
                    );
                  })
                  : line || ' '}
              </span>
            </Fragment>
          );
        })}
      </code>
    </pre>
  );
}

// each token carries both themes' colours; `.dark` picks the second
const TOKEN_CLASS = 'text-(--code-light) dark:text-(--code-dark)';

function tokenStyle(style: Record<string, string> | undefined): CSSProperties | undefined {
  if (!style) {
    return undefined;
  }
  return { '--code-light': style.color, '--code-dark': style['--shiki-dark'] } as CSSProperties;
}

/** Shiki tokens per line, or null until the language has loaded (or when it's unknown). */
function useHighlight(code: string, language: string | null): HighlightResult['tokens'] | null {
  const [, rerender] = useReducer((count: number) => {
    return count + 1;
  }, 0);
  const lang = language && highlighter.supportsLanguage(language as Language)
    ? (language as Language)
    : null;
  // cached results come back at once; otherwise the effect below waits for them
  const ready = lang
    ? highlighter.highlight({ code, language: lang, themes: highlighter.getThemes() })
    : null;

  useEffect(() => {
    if (!lang || ready) {
      return;
    }
    let live = true;
    highlighter.highlight({ code, language: lang, themes: highlighter.getThemes() }, () => {
      if (live) {
        rerender();
      }
    });
    return () => {
      live = false;
    };
  }, [code, lang, ready]);

  return ready?.tokens ?? null;
}
