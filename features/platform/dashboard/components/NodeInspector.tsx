"use client";

import { MousePointerClick, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGraph, useWarnings } from "../hooks";
import { useDashboardStore } from "../stores/dashboard-store";

export function NodeInspector() {
  const selectedId = useDashboardStore((s) => s.selectedNodeId);
  const focusNodes = useDashboardStore((s) => s.focusNodes);
  const { data: graph } = useGraph();
  const { data: warnings } = useWarnings();

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

  const neighbors = graph.edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      const otherId = e.source === node.id ? e.target : e.source;
      return {
        node: graph.nodes.find((n) => n.id === otherId)!,
        probabilistic: e.data?.confidence === "probabilistic",
      };
    });

  const related = warnings?.filter((w) => w.nodeIds.includes(node.id)) ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line-1 px-4 py-3">
        <span className="ow-mono-micro text-text-mid">NODE INSPECTOR</span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <div>
          <p className="ow-mono-data !text-[16px] text-text-hi">{node.data.label}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-sm border border-line-2 bg-surface-2 px-1.5 py-0.5 ow-mono-micro text-text-mid uppercase">
              {node.data.layer}
            </span>
            <span className="rounded-sm border border-line-2 bg-surface-2 px-1.5 py-0.5 ow-mono-micro text-text-mid">
              {node.data.language}
            </span>
          </div>
        </div>

        <div className="rounded-md border border-line-1 bg-surface-1 p-3">
          <div className="flex items-center justify-between ow-mono-micro text-text-dim">
            <span>T-GNN RISK SCORE</span>
            <span
              className={cn(
                node.data.risk >= 0.7
                  ? "text-critical"
                  : node.data.risk >= 0.4
                    ? "text-warn"
                    : "text-signal",
              )}
            >
              {Math.round(node.data.risk * 100)}%
            </span>
          </div>
        </div>

        <div>
          <p className="ow-mono-micro text-text-dim">
            CONNECTIONS · {neighbors.length}
          </p>
          <div className="mt-2 space-y-1.5">
            {neighbors.map(({ node: nb, probabilistic }) => (
              <button
                key={nb.id}
                onClick={() => focusNodes([node.id, nb.id])}
                className="ow-panel flex w-full items-center justify-between p-2 text-left"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      probabilistic ? "bg-stale" : "bg-signal",
                    )}
                  />
                  <span className="ow-mono-data !text-[11px] text-text-hi">
                    {nb.data.label}
                  </span>
                </span>
                <span className="ow-mono-micro text-text-dim">
                  {probabilistic ? "CO-CHANGE" : "DIRECT"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {related.length > 0 && (
          <div>
            <p className="ow-mono-micro text-critical">
              WARNINGS ON THIS NODE · {related.length}
            </p>
            <div className="mt-2 space-y-1.5">
              {related.map((w) => (
                <div
                  key={w.id}
                  className="rounded-sm border border-critical-border bg-critical-soft p-2"
                >
                  <p className="ow-mono-data !text-[11px] text-text-hi">
                    {w.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 ow-mono-micro text-text-mid">
                    <ArrowUpRight className="size-3" /> {w.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
