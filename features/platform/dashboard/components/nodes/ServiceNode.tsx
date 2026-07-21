"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Database, Server, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "../../stores/dashboard-store";
import type { ServiceNode as ServiceNodeType } from "../../types";

const LAYER_ICON = {
  frontend: MonitorSmartphone,
  backend: Server,
  infra: Database,
} as const;

function riskColor(risk: number) {
  if (risk >= 0.7) return "critical";
  if (risk >= 0.4) return "warn";
  return "signal";
}

export function ServiceNode({ id, data }: NodeProps<ServiceNodeType>) {
  const selected = useDashboardStore((s) => s.selectedNodeId === id);
  const highlighted = useDashboardStore((s) =>
    s.highlightedNodeIds.includes(id),
  );
  const dimmed = useDashboardStore(
    (s) => s.highlightedNodeIds.length > 0 && !highlighted,
  );
  const Icon = LAYER_ICON[data.layer];
  const risk = riskColor(data.risk);

  return (
    <div
      className={cn(
        "relative w-[176px] rounded-md border bg-surface-2 px-3 py-2.5 transition-all",
        "border-line-2",
        selected && "border-signal shadow-[var(--ow-focus-halo)]",
        highlighted && "border-signal",
        dimmed && "opacity-35",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-1.5 !border-0 !bg-line-2"
      />

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-sm",
            risk === "critical" && "bg-critical-soft text-critical",
            risk === "warn" && "bg-warn-soft text-warn",
            risk === "signal" && "bg-signal-soft text-signal",
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <span className="flex-1 truncate font-mono text-[12px] text-text-hi">
          {data.label}
        </span>
        {data.tickets ? (
          <span className="rounded-sm border border-warn-border bg-warn-soft px-1 ow-mono-micro text-warn">
            {data.tickets}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="ow-mono-micro text-text-dim">{data.language}</span>
        <span className="flex items-center gap-1">
          <span
            className={cn(
              "size-1.5 rounded-full",
              risk === "critical" && "bg-critical",
              risk === "warn" && "bg-warn",
              risk === "signal" && "bg-signal",
            )}
          />
          <span className="ow-mono-micro text-text-lo">
            {Math.round(data.risk * 100)}%
          </span>
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-1.5 !border-0 !bg-line-2"
      />
    </div>
  );
}
