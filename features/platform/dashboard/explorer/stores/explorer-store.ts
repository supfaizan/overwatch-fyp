/* Explorer navigation state.
 *
 * The explorer is a drill-down: module → file → symbol, and sideways along
 * calls and imports. The trail is what makes that reversible, so a reader can
 * follow a call chain and come back without losing their place.
 *
 * Kept separate from `dashboard-store` because that one owns what the *diagram*
 * shows (selection, highlights, the flow cursor); this owns where the reader is
 * in the graph. */

import { create } from "zustand";

/** Bound on the trail, so a long exploration cannot grow without limit. */
const MAX_TRAIL = 25;

interface ExplorerState {
  /** Node ids from the entry point to where the reader is now. */
  trail: string[];
  searchTerm: string;
  /** The node being shown, or null when nothing has been opened yet. */
  currentNodeId: () => string | null;
  /** Open a node, starting a fresh trail. */
  open: (nodeId: string) => void;
  /** Open a node one level deeper, keeping the way back. */
  drillInto: (nodeId: string) => void;
  /** Step back one level; clears the trail when at the start. */
  back: () => void;
  /** Jump to an earlier point in the trail. */
  goTo: (index: number) => void;
  setSearchTerm: (term: string) => void;
  reset: () => void;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  trail: [],
  searchTerm: "",

  currentNodeId: () => get().trail.at(-1) ?? null,

  open: (nodeId) => set({ trail: [nodeId] }),

  drillInto: (nodeId) =>
    set((state) => {
      if (state.trail.at(-1) === nodeId) return state; // already there
      const existing = state.trail.indexOf(nodeId);
      // Revisiting a node already on the trail rewinds to it rather than
      // stacking a loop (a → b → a).
      if (existing !== -1) return { trail: state.trail.slice(0, existing + 1) };
      return { trail: [...state.trail, nodeId].slice(-MAX_TRAIL) };
    }),

  back: () => set((state) => ({ trail: state.trail.slice(0, -1) })),

  goTo: (index) =>
    set((state) => ({ trail: state.trail.slice(0, Math.max(index + 1, 0)) })),

  setSearchTerm: (searchTerm) => set({ searchTerm }),

  reset: () => set({ trail: [], searchTerm: "" }),
}));

/** The node currently being explored, as a reactive selector. */
export const useCurrentNodeId = () =>
  useExplorerStore((state) => state.trail.at(-1) ?? null);
