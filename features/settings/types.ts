// mirrors the backend schemas (app/onboarding, app/workspaces)

import type { Role } from '@/shared/workspaces/types';

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

export type Member = {
  user_id: string;
  github_login: string;
  name: string | null;
  avatar_url: string | null;
  role: Role;
  joined_at: string;
};

export type InviteRole = Exclude<Role, 'owner'>;

export type Invite = {
  id: string;
  role: InviteRole;
  github_login: string | null;
  created_at: string;
  expires_at: string;
};

export type InviteCreated = Invite & { url: string };
