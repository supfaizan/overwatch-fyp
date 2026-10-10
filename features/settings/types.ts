// mirrors the backend schemas (app/github, app/onboarding)

export type JobStatus = 'pending' | 'in_progress' | 'done' | 'failed';

export type ConnectedRepo = {
  repo_full_name: string;
  default_branch: string;
  access_status: 'active' | 'revoked' | 'needs_install';
  parse_status: JobStatus;
  parse_error: string | null;
  indexed_at: string | null;
  graph_stats: { files?: number } | null;
};

export type Installations = {
  install_url: string;
  installations: { id: number; account_login: string; account_type: string; repository_selection: string | null }[];
};

/** Only the connection state settings shows; the full shape lives in the backend's onboarding schema. */
export type ConnectionStatus = {
  github: { authorized: boolean; needs_reauth: boolean };
  jira: {
    connected: boolean;
    needs_reauth: boolean;
    project: { key: string; sync_status: JobStatus; sync_error: string | null } | null;
  };
};
