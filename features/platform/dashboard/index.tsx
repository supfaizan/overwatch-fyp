"use client";

import { Compass, Gauge, MessageSquare, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlowPlayback, useScopeToActiveRepo } from "./hooks";
import { useDashboardStore, type DashboardPanel } from "./stores/dashboard-store";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { FlowCanvas } from "./components/FlowCanvas";
import { ChatPanel } from "./components/ChatPanel";
import { FlowPanel } from "./components/FlowPanel";
import { CoveragePanel } from "./explorer/components/CoveragePanel";
import { ExplorerPanel } from "./explorer/components/ExplorerPanel";

// The contract-checker (WarningsPanel) tab is deliberately absent — it is out
// of eval-1 scope. The component stays in the tree for a later eval.
const TABS: { id: DashboardPanel; label: string; icon: typeof MessageSquare }[] =
  [
    { id: "chat", label: "CHAT", icon: MessageSquare },
    { id: "flow", label: "FLOW", icon: Route },
    { id: "explorer", label: "EXPLORE", icon: Compass },
    { id: "coverage", label: "COVERAGE", icon: Gauge },
  ];

export function Dashboard() {
  const panel = useDashboardStore((s) => s.panel);
  const setPanel = useDashboardStore((s) => s.setPanel);
  const flow = useDashboardStore((s) => s.flow);
  const showFlow = useDashboardStore((s) => s.canvas === "flow") && flow !== null;
  useScopeToActiveRepo();
  useFlowPlayback();

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* graph canvas */}
      <section className="relative min-w-0 flex-1 border-r border-line-1">
        {/* The map stays mounted under the flow view, so returning to it
            keeps its viewport, open folders and filters exactly as left. */}
        <div className={cn("h-full", showFlow && "hidden")}>
          <DiagramCanvas />
        </div>
        {showFlow && flow && <FlowCanvas flow={flow} />}
      </section>

      {/* side console */}
      <aside className="flex w-[380px] shrink-0 flex-col overflow-hidden bg-ink-900">
        <div role="tablist" aria-label="Dashboard panels" className="flex shrink-0 border-b border-line-1">
          {TABS.map((t) => {
            const active = panel === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`dashboard-tab-${t.id}`}
                aria-selected={active}
                aria-controls="dashboard-panel"
                onClick={() => setPanel(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 border-b-2 py-3 ow-micro transition-colors",
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

        <div
          role="tabpanel"
          id="dashboard-panel"
          aria-labelledby={`dashboard-tab-${panel}`}
          className="min-h-0 flex-1"
        >
          {panel === "chat" && <ChatPanel />}
          {panel === "flow" && <FlowPanel />}
          {panel === "explorer" && <ExplorerPanel />}
          {panel === "coverage" && <CoveragePanel />}
        </div>
      </aside>
    </div>
  );
}
