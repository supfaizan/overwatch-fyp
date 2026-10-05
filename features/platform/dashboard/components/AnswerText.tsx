"use client";

import { Fragment, useMemo } from "react";
import { parseAnswer, type AnswerToken } from "../lib/answer-text";
import type { AnswerReference } from "../types";

/** An answer's text with its markup rendered: `code`, **emphasis**, `[n]`
 *  citations as links that show the cited node on the map, and quoted source
 *  as code blocks. Built from tokens, never HTML, so text quoted from a
 *  repository cannot inject markup. */
export function AnswerText({
  text,
  references,
  onShow,
}: {
  text: string;
  references: readonly AnswerReference[];
  onShow: (reference: AnswerReference) => void;
}) {
  const blocks = useMemo(() => parseAnswer(text), [text]);
  const byNumber = useMemo(
    () => new Map(references.map((reference) => [reference.number, reference])),
    [references],
  );

  return (
    <div className="space-y-2">
      {blocks.map((block, index) =>
        block.kind === "code" ? (
          <pre
            key={index}
            aria-label={block.language ? `${block.language} code` : "code"}
            className="max-h-64 overflow-auto rounded-sm border border-line-1 bg-ink-850 p-2 font-mono text-[11px] leading-4 text-text-hi"
          >
            {block.text}
          </pre>
        ) : (
          <div key={index} className="whitespace-pre-wrap break-words">
            {block.lines.map((tokens, line) => (
              <Fragment key={line}>
                {line > 0 && "\n"}
                {tokens.map((token, position) => (
                  <Token key={position} token={token} byNumber={byNumber} onShow={onShow} />
                ))}
              </Fragment>
            ))}
          </div>
        ),
      )}
    </div>
  );
}

function Token({
  token,
  byNumber,
  onShow,
}: {
  token: AnswerToken;
  byNumber: Map<number, AnswerReference>;
  onShow: (reference: AnswerReference) => void;
}) {
  if (token.kind === "text") return <>{token.text}</>;
  if (token.kind === "strong") return <strong className="font-semibold text-text-hi">{token.text}</strong>;
  if (token.kind === "code") {
    return (
      <code className="rounded-sm bg-surface-2 px-1 font-mono text-[12px] text-text-hi">{token.text}</code>
    );
  }

  const reference = byNumber.get(token.number);
  // The server keeps only citations of real nodes; one with no reference
  // here would be an older message — show the number, inert.
  if (!reference) return <span className="text-text-dim">[{token.number}]</span>;
  return (
    <button
      type="button"
      onClick={() => onShow(reference)}
      title={`${reference.name}${reference.path ? ` — ${reference.path}` : ""} · show on map`}
      className="mx-0.5 inline-flex -translate-y-px items-center rounded-sm border border-signal-border bg-signal-soft px-1 align-baseline font-mono text-[10px] leading-4 text-signal transition-colors hover:bg-signal hover:text-signal-ink"
    >
      {token.number}
    </button>
  );
}
