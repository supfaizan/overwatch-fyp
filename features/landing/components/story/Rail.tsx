/* The storyline: one vertical line on the left of the story column. Everything
   here sits at the rail's x position, set by `--rail-gutter` on the column. */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { railDotAttrs, railLineAttrs } from "../../lib/story-dom";

const AT_RAIL = "absolute left-[calc(-1*var(--rail-gutter))]";

/** Wraps the chapters and draws the line beside them. The fill length comes
 *  from `--rail-progress`, written by useStoryRail. */
export function RailLine({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        {...railLineAttrs}
        className={cn(
          AT_RAIL,
          // Whole-pixel position (no -50% shift) keeps the 1px line crisp.
          "inset-y-0 w-px bg-line-1 [mask-image:linear-gradient(to_bottom,transparent,black_8rem)]",
        )}
      >
        <div
          className="absolute inset-0 origin-top bg-signal"
          style={{ transform: "scaleY(var(--rail-progress, 0))" }}
        />
        <div
          className="absolute left-1/2 size-1.5 -translate-1/2 rounded-full bg-signal shadow-[0_0_10px_2px_var(--ow-signal)]"
          style={{ top: "calc(var(--rail-progress, 0) * 100%)" }}
        />
      </div>
      {children}
    </div>
  );
}

/** A stop on the line. Lights up once the line reaches it. Place it inside a
 *  `relative` element; it centres on that element's vertical middle. */
export function RailDot({ terminal = false }: { terminal?: boolean }) {
  return (
    <span
      aria-hidden
      {...railDotAttrs}
      className={cn(
        AT_RAIL,
        "top-1/2 -translate-1/2 rounded-full border border-line-2 bg-ink-850",
        "transition-[background-color,border-color,box-shadow] duration-500",
        "data-[reached=true]:border-signal data-[reached=true]:bg-signal data-[reached=true]:shadow-[0_0_0_4px_var(--ow-signal-soft)]",
        terminal ? "size-3" : "size-2.5",
      )}
    />
  );
}

/** Where the line begins: a short animated stroke under the hero. */
export function ScrollCue({ label }: { label: string }) {
  return (
    <div aria-hidden className={cn(AT_RAIL, "bottom-0 flex h-28 items-end")}>
      <svg
        width="2"
        height="112"
        viewBox="0 0 2 112"
        className="-translate-x-1/2 overflow-visible"
      >
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="112"
          stroke="var(--ow-signal)"
          strokeWidth="1.5"
          className="ow-edge-flow"
        />
      </svg>
      <span className="mb-12 ml-3 hidden font-mono text-[10px] uppercase tracking-[0.25em] text-text-lo lg:inline">
        {label}
      </span>
    </div>
  );
}
