"use client";

import { ChevronLeft, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNeighbours, useNodeDetail } from "../hooks";
import { containsHeading, describeNode, relationHeading } from "../lib/relations";
import { useExplorerStore } from "../stores/explorer-store";
import { NodeRow } from "./NodeRow";

interface NodeDetailProps {
  nodeId: string;
  onOpen: (nodeId: string) => void;
}

/** What a node is, what it contains, and what it connects to. */
export function NodeDetail({ nodeId, onOpen }: NodeDetailProps) {
  const detail = useNodeDetail(nodeId);
  const neighbours = useNeighbours(nodeId);
  const trail = useExplorerStore((state) => state.trail);
  const back = useExplorerStore((state) => state.back);

  if (detail.isLoading) {
    return (
      <p className="flex items-center gap-2 p-4 ow-mono-micro text-text-dim">
        <Loader2 className="size-3.5 animate-spin text-signal" /> LOADING NODE…
      </p>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="space-y-2 p-4">
        <p className="flex items-center gap-2 ow-mono-micro text-critical">
          <TriangleAlert className="size-3.5" /> NODE UNAVAILABLE
        </p>
        <p className="ow-body !text-[12px] text-text-mid">
          {detail.error instanceof Error
            ? detail.error.message
            : "It may have been removed by the latest index."}
        </p>
      </div>
    );
  }

  const node = detail.data;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
      {trail.length > 1 && (
        <button
          type="button"
          onClick={back}
          className="flex items-center gap-1 ow-mono-micro text-text-lo transition-colors hover:text-signal"
        >
          <ChevronLeft className="size-3" /> BACK
        </button>
      )}

      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 break-all font-mono text-[14px] text-text-hi">
            {node.name}
          </h2>
          <span className="shrink-0 rounded-sm border border-line-2 bg-surface-2 px-1.5 py-0.5 ow-mono-micro uppercase text-text-mid">
            {describeNode(node)}
          </span>
        </div>

        {node.signature && (
          <p className="break-all rounded-md border border-line-1 bg-ink-850 p-2 font-mono text-[11px] text-text-mid">
            {node.signature}
          </p>
        )}

        {node.docstring && (
          <p className="ow-body !text-[12px] text-text-mid">{node.docstring}</p>
        )}

        <dl className="flex flex-wrap gap-x-4 gap-y-1 ow-mono-micro text-text-dim">
          {node.path && (
            <div className="flex gap-1.5">
              <dt>PATH</dt>
              <dd className="text-text-lo">{node.path}</dd>
            </div>
          )}
          {node.startLine !== null && (
            <div className="flex gap-1.5">
              <dt>LINES</dt>
              <dd className="text-text-lo">
                {node.startLine}
                {node.endLine && node.endLine !== node.startLine ? `–${node.endLine}` : ""}
              </dd>
            </div>
          )}
          {node.language && (
            <div className="flex gap-1.5">
              <dt>LANG</dt>
              <dd className="text-text-lo">{node.language}</dd>
            </div>
          )}
        </dl>
      </header>

      {node.children.length > 0 && (
        <Section title={containsHeading(node.labels)} count={node.children.length}>
          {node.children.map((child) => (
            <NodeRow key={child.id} node={child} onOpen={onOpen} />
          ))}
        </Section>
      )}

      {neighbours.isLoading && (
        <p className="flex items-center gap-2 ow-mono-micro text-text-dim">
          <Loader2 className="size-3.5 animate-spin text-signal" /> LOADING RELATIONSHIPS…
        </p>
      )}

      {neighbours.groups.map((group) => (
        <Section
          key={`${group.type}:${group.direction}`}
          title={relationHeading(group)}
          count={group.nodes.length}
          muted={group.direction === "in"}
        >
          {group.nodes.map((neighbour) => (
            <NodeRow key={neighbour.id} node={neighbour} onOpen={onOpen} />
          ))}
        </Section>
      ))}

      {!neighbours.isLoading && neighbours.groups.length === 0 && (
        <p className="ow-mono-micro text-text-dim">
          NO RESOLVED RELATIONSHIPS
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  muted,
  children,
}: {
  title: string;
  count: number;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <h3
        className={cn(
          "flex items-center gap-2 ow-mono-micro",
          muted ? "text-text-dim" : "text-text-lo",
        )}
      >
        {title}
        <span className="text-text-dim">· {count}</span>
      </h3>
      {children}
    </section>
  );
}
