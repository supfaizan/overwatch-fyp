// match the backend's limits
export const NAME_MAX_LENGTH = 80;
export const EMAIL_MAX_LENGTH = 254;

/** Where someone heard about us; values match the backend's `HeardFrom`. */
export const HEARD_FROM = ['friend', 'linkedin', 'x', 'search', 'university', 'other'] as const;
export type HeardFrom = (typeof HEARD_FROM)[number];

const HEARD_FROM_LABELS: Record<HeardFrom, string> = {
  friend: 'A friend or colleague',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
  search: 'Google or another search engine',
  university: 'University or an FYP showcase',
  other: 'Somewhere else',
};

export const HEARD_FROM_OPTIONS = HEARD_FROM.map((value) => {
  return { value, label: HEARD_FROM_LABELS[value] };
});
