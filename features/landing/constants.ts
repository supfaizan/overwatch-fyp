import { INTEGRATION_LOGOS } from '@/shared/lib/integrations';
/** The arcs' drawing space; the hero keeps this aspect ratio so icons stay on their arcs at any width. */
export const ARC_VIEW = { width: 1336, height: 600 } as const;

type Point = readonly [x: number, y: number];
/** A cubic Bézier: start, two control points, end. */
export type Arc = readonly [Point, Point, Point, Point];

const LEFT_ARCS = {
  outer: [[0, 268], [260, 282], [460, 420], [530, 600]],
  inner: [[0, 425], [160, 430], [330, 482], [385, 600]],
} as const satisfies Record<string, Arc>;

function flip([x, y]: Point): Point {
  return [ARC_VIEW.width - x, y];
}

function mirror([start, control1, control2, end]: Arc): Arc {
  return [flip(start), flip(control1), flip(control2), flip(end)];
}

/** Orbit lines sweeping from both edges down onto the app preview. */
export const ARCS = {
  leftOuter: LEFT_ARCS.outer,
  leftInner: LEFT_ARCS.inner,
  rightOuter: mirror(LEFT_ARCS.outer),
  rightInner: mirror(LEFT_ARCS.inner),
} as const satisfies Record<string, Arc>;

export type Integration = {
  name: string;
  /** One of INTEGRATION_LOGOS; GitHub has none and uses the shared GitHub mark. */
  src?: string;
  arc: keyof typeof ARCS;
  /** How far along its arc, 0 to 1. */
  at: number;
};

export const INTEGRATIONS: readonly Integration[] = [
  { name: 'Figma', src: INTEGRATION_LOGOS.figma, arc: 'leftOuter', at: 0.2 },
  { name: 'Confluence', src: INTEGRATION_LOGOS.confluence, arc: 'leftOuter', at: 0.5 },
  { name: 'GitLab', src: INTEGRATION_LOGOS.gitlab, arc: 'leftOuter', at: 0.8 },
  { name: 'Granola', src: INTEGRATION_LOGOS.granola, arc: 'leftInner', at: 0.08 },
  { name: 'GitHub', arc: 'leftInner', at: 0.5 },
  {
    name: 'Google Calendar',
    src: INTEGRATION_LOGOS.googleCalendar,
    arc: 'rightOuter',
    at: 0.1,
  },
  { name: 'Google Meet', src: INTEGRATION_LOGOS.googleMeet, arc: 'rightOuter', at: 0.45 },
  { name: 'Jira', src: INTEGRATION_LOGOS.jira, arc: 'rightOuter', at: 0.8 },
  { name: 'Slack', src: INTEGRATION_LOGOS.slack, arc: 'rightInner', at: 0.22 },
  { name: 'ClickUp', src: INTEGRATION_LOGOS.clickup, arc: 'rightInner', at: 0.62 },
];
/** Icon size in arc-view units. */
export const INTEGRATION_SIZE = 52;

/** The word "scattered", each letter knocked out of line by a fixed amount (fixed, so server and client agree). */
export const SCATTERED_LETTERS = [
  { char: 's', y: 0, rotate: 0 },
  { char: 'c', y: -0.22, rotate: -6 },
  { char: 'a', y: -0.08, rotate: 4 },
  { char: 't', y: -0.04, rotate: -3 },
  { char: 't', y: 0.03, rotate: 6 },
  { char: 'e', y: -0.16, rotate: -4 },
  { char: 'r', y: -0.26, rotate: 9 },
  { char: 'e', y: -0.1, rotate: -6 },
  { char: 'd', y: 0.12, rotate: 10 },
] as const;

export const HERO_VIDEO = {
  webm: '/hero-demo.webm',
  mp4: '/hero-demo.mp4',
  poster: '/hero-demo-poster.jpg',
  width: 1600,
  height: 1000,
} as const;

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** Landing sections other pages link to, as `/#<id>`. */
export const SECTION_IDS = { why: 'why', faq: 'faq', waitlist: 'waitlist' } as const;
