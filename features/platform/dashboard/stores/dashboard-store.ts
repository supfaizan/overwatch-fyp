/* Feature-local UI state for the dashboard: which node is selected, which nodes
   are spotlighted (by chat answers or warnings), and the active side panel. */

import { create } from "zustand";

export type DashboardPanel = "warnings" | "explorer" | "inspector";

interface DashboardState {
  selectedNodeId: string | null;
  highlightedNodeIds: string[];
  panel: DashboardPanel;
  setPanel: (panel: DashboardPanel) => void;
  selectNode: (id: string | null) => void;
  setHighlighted: (ids: string[]) => void;
  /** Spotlight a set of nodes and surface them (used by chat + warnings). */
  focusNodes: (ids: string[]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedNodeId: null,
  highlightedNodeIds: [],
  panel: "warnings",
  setPanel: (panel) => set({ panel }),
  selectNode: (selectedNodeId) =>
    set({ selectedNodeId, panel: selectedNodeId ? "inspector" : "warnings" }),
  setHighlighted: (highlightedNodeIds) => set({ highlightedNodeIds }),
  focusNodes: (ids) =>
    set({ highlightedNodeIds: ids, selectedNodeId: ids[0] ?? null }),
}));
