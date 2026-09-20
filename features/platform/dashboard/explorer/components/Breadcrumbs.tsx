"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExplorerStore } from "../stores/explorer-store";

/** The path taken through the graph, so a drill-down is reversible. */
export function Breadcrumbs() {
  const trail = useExplorerStore((state) => state.trail);
  const goTo = useExplorerStore((state) => state.goTo);

  if (trail.length < 2) return null;

  return (
    <nav
      aria-label="Explorer history"
      className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line-1 px-3 py-2"
    >
      {trail.map((nodeId, index) => {
        const isCurrent = index === trail.length - 1;
        return (
          <span key={`${nodeId}-${index}`} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="size-3 text-text-dim" aria-hidden />
            )}
            <button
              type="button"
              onClick={() => goTo(index)}
              disabled={isCurrent}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "max-w-[140px] truncate font-mono text-[10px] transition-colors",
                isCurrent
                  ? "text-text-hi"
                  : "text-text-lo hover:text-signal",
              )}
            >
              {shortLabel(nodeId)}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

/** Node ids are long; the last meaningful part is what a reader recognises. */
function shortLabel(nodeId: string): string {
  const afterRepo = nodeId.split(":").slice(1).join(":") || nodeId;
  const symbol = afterRepo.split("#")[1];
  if (symbol) return symbol;
  return afterRepo.split("/").at(-1) ?? afterRepo;
}
