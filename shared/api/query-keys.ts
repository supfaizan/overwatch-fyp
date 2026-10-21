/**
 * Query keys that more than one feature reads or invalidates. A feature's own keys live in its
 * hooks, built on these roots where they belong to them, so invalidating a root refreshes them too.
 */
export const queryKeys = {
  onboardingStatus: ['onboarding', 'status'] as const,
  github: ['github'] as const,
  connections: ['connections'] as const,
  workItems: ['work-items'] as const,
  workItemTypes: ['work-item-types'] as const,
  workspaces: ['workspaces'] as const,
};
