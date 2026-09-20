"use client";

import { Loader2, Search, X } from "lucide-react";
import { MIN_SEARCH_LENGTH, useGraphSearch } from "../hooks";
import { useExplorerStore } from "../stores/explorer-store";
import { NodeRow } from "./NodeRow";

/** Find any file or symbol by name and jump straight to it. */
export function ExplorerSearch({ onOpen }: { onOpen: (nodeId: string) => void }) {
  const term = useExplorerStore((state) => state.searchTerm);
  const setSearchTerm = useExplorerStore((state) => state.setSearchTerm);
  const { results, isFetching, isTyping, isTermTooShort, isError, error } =
    useGraphSearch(term);

  const searching = isFetching || isTyping;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="relative shrink-0 px-3 pb-2">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-text-lo"
          aria-hidden
        />
        <input
          value={term}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search files and definitions…"
          aria-label="Search the graph"
          maxLength={200}
          className="h-9 w-full rounded-md border border-line-2 bg-ink-850 pl-8 pr-8 font-mono text-[12px] text-text-hi outline-none placeholder:text-text-dim focus:border-signal-border"
        />
        {searching ? (
          <Loader2 className="absolute right-5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-signal" />
        ) : term ? (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
            className="absolute right-5 top-1/2 -translate-y-1/2 text-text-lo hover:text-text-hi"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {isTermTooShort && (
        <p className="px-3 pb-2 ow-mono-micro text-text-dim">
          TYPE AT LEAST {MIN_SEARCH_LENGTH} CHARACTERS
        </p>
      )}

      {isError && (
        <p className="px-3 pb-2 ow-body !text-[12px] text-critical">
          {error instanceof Error ? error.message : "Search failed."}
        </p>
      )}

      {results.length > 0 && (
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
          {results.map((node) => (
            <NodeRow key={node.id} node={node} onOpen={onOpen} />
          ))}
        </div>
      )}

      {!searching && !isTermTooShort && term.trim() && results.length === 0 && (
        <p className="px-3 pb-3 ow-mono-micro text-text-dim">NO MATCHES</p>
      )}
    </div>
  );
}
