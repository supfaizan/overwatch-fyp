/* What the canvas is currently showing: which containers are open, and which
   kinds of node and relationship may be drawn.
 *
 * Only the *selection* lives here. The graph itself is server state and lives
 * in TanStack Query, keyed by this selection — which is what makes closing a
 * folder instant: that view is already in the cache.
 *
 * `expandTo` is deliberately absent. "Open everything down to files" is an
 * action, not a setting: it resolves to a concrete set of open containers,
 * which is then what you can close again one at a time. */

import { create } from "zustand";
import type { ViewEdgeType, ViewNodeLabel, ViewQuery } from "../types";

interface ViewState {
  expanded: string[];
  /** Folders drawn in full rather than paged — what "+6 more" adds to. */
  revealed: string[];
  /** null means no filter — whatever the server allows. */
  nodeLabels: ViewNodeLabel[] | null;
  edgeTypes: ViewEdgeType[] | null;

  /** The node the pointer is over. Focus follows it, so connections can be
   *  read without committing to a selection. */
  hovered: string | null;

  hover: (nodeId: string | null) => void;
  open: (nodeId: string) => void;
  close: (nodeId: string) => void;
  closeAll: () => void;
  reveal: (containerId: string) => void;
  /** Adopt the set the server says is actually open, dropping any id whose
   *  parent turned out to be shut. */
  adopt: (nodeIds: string[]) => void;
  toggleNodeLabel: (label: ViewNodeLabel, available: ViewNodeLabel[]) => void;
  toggleEdgeType: (type: ViewEdgeType, available: ViewEdgeType[]) => void;
  clearFilters: () => void;
}

/** Toggling within a fixed vocabulary: `null` (no filter) behaves as "all
 *  selected", and deselecting the last item is treated as clearing the filter
 *  rather than asking for an empty canvas. */
function toggleWithin<T extends string>(
  current: T[] | null,
  value: T,
  available: T[],
): T[] | null {
  const selected = new Set(current ?? available);
  if (selected.has(value)) {
    selected.delete(value);
  } else {
    selected.add(value);
  }
  if (selected.size === 0 || selected.size === available.length) return null;
  return available.filter((item) => selected.has(item));
}

const sameIds = (left: string[], right: string[]) =>
  left.length === right.length && left.every((id, index) => id === right[index]);

export const useViewStore = create<ViewState>((set) => ({
  expanded: [],
  revealed: [],
  nodeLabels: null,
  edgeTypes: null,
  hovered: null,

  hover: (hovered) => set((state) => (state.hovered === hovered ? state : { hovered })),

  open: (nodeId) =>
    set((state) =>
      state.expanded.includes(nodeId)
        ? state
        : { expanded: [...state.expanded, nodeId] },
    ),

  // Closing a container also closes — and un-reveals — everything that was
  // open inside it. Otherwise those ids linger and silently take effect the
  // next time its parent is opened.
  close: (nodeId) =>
    set((state) => ({
      expanded: state.expanded.filter((id) => !isInside(id, nodeId)),
      revealed: state.revealed.filter((id) => !isInside(id, nodeId)),
    })),

  closeAll: () => set({ expanded: [], revealed: [] }),

  reveal: (containerId) =>
    set((state) =>
      state.revealed.includes(containerId)
        ? state
        : { revealed: [...state.revealed, containerId] },
    ),

  adopt: (nodeIds) =>
    set((state) =>
      sameIds(state.expanded, nodeIds) ? state : { expanded: nodeIds },
    ),

  toggleNodeLabel: (label, available) =>
    set((state) => ({
      nodeLabels: toggleWithin(state.nodeLabels, label, available),
    })),

  toggleEdgeType: (type, available) =>
    set((state) => ({
      edgeTypes: toggleWithin(state.edgeTypes, type, available),
    })),

  clearFilters: () => set({ nodeLabels: null, edgeTypes: null }),
}));

/** Whether one node id is a container or lies inside it.
 *
 * Ids are path-derived, so this is a prefix test — but only at a separator,
 * or `repo:apiary` would count as being inside `repo:api`. The server is the
 * authority on containment; this only prunes ids the server would drop
 * anyway, which saves a round trip. */
function isInside(nodeId: string, containerId: string): boolean {
  if (nodeId === containerId) return true;
  if (!nodeId.startsWith(containerId)) return false;
  const next = nodeId.charAt(containerId.length);
  return next === "/" || next === "#";
}

export { isInside };

/** The selection, as the query layer wants it.
 *
 * `expandTo` / `expandFrom` are absent: opening to a level is an action that
 * resolves to concrete open folders, not a setting that is re-sent. */
export function useViewQuery(): ViewQuery {
  const expanded = useViewStore((state) => state.expanded);
  const revealed = useViewStore((state) => state.revealed);
  const nodeLabels = useViewStore((state) => state.nodeLabels);
  const edgeTypes = useViewStore((state) => state.edgeTypes);
  return {
    expanded,
    revealed,
    expandTo: null,
    expandFrom: null,
    nodeLabels,
    edgeTypes,
  };
}
