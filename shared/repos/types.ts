// mirrors the backend schemas (app/github)

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
