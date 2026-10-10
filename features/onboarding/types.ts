// mirrors the backend schemas (app/github, app/jira, app/onboarding)

export type ParseStatus = 'pending' | 'in_progress' | 'done' | 'failed';
export type AccessStatus = 'active' | 'revoked' | 'needs_install';

export type OnboardingStatus = {
  github: {
    authorized: boolean;
    needs_reauth: boolean;
    repos: { repo_full_name: string; parse_status: ParseStatus; parse_error: string | null; access_status: AccessStatus }[];
  };
  jira: {
    connected: boolean;
    needs_reauth: boolean;
    project: { key: string; sync_status: ParseStatus; sync_error: string | null } | null;
  };
  /** At least one reachable repo is indexed (Jira is optional). */
  ready: boolean;
};

export type Installations = {
  install_url: string;
  installations: { id: number; account_login: string; account_type: string; repository_selection: string | null }[];
};

export type AvailableRepo = {
  id: number;
  full_name: string;
  private: boolean;
  default_branch: string | null;
  installation_id: number;
  connected: boolean;
};

export type ConnectedRepo = {
  repo_full_name: string;
  default_branch: string;
  access_status: AccessStatus;
  parse_status: ParseStatus;
  parse_error: string | null;
  indexed_at: string | null;
  graph_stats: { files?: number } | null;
};

export type JiraProject = { key: string; name: string | null; id: string | null };
