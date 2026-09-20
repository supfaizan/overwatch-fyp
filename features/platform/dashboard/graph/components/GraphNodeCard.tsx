"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "../../stores/dashboard-store";
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

  const selected = useDashboardStore((state) => state.selectedNodeId === id);
  const highlighted = useDashboardStore((state) =>
    state.highlightedNodeIds.some((target) => isWithin(id, target)),
  );
  const dimmed = useDashboardStore(
    (state) => state.highlightedNodeIds.length > 0 && !highlighted,
  );
  const stepIndex = useDashboardStore((state) => state.flowStepIds.indexOf(id));
  const isActiveStep = useDashboardStore(
    (state) => state.flowStepIds[state.flowCursor] === id,
  );

  const outside = data.kind === "external";
  const contents = describeContents(data);

  return (
    <div
      className={cn(
        "group relative w-[184px] rounded-md border bg-surface-2 px-3 py-2.5 transition-all",
        "border-line-2",
        outside && "border-dashed",
        (selected || highlighted || isActiveStep) && "border-signal",
        (selected || isActiveStep) && "shadow-[var(--ow-focus-halo)]",
        dimmed && "opacity-35",
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
            title={`Open — ${data.childCount} inside`}
            onClick={() => open(id)}
          >
            <ChevronDown className="size-3" aria-hidden />
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
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
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
        "flex size-5 items-center justify-center rounded-sm border border-line-2",
        "bg-surface-3 text-text-mid transition-colors hover:border-signal hover:text-signal",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {children}
    </button>
  );
}
