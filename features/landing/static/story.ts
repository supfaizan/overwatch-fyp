/* Every word of landing-page copy lives here, in story order. */

import type { CallToAction, Chapter, SceneMode } from "../types";

const START: CallToAction = { label: "Connect a repository", href: "/register" };

export const NAV_ACTIONS = {
  signIn: { label: "Sign in", href: "/login" },
  start: { label: "Get started", href: "/register" },
} as const satisfies Record<string, CallToAction>;

export const HERO = {
  mode: "intro",
  title: "Architecture,",
  titleAccent: "read from code.",
  body: "A live map of your codebase you can question, replay and trust.",
  cta: START,
  scrollHint: "Scroll",
} as const satisfies {
  mode: SceneMode;
  title: string;
  titleAccent: string;
  body: string;
  cta: CallToAction;
  scrollHint: string;
};

export const CHAPTERS: readonly Chapter[] = [
  {
    mode: "map",
    label: "Map",
    title: "Read, not drawn.",
    body: "Every dependency comes from the syntax tree. Nothing is guessed.",
  },
  {
    mode: "ask",
    label: "Ask",
    title: "Ask your architecture.",
    body: "Answers are checked against the graph, so nothing is made up.",
  },
  {
    mode: "flow",
    label: "Replay",
    title: "Replay any flow.",
    body: "Follow a request node by node, payload included.",
  },
  {
    mode: "tickets",
    label: "Tickets",
    title: "Tickets, meet code.",
    body: "Each ticket lands on the service it actually touches.",
  },
  {
    mode: "contracts",
    label: "Contracts",
    title: "Catch breaks before they ship.",
    body: "Mismatched assumptions between services, flagged on every merge.",
  },
  {
    mode: "live",
    label: "Live",
    title: "Never out of date.",
    body: "Every push re-reads only what changed.",
  },
];

export const CLOSING = {
  mode: "complete",
  label: "Your turn",
  title: "Point it at a repo.",
  body: "Sign in with GitHub. The map builds itself.",
  cta: START,
} as const satisfies {
  mode: SceneMode;
  label: string;
  title: string;
  body: string;
  cta: CallToAction;
};

/** Scene shown for each story step, by step index. */
export const STORY_SCENES: readonly SceneMode[] = [
  HERO.mode,
  ...CHAPTERS.map((chapter) => chapter.mode),
  CLOSING.mode,
];
