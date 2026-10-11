// mirrors the backend schemas (app/github)

import type { JobStatus } from '@/shared/lib/job-status';

export const ACCESS_STATUS = { active: 'active', revoked: 'revoked', needsInstall: 'needs_install' } as const;

export type AccessStatus = (typeof ACCESS_STATUS)[keyof typeof ACCESS_STATUS];

export type ConnectedRepo = {
  repo_full_name: string;
  default_branch: string;
  access_status: AccessStatus;
  parse_status: JobStatus;
  parse_error: string | null;
  indexed_at: string | null;
  graph_stats: { files?: number } | null;
};

/** A repo the user can see through one of their GitHub App installations. */
export type AvailableRepo = {
  id: number;
  full_name: string;
  private: boolean;
  default_branch: string | null;
  installation_id: number;
  connected: boolean;
};

export type Installations = {
  install_url: string;
  installations: { id: number; account_login: string; account_type: string; repository_selection: string | null }[];
};
