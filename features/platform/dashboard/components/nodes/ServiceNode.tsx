"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Package, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "../../stores/dashboard-store";
import type { ServiceNode as ServiceNodeType } from "../../types";

const KIND_ICON = {
  module: Boxes,
  external: Package,
} as const;

export function ServiceNode({ id, data }: NodeProps<ServiceNodeType>) {
  const selected = useDashboardStore((s) => s.selectedNodeId === id);
  const highlighted = useDashboardStore((s) =>
    s.highlightedNodeIds.includes(id),
  );
  const dimmed = useDashboardStore(
    (s) => s.highlightedNodeIds.length > 0 && !highlighted,
  );
  const stepIndex = useDashboardStore((s) => s.flowStepIds.indexOf(id));
  const isFlowStep = stepIndex !== -1;
  const isActiveStep = useDashboardStore(
    (s) => s.flowStepIds[s.flowCursor] === id,
  );

  const Icon = KIND_ICON[data.kind];
  const external = data.kind === "external";

  return (
    <div
      className={cn(
        "relative w-[176px] rounded-md border bg-surface-2 px-3 py-2.5 transition-all",
        "border-line-2",
        external && "border-dashed",
        selected && "border-signal shadow-[var(--ow-focus-halo)]",
        highlighted && "border-signal",
        isActiveStep && "border-signal shadow-[var(--ow-focus-halo)]",
        dimmed && "opacity-35",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-1.5 !border-0 !bg-line-2"
      />

      {isFlowStep && (
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
            "flex size-6 items-center justify-center rounded-sm",
            external
              ? "bg-surface-3 text-text-lo"
              : "bg-signal-soft text-signal",
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <span className="flex-1 truncate font-mono text-[12px] text-text-hi">
          {data.label}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="ow-mono-micro text-text-dim">
          {external ? "EXTERNAL" : `${data.fileCount} FILES`}
        </span>
        {!external && (
          <span className="ow-mono-micro text-text-lo">
            {data.definitionCount} DEFS
          </span>
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
