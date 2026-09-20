/* The DOM contract between the story components and the scroll hooks.
   Components spread these attributes; hooks find elements by the selectors.
   Keeping both sides here means neither can drift from the other. */

const STEP = "data-story-step";
const RAIL_LINE = "data-rail-line";
const RAIL_DOT = "data-rail-dot";

export const storyStepAttrs = (index: number) => ({ [STEP]: index });
export const railLineAttrs = { [RAIL_LINE]: "" };
export const railDotAttrs = { [RAIL_DOT]: "" };

export const STORY_SELECTORS = {
  step: `[${STEP}]`,
  railLine: `[${RAIL_LINE}]`,
  railDot: `[${RAIL_DOT}]`,
} as const;

export function readStepIndex(element: Element): number {
  return Number(element.getAttribute(STEP));
}

/** Where the reader's eye sits, as a fraction of the viewport height. The
 *  active step and the rail's drawn length both follow this line. */
export const READING_LINE = 0.5;

/** IntersectionObserver margin leaving a 1%-tall band at the reading line. */
export const READING_BAND = `-${READING_LINE * 100}% 0px -${
  (1 - READING_LINE) * 100 - 1
}% 0px`;
