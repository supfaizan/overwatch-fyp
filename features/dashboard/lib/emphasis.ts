import { ancestorsOf } from './ancestors';
import { neighbourhood } from './edges';

/** How far what's out of focus sits back. */
export const RECEDED = { node: 0.18, edge: 0.07 };
/** a walkthrough's steps still to come: there, but not yet */
const UPCOMING = 0.5;

type Looking = {
  hovered: string | null;
  selected: string | null;
  highlighted: string[];
  /** a walkthrough's nodes: those walked so far (with the current one), and those still to come */
  walk?: { walked: Set<string>; upcoming: Set<string> } | null;
};

/**
 * Which node is in focus and how opaque each node draws. Hover wins over a walkthrough, which wins
 * over the chat's highlight, which wins over the selection, so you can look around without losing
 * your place.
 */
export function emphasis(
  edges: { source: string; target: string }[],
  { hovered, selected, highlighted, walk = null }: Looking,
  repo: string,
): { focusId: string | null; opacityOf: (id: string) => number } {
  const focusId = hovered ?? (walk || highlighted.length > 0 ? null : selected);
  const inFocus = neighbourhood(edges, focusId);
  // a closed folder holding a highlighted node stands in for it; packages and routes sit in folders
  // their ids don't name, which ancestorsOf knows
  const holders = new Set(highlighted.flatMap((nodeId) => {
    return [nodeId, ...ancestorsOf(nodeId, repo)];
  }));
  return {
    focusId,
    opacityOf: (id) => {
      if (focusId) {
        return inFocus.has(id) ? 1 : RECEDED.node;
      }
      if (walk) {
        return walk.walked.has(id) ? 1 : walk.upcoming.has(id) ? UPCOMING : RECEDED.node;
      }
      return highlighted.length === 0 || holders.has(id) ? 1 : RECEDED.node;
    },
  };
}
