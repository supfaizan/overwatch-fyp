"use client";

import { MessageSquare, Boxes, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore, type DashboardPanel } from "./stores/dashboard-store";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { ChatPanel } from "./components/ChatPanel";
import { FlowPanel } from "./components/FlowPanel";
import { NodeInspector } from "./components/NodeInspector";

// The contract-checker (WarningsPanel) tab is deliberately absent — it is out
// of eval-1 scope. The component stays in the tree for a later eval.
const TABS: { id: DashboardPanel; label: string; icon: typeof MessageSquare }[] =
  [
    { id: "chat", label: "CHAT", icon: MessageSquare },
    { id: "flow", label: "FLOW", icon: Route },
    { id: "inspector", label: "INSPECT", icon: Boxes },
  ];

export function Dashboard() {
  const panel = useDashboardStore((s) => s.panel);
  const setPanel = useDashboardStore((s) => s.setPanel);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* graph canvas */}
      <section className="relative min-w-0 flex-1 border-r border-line-1">
        <DiagramCanvas />
      </section>

      {/* side console */}
      <aside className="flex w-[380px] shrink-0 flex-col overflow-hidden bg-ink-900">
        <div className="flex shrink-0 border-b border-line-1">
          {TABS.map((t) => {
            const active = panel === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setPanel(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 ow-mono-micro transition-colors",
                  active
                    ? "border-signal text-signal"
                    : "border-transparent text-text-lo hover:text-text-hi",
                )}
              >
                <Icon className="size-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1">
          {panel === "chat" && <ChatPanel />}
          {panel === "flow" && <FlowPanel />}
          {panel === "inspector" && <NodeInspector />}
        </div>
      </aside>
    </div>
  );
}
