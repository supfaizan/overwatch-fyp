"use client";

import { createContext, useContext } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { MapPin, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "../../stores/dashboard-store";
import type { FlowStep } from "../../types";
import { STEP_HEIGHT, STEP_WIDTH } from "../lib/flow-layout";
import { NodeGlyph } from "./NodeGlyph";
import type { ViewNodeLabel } from "../types";

export type FlowStepData = { step: FlowStep; index: number };
export type FlowStepFlowNode = Node<FlowStepData, "flowStep">;

/** What a step card can ask the flow view to do. Supplied once by the canvas
 *  rather than threaded through each node's data, so node objects stay
 *  stable and the cards never re-render for a new callback. */
export const FlowStepActions = createContext<{ showInMap: (index: number) => void }>({
  showInMap: () => undefined,
});

/** One step of a walkthrough: what it is, where it lives, and its number. */
export function FlowStepNode({ data }: NodeProps<FlowStepFlowNode>) {
  const { step, index } = data;
  const { showInMap } = useContext(FlowStepActions);
  // Each card reads only whether it is the active one, so moving the cursor
  // re-renders two cards, not the whole flow.
  const isActive = useDashboardStore((state) => state.flowCursor === index);
  const isPast = useDashboardStore((state) => state.flowCursor > index);
  const fileName = step.path?.split("/").at(-1);

  return (
    <div
      style={{ width: STEP_WIDTH, height: STEP_HEIGHT }}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md border bg-surface-2 px-3 transition-all",
        isActive ? "border-signal shadow-[var(--ow-focus-halo)]" : "border-line-2",
        !isActive && !isPast && "opacity-80",
      )}
    >
      <Handle type="target" position={Position.Top} className="!size-1.5 !border-0 !bg-line-2" />

      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border ow-micro",
          isActive
            ? "border-signal bg-signal text-signal-ink"
            : isPast
              ? "border-signal-border text-signal"
              : "border-line-2 text-text-dim",
        )}
      >
        {index + 1}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <NodeGlyph
            label={(step.label ?? "Symbol") as ViewNodeLabel}
            kind={step.kind}
            className="size-3 shrink-0 text-text-lo"
          />
          <span className="truncate font-mono text-[12px] text-text-hi" title={step.name}>
            {step.name}
          </span>
        </span>
        <span className="mt-0.5 block truncate ow-micro text-text-dim" title={step.path ?? undefined}>
          {fileName ?? step.kind ?? step.label?.toLowerCase()}
        </span>
      </span>

      {step.unresolved.length > 0 && (
        <span title={`Could not follow: ${step.unresolved.join(", ")}`} className="shrink-0">
          <TriangleAlert className="size-3 text-warn" aria-label="Some calls here could not be followed" />
        </span>
      )}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation(); // not a click on the step itself
          showInMap(index);
        }}
        aria-label={`Show ${step.name} in the map`}
        title="Show in the map"
        className="nodrag shrink-0 rounded-sm p-0.5 text-text-dim transition-colors hover:text-signal"
      >
        <MapPin className="size-3.5" />
      </button>

      <Handle type="source" position={Position.Bottom} className="!size-1.5 !border-0 !bg-line-2" />
    </div>
  );
}
