"use client";

import { ArrowUpRight, MapPin } from "lucide-react";
import type { AnswerReference } from "../types";

/** The nodes an answer drew on. Each shows on the map — lit and centred,
 *  without leaving the chat — or opens in the explorer. */
export function AnswerReferences({
  references,
  onShow,
  onExplore,
}: {
  references: readonly AnswerReference[];
  onShow: (reference: AnswerReference) => void;
  onExplore: (nodeId: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="ow-micro text-text-dim">FROM</span>
      {references.map((reference) => (
        <span
          key={reference.nodeId}
          className="group flex max-w-[200px] items-center rounded-pill border border-line-1 bg-surface-1 font-mono text-[10px] text-text-lo transition-colors hover:border-signal-border"
        >
          <button
            type="button"
            onClick={() => onShow(reference)}
            title={`${reference.name}${reference.path ? ` — ${reference.path}` : ""} · show on map`}
            className="flex min-w-0 items-center gap-1 py-0.5 pl-2 pr-1 hover:text-signal"
          >
            <span className="text-text-dim">{reference.number}</span>
            <MapPin className="size-2.5 shrink-0 opacity-60" aria-hidden />
            <span className="truncate">{reference.name}</span>
          </button>
          <button
            type="button"
            onClick={() => onExplore(reference.nodeId)}
            aria-label={`Open ${reference.name} in the explorer`}
            title="Open in the explorer"
            className="py-0.5 pl-0.5 pr-2 hover:text-signal"
          >
            <ArrowUpRight className="size-2.5" aria-hidden />
          </button>
        </span>
      ))}
    </div>
  );
}
