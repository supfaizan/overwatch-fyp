"use client";

import { AlertTriangle, Info, ShieldAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useWarnings } from "../hooks";
import { useDashboardStore } from "../stores/dashboard-store";
import type { ContractWarning } from "../types";
import type { Priority } from "@/types";

const PRIORITY_META: Record<
  Priority,
  { icon: typeof AlertTriangle; cls: string; soft: string; border: string }
> = {
  critical: {
    icon: ShieldAlert,
    cls: "text-critical",
    soft: "bg-critical-soft",
    border: "border-critical-border",
  },
  warning: {
    icon: AlertTriangle,
    cls: "text-warn",
    soft: "bg-warn-soft",
    border: "border-warn-border",
  },
  informational: {
    icon: Info,
    cls: "text-text-lo",
    soft: "bg-surface-2",
    border: "border-line-2",
  },
};

function WarningCard({ warning }: { warning: ContractWarning }) {
  const focusNodes = useDashboardStore((s) => s.focusNodes);
  const meta = PRIORITY_META[warning.priority];
  const Icon = meta.icon;

  return (
    <button
      onClick={() => focusNodes(warning.nodeIds)}
      className={cn(
        "ow-panel block w-full p-3 text-left",
        warning.priority === "critical" && "border-critical-border",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 ow-mono-micro", meta.cls)}>
          <Icon className="size-3.5" />
          {warning.priority.toUpperCase()}
        </span>
        <span className="ow-mono-micro text-text-dim">{warning.createdAt}</span>
      </div>

      <p className="mt-2 ow-body !text-[13px] font-semibold text-text-hi">
        {warning.title}
      </p>

      <div className="mt-2 space-y-0.5 ow-mono-data !text-[11px] text-text-mid">
        <p className="truncate">
          <span className="text-text-dim">src</span> {warning.source}
        </p>
        <p className="truncate">
          <span className="text-text-dim">dst</span> {warning.target}
        </p>
      </div>

      <p
        className={cn(
          "mt-2 rounded-sm border p-2 ow-mono-data !text-[11px] leading-relaxed text-text-mid",
          meta.soft,
          meta.border,
        )}
      >
        {warning.risk}
      </p>

      <div className="mt-3">
        <div className="flex items-center justify-between ow-mono-micro text-text-dim">
          <span>T-GNN CONFIDENCE</span>
          <span className="text-signal">{warning.tgnnConfidence}%</span>
        </div>
        <Progress
          value={warning.tgnnConfidence}
          className="mt-1.5 h-1 bg-surface-3"
        />
      </div>

      <p className="mt-3 ow-mono-micro text-signal">
        › {warning.suggestion}
      </p>
    </button>
  );
}

export function WarningsPanel() {
  const { data, isLoading } = useWarnings();

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line-1 px-4 py-3">
        <span className="ow-mono-micro text-text-mid">
          CONTRACT WARNINGS
        </span>
        {data ? (
          <span className="rounded-sm border border-critical-border bg-critical-soft px-1.5 py-0.5 ow-mono-micro text-critical">
            {data.filter((w) => w.priority === "critical").length} CRITICAL
          </span>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 ow-mono-micro text-text-dim">
              <Loader2 className="size-4 animate-spin" /> SCANNING PUSHES…
            </div>
          ) : (
            data?.map((w) => <WarningCard key={w.id} warning={w} />)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
