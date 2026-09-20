"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "../../stores/dashboard-store";
import { useViewOptions } from "../hooks";
import { describeContents, describeNode, isWithin } from "../lib/appearance";
import { useViewStore } from "../stores/view-store";
import type { ViewFlowNode } from "../types";
import { NodeGlyph } from "./NodeGlyph";

/** Every graph id but the repository's own carries a colon, so this says
 *  whether a node came out of a container that can be closed again — as
 *  opposed to sitting at the top level, where there is nothing above it. */
const isClosable = (parentId: string | null) =>
  Boolean(parentId && parentId.includes(":"));

/** One box on the canvas: what it is, what it holds, and the two controls
 *  that move between levels. */
export function GraphNodeCard({ id, data }: NodeProps<ViewFlowNode>) {
  const open = useViewStore((state) => state.open);
  const close = useViewStore((state) => state.close);
  const { data: options } = useViewOptions();

  const selected = useDashboardStore((state) => state.selectedNodeId === id);
  const highlighted = useDashboardStore((state) =>
    state.highlightedNodeIds.some((target) => isWithin(id, target)),
  );
  // How far a node recedes is decided on the canvas, which is the only place
  // that knows what the focused node is connected to. The card only styles
  // itself.
  const focused = useViewStore((state) => state.hovered === id);
  const stepIndex = useDashboardStore((state) => state.flowStepIds.indexOf(id));
  const isActiveStep = useDashboardStore(
    (state) => state.flowStepIds[state.flowCursor] === id,
  );

  const outside = data.kind === "external";
  const contents = describeContents(data);
  // Say what a click costs before it is made. Past one page the rest arrives
  // behind a marker rather than all at once, and the control says so.
  const overflows = Boolean(options && data.childCount > options.pageSize);

  return (
    <div
      className={cn(
        "group relative w-[184px] rounded-md border bg-surface-2 px-3 py-2.5 transition-all",
        "border-line-2",
        outside && "border-dashed",
        (selected || highlighted || isActiveStep || focused) && "border-signal",
        (selected || isActiveStep || focused) && "shadow-[var(--ow-focus-halo)]",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-1.5 !border-0 !bg-line-2"
      />

      {stepIndex !== -1 && (
        <span
          className={cn(
            "absolute -left-2 -top-2 flex size-5 items-center justify-center rounded-full border ow-mono-micro",
            isActiveStep
              ? "border-signal bg-signal text-ink-900"
              : "border-line-2 bg-surface-3 text-text-lo",
          )}
        >
          {stepIndex + 1}
        </span>
      )}

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-sm",
            outside ? "bg-surface-3 text-text-lo" : "bg-signal-soft text-signal",
          )}
        >
          <NodeGlyph label={data.nodeLabel} kind={data.kind} className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-text-hi">
          {data.label}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="ow-mono-micro truncate text-text-dim">
          {describeNode(data.nodeLabel, data.kind)}
        </span>
        {contents && (
          <span className="ow-mono-micro shrink-0 text-text-lo">{contents}</span>
        )}
      </div>

      {/* Level controls. Shown on hover or focus so the resting canvas stays
          quiet, but always reachable from the keyboard. */}
      <div
        className={cn(
          "absolute -right-2 -top-2 flex gap-1 opacity-0 transition-opacity",
          "group-hover:opacity-100 focus-within:opacity-100",
        )}
      >
        {isClosable(data.parentId) && (
          <LevelButton
            title="Close the folder this came out of"
            onClick={() => close(data.parentId!)}
          >
            <ChevronUp className="size-3" aria-hidden />
          </LevelButton>
        )}
        {data.expandable && (
          <LevelButton
            title={
              overflows
                ? `Open — ${data.childCount} inside, ${options!.pageSize} drawn first`
                : `Open — ${data.childCount} inside`
            }
            onClick={() => open(id)}
            emphasis={overflows ? "heavy" : "normal"}
          >
            <ChevronDown className="size-3" aria-hidden />
            <span className="ow-mono-micro">{data.childCount}</span>
          </LevelButton>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-1.5 !border-0 !bg-line-2"
      />
    </div>
  );
}

function LevelButton({
  title,
  onClick,
  children,
  emphasis = "normal",
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  /** "heavy" warns that the click costs more than one page. */
  emphasis?: "normal" | "heavy";
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      // The canvas would otherwise read the click as "select this node".
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-5 items-center gap-0.5 rounded-sm border px-1",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        emphasis === "heavy"
          ? "border-warn-border bg-warn-soft text-warn hover:border-warn"
          : "border-line-2 bg-surface-3 text-text-mid hover:border-signal hover:text-signal",
      )}
    >
      {children}
    </button>
  );
}
