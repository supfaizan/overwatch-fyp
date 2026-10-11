// mirrors the backend schemas (app/github, app/jira, app/onboarding)

import type { JobStatus } from '@/shared/lib/job-status';
import type { AccessStatus } from '@/shared/repos/types';
import type { Role } from '@/shared/workspaces/types';

export type OnboardingRepo = {
  repo_full_name: string;
  parse_status: JobStatus;
  parse_error: string | null;
  access_status: AccessStatus;
  graph_stats: { files?: number } | null;
};

export type OnboardingStatus = {
  /** Only admins and owners connect repos and Jira. */
  role: Role;
  github: {
    authorized: boolean;
    needs_reauth: boolean;
    repos: OnboardingRepo[];
  };
  jira: {
    connected: boolean;
    needs_reauth: boolean;
    project: { key: string; sync_status: JobStatus; sync_error: string | null } | null;
  };
  /** At least one reachable repo is indexed (Jira is optional). */
  ready: boolean;
};

export type JiraProject = { key: string; name: string | null; id: string | null };
