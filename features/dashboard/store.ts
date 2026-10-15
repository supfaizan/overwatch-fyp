import { create } from 'zustand';

/**
 * What the canvas shows. Only the selection lives here; the graph itself is server state in React
 * Query, keyed by this selection, so closing a folder is instant (that view is cached).
 */
type ViewState = {
  expanded: string[];
  /** folders drawn in full rather than paged (an overflow marker click) */
  revealed: string[];
  hovered: string | null;
  selected: string | null;
  /** nodes the chat is pointing at; anything drawn that holds one is lit */
  highlighted: string[];
  /** a node to select and pan to once the folders holding it are drawn (a chat reference click) */
  focusRequest: { nodeId: string; ancestors: string[] } | null;
  open: (nodeId: string) => void;
  /** also closes and un-reveals everything inside, or those ids would reopen with the parent */
  close: (nodeId: string) => void;
  reveal: (containerId: string) => void;
  /** take the set the server says is open, dropping ids whose parent turned out to be shut */
  adopt: (nodeIds: string[]) => void;
  hover: (nodeId: string | null) => void;
  select: (nodeId: string | null) => void;
  highlight: (nodeIds: string[]) => void;
  /** open what holds a node, then let the canvas select it, or the nearest folder it could draw */
  focus: (nodeId: string, ancestors: string[]) => void;
  settleFocus: (nodeId: string | null) => void;
  /** back to the closed view, for a repo none of these ids belong to */
  reset: () => void;
};

const sameIds = (left: string[], right: string[]) =>
  left.length === right.length && left.every((id, index) => id === right[index]);

/** Ids are path-derived, so containment is a prefix test at a separator (`repo:apiary` isn't inside `repo:api`). */
export function isInside(nodeId: string, containerId: string): boolean {
  if (nodeId === containerId) {
    return true;
  }
  const next = nodeId.charAt(containerId.length);
  return nodeId.startsWith(containerId) && (next === '/' || next === '#');
}

export const useViewStore = create<ViewState>((set) => ({
  expanded: [],
  revealed: [],
  hovered: null,
  selected: null,
  highlighted: [],
  focusRequest: null,
  open: (nodeId) =>
    set((
      state,
    ) => (state.expanded.includes(nodeId) ? state : { expanded: [...state.expanded, nodeId] })),
  close: (nodeId) =>
    set((state) => ({
      expanded: state.expanded.filter((id) => !isInside(id, nodeId)),
      revealed: state.revealed.filter((id) => !isInside(id, nodeId)),
    })),
  reveal: (containerId) =>
    set((
      state,
    ) => (state.revealed.includes(containerId)
      ? state
      : { revealed: [...state.revealed, containerId] })
    ),
  adopt: (nodeIds) =>
    set((state) => (sameIds(state.expanded, nodeIds) ? state : { expanded: nodeIds })),
  hover: (hovered) => set((state) => (state.hovered === hovered ? state : { hovered })),
  select: (selected) => set({ selected }),
  highlight: (highlighted) =>
    set((state) => (sameIds(state.highlighted, highlighted) ? state : { highlighted })),
  focus: (nodeId, ancestors) =>
    set((state) => ({
      expanded: [...state.expanded, ...ancestors.filter((id) => !state.expanded.includes(id))],
      focusRequest: { nodeId, ancestors },
    })),
  settleFocus: (selected) => set({ selected, focusRequest: null }),
  reset: () =>
    set({
      expanded: [],
      revealed: [],
      hovered: null,
      selected: null,
      highlighted: [],
      focusRequest: null,
    }),
}));
