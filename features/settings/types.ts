// mirrors the backend schemas (app/onboarding)

export type JobStatus = 'pending' | 'in_progress' | 'done' | 'failed';

/** Only the connection state settings shows; the full shape lives in the backend's onboarding schema. */
export type ConnectionStatus = {
  github: { authorized: boolean; needs_reauth: boolean };
  jira: {
    connected: boolean;
    needs_reauth: boolean;
    project: { key: string; sync_status: JobStatus; sync_error: string | null } | null;
  };
};
