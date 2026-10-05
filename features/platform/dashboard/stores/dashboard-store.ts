/* Feature-local UI state for the dashboard: which node is selected, which nodes
   are spotlighted (by chat answers), the flow walkthrough, and the active side
   panel — all of it about one repository, named by `repo`. */

import { create } from "zustand";
import type { FlowMark, ProjectableStep } from "../graph/lib/flow";
import type { FlowResult } from "../types";

export type DashboardPanel = "chat" | "flow" | "explorer" | "coverage";

/** What the canvas draws: the repository map, or a walkthrough on its own.
 *  The flow view never touches the map's state, so leaving it returns the
 *  map exactly as it was. */
export type CanvasMode = "map" | "flow";

const NO_MARKS: Record<string, FlowMark> = {};
const NO_SPOTLIGHT_MARKS: Record<string, true> = {};
const NO_SPOTLIGHT: ProjectableStep[] = [];

interface DashboardState {
  /** The repository the rest of this state describes. */
  repo: string | null;
  selectedNodeId: string | null;
  /** Nodes to light on the map — a chat answer's references, or a clicked
   *  node. Exact nodes with their containers, so each lights whatever box
   *  stands for it at the current level of detail. */
  spotlight: ProjectableStep[];
  /** The boxes `spotlight` lights in the current view, derived by the map
   *  (which alone knows what is drawn) so each card reads only its own. */
  spotlightMarks: Record<string, true>;
  /** The walkthrough from POST /query/flow; null when there is none. */
  flow: FlowResult | null;
  /** Index into `flow.steps` of the step being shown. */
  flowCursor: number;
  flowPlaying: boolean;
  /** Which canvas box shows which steps. Derived by the canvas, which alone
   *  knows what is drawn; kept here so each card subscribes to its own mark
   *  and only the boxes on the path re-render as the walkthrough moves. */
  flowMarks: Record<string, FlowMark>;
  canvas: CanvasMode;
  /** A node the map was asked to bring into view ("Show in map"); the map
   *  focuses whatever box stands for it once drawn, then clears this. */
  mapFocus: ProjectableStep | null;
  panel: DashboardPanel;
  setPanel: (panel: DashboardPanel) => void;
  selectNode: (id: string | null) => void;
  setSpotlight: (nodes: ProjectableStep[]) => void;
  setSpotlightMarks: (marks: Record<string, true>) => void;
  /** Spotlight a set of nodes and surface them (used by chat + inspector). */
  focusNodes: (ids: string[]) => void;
  startFlow: (flow: FlowResult) => void;
  setFlowCursor: (cursor: number) => void;
  setFlowPlaying: (playing: boolean) => void;
  setFlowMarks: (marks: Record<string, FlowMark>) => void;
  setCanvas: (canvas: CanvasMode) => void;
  /** Switch to the map, lit and centred on one node. */
  showOnMap: (node: ProjectableStep) => void;
  /** Switch to the map at one step of the walkthrough. */
  showStepOnMap: (index: number, step: ProjectableStep) => void;
  clearMapFocus: () => void;
  clearFlow: () => void;
  /** Drop everything that described the previous repository. The open panel
   *  is a preference, not repository state, so it is kept. */
  resetFor: (repo: string | null) => void;
}

const NO_FLOW = {
  flow: null,
  flowCursor: 0,
  flowPlaying: false,
  flowMarks: NO_MARKS,
  canvas: "map" as CanvasMode,
  mapFocus: null,
};

export const useDashboardStore = create<DashboardState>((set) => ({
  repo: null,
  selectedNodeId: null,
  spotlight: NO_SPOTLIGHT,
  spotlightMarks: NO_SPOTLIGHT_MARKS,
  ...NO_FLOW,
  panel: "chat",
  setPanel: (panel) => set({ panel }),
  // Picking a node opens it in the explorer, which is where its files,
  // definitions and relationships live. Clearing the selection leaves the
  // reader on whatever panel they were using.
  selectNode: (selectedNodeId) =>
    set((state) => ({
      selectedNodeId,
      panel: selectedNodeId ? "explorer" : state.panel,
    })),
  setSpotlight: (spotlight) => set({ spotlight }),
  setSpotlightMarks: (spotlightMarks) => set({ spotlightMarks }),
  focusNodes: (ids) =>
    set({
      spotlight: ids.map((nodeId) => ({ nodeId, containers: [] })),
      selectedNodeId: ids[0] ?? null,
    }),
  // The path lights itself; a chat answer's spotlight would compete with it.
  startFlow: (flow) =>
    set({
      flow,
      flowCursor: 0,
      flowPlaying: flow.steps.length > 1,
      spotlight: NO_SPOTLIGHT,
      canvas: "flow",
      mapFocus: null,
    }),
  setFlowCursor: (flowCursor) => set({ flowCursor }),
  setFlowPlaying: (flowPlaying) => set({ flowPlaying }),
  setFlowMarks: (flowMarks) => set({ flowMarks }),
  setCanvas: (canvas) => set({ canvas }),
  showOnMap: (node) => set({ canvas: "map", spotlight: [node], mapFocus: node }),
  showStepOnMap: (index, step) =>
    set({ canvas: "map", flowCursor: index, flowPlaying: false, mapFocus: step }),
  clearMapFocus: () => set({ mapFocus: null }),
  clearFlow: () => set(NO_FLOW),
  resetFor: (repo) =>
    set({ repo, selectedNodeId: null, spotlight: NO_SPOTLIGHT, ...NO_FLOW }),
}));
