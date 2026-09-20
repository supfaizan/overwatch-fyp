"use client";

import { ArrowUpRight } from "lucide-react";

/** The exact files and definitions an answer drew on.
 *
 * The diagram can only highlight modules, so without these the reader cannot
 * tell *which* function an answer meant. Each one opens in the explorer. */
export function AnswerReferences({
  references,
  onOpen,
}: {
  references: string[];
  onOpen: (nodeId: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="ow-mono-micro text-text-dim">FROM</span>
      {references.map((reference) => (
        <button
          key={reference}
          type="button"
          onClick={() => onOpen(reference)}
          title={reference}
          className="group flex max-w-[180px] items-center gap-1 rounded-pill border border-line-1 bg-surface-1 px-2 py-0.5 font-mono text-[10px] text-text-lo transition-colors hover:border-signal-border hover:text-signal"
        >
          <span className="truncate">{label(reference)}</span>
          <ArrowUpRight className="size-2.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}

/** Node ids are long; show the definition, or the filename it lives in. */
function label(nodeId: string): string {
  const afterRepo = nodeId.split(":").slice(1).join(":") || nodeId;
  const symbol = afterRepo.split("#")[1];
  return symbol ?? afterRepo.split("/").at(-1) ?? afterRepo;
}
