/* Feature-local UI state for the dashboard: which node is selected, which nodes
   are spotlighted (by chat answers), the flow-walkthrough cursor, and the
   active side panel. */

import { create } from "zustand";

export type DashboardPanel = "chat" | "inspector" | "flow";

interface DashboardState {
  selectedNodeId: string | null;
  highlightedNodeIds: string[];
  /** Ordered node ids returned by POST /query/flow; empty when no walkthrough. */
  flowStepIds: string[];
  /** Index into `flowStepIds` of the step currently being played. */
  flowCursor: number;
  panel: DashboardPanel;
  setPanel: (panel: DashboardPanel) => void;
  selectNode: (id: string | null) => void;
  setHighlighted: (ids: string[]) => void;
  /** Spotlight a set of nodes and surface them (used by chat + inspector). */
  focusNodes: (ids: string[]) => void;
  startFlow: (ids: string[]) => void;
  setFlowCursor: (cursor: number) => void;
  clearFlow: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedNodeId: null,
  highlightedNodeIds: [],
  flowStepIds: [],
  flowCursor: 0,
  panel: "chat",
  setPanel: (panel) => set({ panel }),
  selectNode: (selectedNodeId) =>
    set({ selectedNodeId, panel: selectedNodeId ? "inspector" : "chat" }),
  setHighlighted: (highlightedNodeIds) => set({ highlightedNodeIds }),
  focusNodes: (ids) =>
    set({ highlightedNodeIds: ids, selectedNodeId: ids[0] ?? null }),
  startFlow: (ids) =>
    set({ flowStepIds: ids, flowCursor: 0, highlightedNodeIds: ids }),
  setFlowCursor: (flowCursor) => set({ flowCursor }),
  clearFlow: () =>
    set({ flowStepIds: [], flowCursor: 0, highlightedNodeIds: [] }),
}));
