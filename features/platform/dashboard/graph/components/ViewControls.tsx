"use client";

import { useState } from "react";
import { Layers, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExpandTo, useViewOptions } from "../hooks";
import { containerLabel, edgeStyle } from "../lib/appearance";
import { useViewStore } from "../stores/view-store";
import type { Granularity, OpenContainer } from "../types";
import { FilterChip } from "./FilterChip";

/** Levels you can jump a folder to. "Folders" is not here: collapsing back
 *  to the top is `RESET`, and it is the one action that is global. */
const LEVELS: { id: Granularity; label: string }[] = [
  { id: "file", label: "FILES" },
  { id: "symbol", label: "SYMBOLS" },
];

interface Selection {
  id: string;
  name: string;
}

/** The controls that sit over the canvas: what to open, what to draw, and
 *  what is currently open.
 *
 * Opening to a level is deliberately tied to the selected node. Applied to
 * the whole repository it opens every folder at once, which answers no
 * question and stalls the browser. */
export function ViewControls({
  expanded,
  selected,
}: {
  expanded: OpenContainer[];
  selected: Selection | null;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: options } = useViewOptions();
  const { expandTo, isPending, disabled } = useExpandTo();

  const closeAll = useViewStore((state) => state.closeAll);
  const nodeLabels = useViewStore((state) => state.nodeLabels);
  const edgeTypes = useViewStore((state) => state.edgeTypes);
  const filtered = nodeLabels !== null || edgeTypes !== null;
  const canJump = Boolean(selected) && !disabled && !isPending;

  return (
    <div className="pointer-events-none absolute left-3 top-3 flex max-w-[min(30rem,calc(100%-1.5rem))] flex-col gap-2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-md border border-line-1 bg-ink-900/85 p-1 backdrop-blur-sm">
        <Layers className="ml-1 size-3 shrink-0 text-text-dim" aria-hidden />
        <span className="ow-micro mr-1 max-w-[10rem] truncate text-text-dim">
          {selected ? `OPEN ${selected.name} TO` : "PICK A NODE TO OPEN"}
        </span>
        {LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            disabled={!canJump}
            title={
              selected
                ? `Open ${selected.name} down to ${level.label.toLowerCase()}`
                : "Select a node on the canvas first"
            }
            onClick={() => selected && expandTo(level.id, selected.id)}
            className={cn(
              "rounded-sm px-1.5 py-1 ow-micro text-text-lo transition-colors",
              "hover:bg-surface-2 hover:text-text-hi",
              "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {level.label}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-line-1" aria-hidden />

        <button
          type="button"
          onClick={closeAll}
          disabled={expanded.length === 0}
          title="Close every folder"
          className={cn(
            "rounded-sm px-1.5 py-1 ow-micro text-text-lo transition-colors",
            "hover:bg-surface-2 hover:text-text-hi",
            "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          RESET
        </button>

        <span className="mx-1 h-4 w-px bg-line-1" aria-hidden />

        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          className={cn(
            "flex items-center gap-1 rounded-sm px-1.5 py-1 ow-micro transition-colors",
            "hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            filtered ? "text-signal" : "text-text-lo hover:text-text-hi",
          )}
        >
          <SlidersHorizontal className="size-3" aria-hidden />
          FILTERS
        </button>
      </div>

      {filtersOpen && options && <FilterPanel options={options} />}

      {expanded.length > 0 && <OpenTrail expanded={expanded} />}
    </div>
  );
}

function FilterPanel({
  options,
}: {
  options: NonNullable<ReturnType<typeof useViewOptions>["data"]>;
}) {
  const nodeLabels = useViewStore((state) => state.nodeLabels);
  const edgeTypes = useViewStore((state) => state.edgeTypes);
  const toggleNodeLabel = useViewStore((state) => state.toggleNodeLabel);
  const toggleEdgeType = useViewStore((state) => state.toggleEdgeType);
  const clearFilters = useViewStore((state) => state.clearFilters);

  const selectedLabels = new Set(nodeLabels ?? options.nodeLabels);
  const selectedTypes = new Set(edgeTypes ?? options.edgeTypes);

  return (
    <div className="pointer-events-auto flex flex-col gap-2 rounded-md border border-line-1 bg-ink-900/90 p-2.5 backdrop-blur-sm">
      <FilterRow title="NODES">
        {options.nodeLabels.map((label) => (
          <FilterChip
            key={label}
            selected={selectedLabels.has(label)}
            onClick={() => toggleNodeLabel(label, options.nodeLabels)}
          >
            {label.toUpperCase()}
          </FilterChip>
        ))}
      </FilterRow>

      <FilterRow title="LINKS">
        {options.edgeTypes.map((type) => (
          <FilterChip
            key={type}
            selected={selectedTypes.has(type)}
            swatch={edgeStyle(type).stroke}
            onClick={() => toggleEdgeType(type, options.edgeTypes)}
            title={edgeStyle(type).label}
          >
            {type.replaceAll("_", " ")}
          </FilterChip>
        ))}
      </FilterRow>

      {(nodeLabels !== null || edgeTypes !== null) && (
        <button
          type="button"
          onClick={clearFilters}
          className="ow-micro self-start text-signal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          SHOW EVERYTHING
        </button>
      )}
    </div>
  );
}

function FilterRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="ow-micro mt-1.5 w-10 shrink-0 text-text-dim">
        {title}
      </span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

/** How many open containers are listed before the trail folds itself up.
 *  Opening to a whole level can leave dozens open, and a wall of chips would
 *  cover the graph it is meant to describe. */
const TRAIL_PREVIEW = 6;

/** What is currently open, and the way back out of each one. */
function OpenTrail({ expanded }: { expanded: OpenContainer[] }) {
  const [showAll, setShowAll] = useState(false);
  const close = useViewStore((state) => state.close);
  const closeAll = useViewStore((state) => state.closeAll);

  const folded = !showAll && expanded.length > TRAIL_PREVIEW;
  const shown = folded ? expanded.slice(0, TRAIL_PREVIEW) : expanded;

  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-wrap items-center gap-1 rounded-md border border-line-1 bg-ink-900/85 p-1.5 backdrop-blur-sm",
        showAll && "max-h-[40vh] overflow-y-auto",
      )}
    >
      <span className="ow-micro px-1 text-text-dim">OPEN</span>
      {shown.map((container) => (
        <button
          key={container.id}
          type="button"
          onClick={() => close(container.id)}
          title={`Close ${containerLabel(container)}`}
          className={cn(
            "flex items-center gap-1 rounded-sm border border-line-2 bg-surface-2 py-1 pl-1.5 pr-1",
            "font-mono text-[10px] text-text-mid transition-colors hover:border-signal hover:text-text-hi",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <span className="max-w-[12rem] truncate">
            {containerLabel(container)}
          </span>
          <X className="size-3 shrink-0" aria-hidden />
        </button>
      ))}
      {expanded.length > TRAIL_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((open) => !open)}
          className="ow-micro px-1 text-text-lo transition-colors hover:text-text-hi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {folded ? `+${expanded.length - TRAIL_PREVIEW} MORE` : "SHOW FEWER"}
        </button>
      )}
      {expanded.length > 1 && (
        <button
          type="button"
          onClick={closeAll}
          className="ow-micro px-1 text-text-lo transition-colors hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          CLOSE ALL
        </button>
      )}
    </div>
  );
}
