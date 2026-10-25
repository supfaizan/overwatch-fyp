import { create } from 'zustand';
import { foldersToOpen } from './lib/walkthrough';

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
  /**
   * a node to select and pan to once the folders holding it are drawn (a chat reference click);
   * `follow` pans only if it's out of view, keeping the zoom (a walkthrough step)
   */
  focusRequest: { nodeId: string; ancestors: string[]; follow?: boolean } | null;
  /** a walkthrough being shown: its steps, the one on screen, and whether it's moving on by itself */
  walk: Walk | null;
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
  /**
   * Show a walkthrough of the answer `answerId`: from its first step, playing if there's more than
   * one, or paused at `cursor` (a step picked before the walkthrough was showing).
   */
  startWalk: (steps: WalkStep[], maxOpen: number, answerId: string, cursor?: number) => void;
  goTo: (cursor: number, playing?: boolean) => void;
  /** playing again from the last step starts over */
  setPlaying: (playing: boolean) => void;
  endWalk: () => void;
  /** back to the closed view, for a repo none of these ids belong to */
  reset: () => void;
};

/** A step of a walkthrough and the folders holding it, outermost first. */
type WalkStep = { nodeId: string; ancestors: string[] };

type Walk = {
  steps: WalkStep[];
  cursor: number;
  playing: boolean;
  /** the most folders the backend will open at once */
  maxOpen: number;
  /** the chat answer it walks through, so the chat can light the step being shown */
  answerId: string;
};

/** Move a walkthrough to a step: open what holds it (within the cap) and pan there. */
const walkTo = (state: ViewState, walk: Walk, cursor: number, playing: boolean) => {
  const step = walk.steps[cursor];
  return {
    walk: { ...walk, cursor, playing },
    expanded: [...state.expanded, ...foldersToOpen(state.expanded, step.ancestors, walk.maxOpen)],
    focusRequest: { nodeId: step.nodeId, ancestors: step.ancestors, follow: true },
  };
};

/** Anything the user does on the diagram pauses a walkthrough, so it doesn't pull the view away. */
const paused = (walk: Walk | null) => {
  return walk && { ...walk, playing: false };
};

const sameIds = (left: string[], right: string[]) => {
  return left.length === right.length && left.every((id, index) => {
    return id === right[index];
  });
};

/** Ids are path-derived, so containment is a prefix test at a separator (`repo:apiary` isn't inside `repo:api`). */
export function isInside(nodeId: string, containerId: string): boolean {
  if (nodeId === containerId) {
    return true;
  }
  const next = nodeId.charAt(containerId.length);
  return nodeId.startsWith(containerId) && (next === '/' || next === '#');
}

export const useViewStore = create<ViewState>((set) => {
  return {
    expanded: [],
    revealed: [],
    hovered: null,
    selected: null,
    highlighted: [],
    focusRequest: null,
    walk: null,
    open: (nodeId) => {
      return set((
        state,
      ) => {
        return (state.expanded.includes(nodeId)
          ? state
          : { expanded: [...state.expanded, nodeId], walk: paused(state.walk) });
      });
    },
    close: (nodeId) => {
      return set((state) => {
        return {
          walk: paused(state.walk),
          expanded: state.expanded.filter((id) => {
            return !isInside(id, nodeId);
          }),
          revealed: state.revealed.filter((id) => {
            return !isInside(id, nodeId);
          }),
        };
      });
    },
    reveal: (containerId) => {
      return set((
        state,
      ) => {
        return (state.revealed.includes(containerId)
          ? state
          : { revealed: [...state.revealed, containerId] });
      });
    },
    adopt: (nodeIds) => {
      return set((state) => {
        return (sameIds(state.expanded, nodeIds) ? state : { expanded: nodeIds });
      });
    },
    hover: (hovered) => {
      return set((state) => {
        return (state.hovered === hovered ? state : { hovered });
      });
    },
    select: (selected) => {
      return set((state) => {
        return { selected, walk: paused(state.walk) };
      });
    },
    highlight: (highlighted) => {
      return set((state) => {
        return (sameIds(state.highlighted, highlighted) ? state : { highlighted });
      });
    },
    focus: (nodeId, ancestors) => {
      return set((state) => {
        return {
          expanded: [
            ...state.expanded,
            ...ancestors.filter((id) => {
              return !state.expanded.includes(id);
            }),
          ],
          focusRequest: { nodeId, ancestors },
        };
      });
    },
    settleFocus: (selected) => {
      return set({ selected, focusRequest: null });
    },
    startWalk: (steps, maxOpen, answerId, cursor) => {
      return set((state) => {
        if (!steps[cursor ?? 0]) {
          return state;
        }
        const walk = { steps, cursor: 0, playing: false, maxOpen, answerId };
        return walkTo(state, walk, cursor ?? 0, cursor === undefined && steps.length > 1);
      });
    },
    goTo: (cursor, playing = false) => {
      return set((state) => {
        return state.walk && state.walk.steps[cursor]
          ? walkTo(state, state.walk, cursor, playing)
          : state;
      });
    },
    setPlaying: (playing) => {
      return set((state) => {
        if (!state.walk) {
          return state;
        }
        const atEnd = state.walk.cursor === state.walk.steps.length - 1;
        return playing && atEnd
          ? walkTo(state, state.walk, 0, true)
          : { walk: { ...state.walk, playing } };
      });
    },
    endWalk: () => {
      // a step still waiting for its folders to be drawn would otherwise be selected afterwards
      return set((state) => {
        return { walk: null, focusRequest: state.focusRequest?.follow ? null : state.focusRequest };
      });
    },
    reset: () => {
      return set({
        expanded: [],
        revealed: [],
        hovered: null,
        selected: null,
        highlighted: [],
        focusRequest: null,
        walk: null,
      });
    },
  };
});
