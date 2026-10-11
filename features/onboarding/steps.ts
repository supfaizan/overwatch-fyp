import type { OnboardingStatus } from './types';

export const STEPS = [
  { slug: 'github', label: 'GitHub' },
  { slug: 'jira', label: 'Jira' },
  { slug: 'indexing', label: 'Indexing' },
  { slug: 'ready', label: 'Ready' },
] as const;

export type StepSlug = (typeof STEPS)[number]['slug'];

/** Where onboarding should resume. Jira is optional, so a skipped Jira counts as done; only admins connect it. */
export function currentStep(status: OnboardingStatus, jiraSkipped: boolean): StepSlug {
  if (!status.github.authorized || status.github.repos.length === 0) return 'github';
  if (!status.jira.project && !jiraSkipped && status.role !== 'member') return 'jira';
  return status.ready ? 'ready' : 'indexing';
}

export function stepIndex(slug: string | undefined): number {
  const index = STEPS.findIndex((step) => step.slug === slug);
  return index === -1 ? 0 : index;
}

/** Still working in the background, so the status is worth polling. */
export function isRunning(status: { parse_status?: string; sync_status?: string } | null | undefined): boolean {
  const value = status?.parse_status ?? status?.sync_status;
  return value === 'pending' || value === 'in_progress';
}
