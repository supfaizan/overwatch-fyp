"use client";

import { Boxes, Braces, FileCode2, Globe, Package, Shapes } from "lucide-react";
import { cn } from "@/lib/utils";
import { describeNode } from "../lib/relations";
import type { GraphNodeSummary } from "../types";

const ICON_CLASS = "mt-0.5 size-3.5 shrink-0 text-signal";

/** What a node is, at a glance. Rendered as a component rather than picked
 *  into a variable, so nothing is constructed during render. */
function NodeIcon({ node }: { node: GraphNodeSummary }) {
  if (node.labels.includes("Route")) return <Globe className={ICON_CLASS} aria-hidden />;
  if (node.labels.includes("Package")) return <Package className={ICON_CLASS} aria-hidden />;
  if (node.labels.includes("File")) return <FileCode2 className={ICON_CLASS} aria-hidden />;
  if (node.labels.includes("Module")) return <Boxes className={ICON_CLASS} aria-hidden />;
  if (node.kind === "class" || node.kind === "interface") {
    return <Shapes className={ICON_CLASS} aria-hidden />;
  }
  return <Braces className={ICON_CLASS} aria-hidden />;
}

interface NodeRowProps {
  node: GraphNodeSummary;
  onOpen: (nodeId: string) => void;
  /** Extra detail on the right, e.g. a call count. */
  trailing?: string;
}

/** One clickable node in a list: search results, children, relationships. */
export function NodeRow({ node, onOpen, trailing }: NodeRowProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(node.id)}
      className={cn(
        "ow-panel flex w-full items-start gap-2.5 p-2 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <NodeIcon node={node} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-mono text-[12px] text-text-hi">
            {node.name}
          </span>
          <span className="shrink-0 ow-mono-micro text-text-dim">
            {describeNode(node)}
          </span>
        </span>
        {node.signature ? (
          <span className="mt-0.5 block truncate font-mono text-[10px] text-text-mid">
            {node.signature}
          </span>
        ) : node.path ? (
          <span className="mt-0.5 block truncate font-mono text-[10px] text-text-lo">
            {node.path}
          </span>
        ) : null}
      </span>
      {trailing && (
        <span className="shrink-0 ow-mono-micro text-text-dim">{trailing}</span>
      )}
    </button>
  );
}
