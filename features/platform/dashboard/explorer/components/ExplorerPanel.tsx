"use client";

import { Compass } from "lucide-react";
import { useCurrentNodeId, useExplorerStore } from "../stores/explorer-store";
import { ExplorerSearch } from "./ExplorerSearch";
import { NodeDetail } from "./NodeDetail";
import { Breadcrumbs } from "./Breadcrumbs";

/** Drill into the graph: search for anything, then follow it outwards.
 *
 * Selecting a node on the diagram opens it here (see `useSelectNode`), so the
 * canvas and the explorer stay in step without either owning the other's
 * state. */
export function ExplorerPanel() {
  const currentNodeId = useCurrentNodeId();
  const open = useExplorerStore((state) => state.open);
  const drillInto = useExplorerStore((state) => state.drillInto);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-line-1 px-4 py-3">
        <Compass className="size-3.5 text-signal" />
        <span className="ow-micro text-text-mid">EXPLORE</span>
      </div>

      <div className="shrink-0 pt-3">
        <ExplorerSearch onOpen={open} />
      </div>

      <Breadcrumbs />

      {currentNodeId ? (
        <NodeDetail nodeId={currentNodeId} onOpen={drillInto} />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
          <p className="ow-micro text-text-dim">
            SEARCH, OR PICK A NODE ON THE DIAGRAM, TO EXPLORE IT
          </p>
        </div>
      )}
    </div>
  );
}
