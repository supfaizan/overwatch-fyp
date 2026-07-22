"use client";

import { MousePointerClick, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGraph } from "../hooks";
import { useDashboardStore } from "../stores/dashboard-store";

export function NodeInspector() {
  const selectedId = useDashboardStore((s) => s.selectedNodeId);
  const focusNodes = useDashboardStore((s) => s.focusNodes);
  const { data: graph } = useGraph();

  const node = graph?.nodes.find((n) => n.id === selectedId);

  if (!node || !graph) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <MousePointerClick className="size-5 text-text-dim" />
        <p className="ow-mono-micro text-text-dim">
          SELECT A NODE ON THE GRAPH TO INSPECT IT
        </p>
      </div>
    );
  }

  // Direction matters here: what this module imports vs what imports it.
  const dependencies = graph.edges
    .filter((e) => e.source === node.id)
    .map((e) => ({
      node: graph.nodes.find((n) => n.id === e.target),
      weight: e.data?.weight ?? 0,
    }))
    .filter((n) => n.node);

  const dependents = graph.edges
    .filter((e) => e.target === node.id)
    .map((e) => ({
      node: graph.nodes.find((n) => n.id === e.source),
      weight: e.data?.weight ?? 0,
    }))
    .filter((n) => n.node);

  const external = node.data.kind === "external";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line-1 px-4 py-3">
        <span className="ow-mono-micro text-text-mid">NODE INSPECTOR</span>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <div>
          <p className="ow-mono-data !text-[16px] text-text-hi">
            {node.data.label}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-sm border border-line-2 bg-surface-2 px-1.5 py-0.5 ow-mono-micro text-text-mid uppercase">
              {node.data.kind}
            </span>
            {!external && (
              <>
                <span className="rounded-sm border border-line-2 bg-surface-2 px-1.5 py-0.5 ow-mono-micro text-text-mid">
                  {node.data.fileCount} FILES
                </span>
                <span className="rounded-sm border border-line-2 bg-surface-2 px-1.5 py-0.5 ow-mono-micro text-text-mid">
                  {node.data.definitionCount} DEFINITIONS
                </span>
              </>
            )}
          </div>
          {external && (
            <p className="mt-2 ow-body !text-[12px] text-text-dim">
              Every third-party package import is collapsed into this single
              node — external packages are not modelled individually.
            </p>
          )}
        </div>

        <NeighbourList
          title="DEPENDS ON"
          icon={ArrowDownRight}
          entries={dependencies}
          onSelect={(id) => focusNodes([node.id, id])}
        />

        <NeighbourList
          title="DEPENDED ON BY"
          icon={ArrowUpRight}
          entries={dependents}
          onSelect={(id) => focusNodes([node.id, id])}
        />
      </div>
    </div>
  );
}

function NeighbourList({
  title,
  icon: Icon,
  entries,
  onSelect,
}: {
  title: string;
  icon: typeof ArrowUpRight;
  entries: Array<{ node?: { id: string; data: { label: string } }; weight: number }>;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 ow-mono-micro text-text-dim">
        <Icon className="size-3" />
        {title} · {entries.length}
      </p>
      {entries.length === 0 ? (
        <p className="mt-2 ow-mono-micro text-text-dim opacity-60">NONE</p>
      ) : (
        <div className="mt-2 space-y-1.5">
          {entries.map(({ node: nb, weight }) => (
            <button
              key={nb!.id}
              onClick={() => onSelect(nb!.id)}
              className="ow-panel flex w-full items-center justify-between p-2 text-left"
            >
              <span className="flex items-center gap-2">
                <span className={cn("size-1.5 rounded-full bg-signal")} />
                <span className="ow-mono-data !text-[11px] text-text-hi">
                  {nb!.data.label}
                </span>
              </span>
              <span className="ow-mono-micro text-text-dim">
                {weight} IMPORT{weight === 1 ? "" : "S"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
