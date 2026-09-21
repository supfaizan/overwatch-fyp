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

/** One box on the canvas: what it is, what it holds, and the control that
 *  opens or shuts it.
 *
 *  An open folder stays on screen with its contents drawn beneath it, so the
 *  control that shuts it lives here rather than on each of its children. */
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
  // The root of the tree: always open, and there is nothing to shut it into.
  const isRoot = data.nodeLabel === "Repository";
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
        // An open folder is scaffolding for what is under it, so it sits back.
        data.expanded && "bg-surface-1",
        isRoot && "border-line-2 bg-surface-2",
      )}
    >
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="!size-1.5 !border-0 !bg-line-2"
        />
      )}

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
          <NodeGlyph
            label={data.nodeLabel}
            kind={data.kind}
            open={data.expanded}
            className="size-3.5"
          />
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

      {/* Shown on hover or focus so the resting canvas stays quiet, but
          always reachable from the keyboard. An open folder keeps its control
          visible: it is the way back out. */}
      <div
        className={cn(
          "absolute -right-2 -top-2 flex gap-1 transition-opacity",
          "group-hover:opacity-100 focus-within:opacity-100",
          data.expanded ? "opacity-100" : "opacity-0",
        )}
      >
        {isRoot ? null : data.expanded ? (
          <LevelButton title="Close this folder" onClick={() => close(id)}>
            <ChevronUp className="size-3" aria-hidden />
          </LevelButton>
        ) : (
          data.expandable && (
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
          )
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
