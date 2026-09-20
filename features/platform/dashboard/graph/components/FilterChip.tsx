"use client";

import { cn } from "@/lib/utils";

/** A toggle in a filter row. Selected is the loud state, because the resting
 *  canvas shows everything and a filter is something you switched off. */
export function FilterChip({
  selected,
  onClick,
  children,
  swatch,
  title,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** A CSS colour for the line this chip controls, where it has one. */
  swatch?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-1.5 rounded-sm border px-1.5 py-1 ow-mono-micro transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-line-2 bg-surface-2 text-text-mid hover:text-text-hi"
          : "border-transparent bg-transparent text-text-dim hover:text-text-lo",
      )}
    >
      {swatch && (
        <span
          aria-hidden
          className="h-px w-3 shrink-0"
          style={{ backgroundColor: selected ? swatch : "var(--ow-idle)" }}
        />
      )}
      {children}
    </button>
  );
}
