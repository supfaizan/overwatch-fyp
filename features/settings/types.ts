// mirrors the backend schemas (app/onboarding, app/connectors, app/workspaces)

import type { ConnectionStatus as TrackerStatus } from '@/shared/connections/constants';
import type { JobStatus } from '@/shared/lib/job-status';
import type { ROLE, Role } from '@/shared/workspaces/types';

/** Only the GitHub state settings shows; the full shape lives in the backend's onboarding schema. */
export type ConnectionStatus = {
  github: { authorized: boolean; needs_reauth: boolean };
};

export type SyncTarget = {
  key: string;
  name: string | null;
  sync_status: JobStatus;
  sync_error: string | null;
  last_synced_at: string | null;
};

/** A project (list, board) a tracker account can sync. */
export type Target = { key: string; name: string | null; id: string | null };

/** A tracker connector (Jira, ...) and this workspace's state for it. */
export type Connection = {
  provider: string;
  name: string;
  status: TrackerStatus;
  /** False for grants made before board edits were written back: reconnect to edit. */
  can_write: boolean;
  external_account: { id: string; name: string | null; url: string | null } | null;
  connected_at: string | null;
  targets: SyncTarget[];
};

export type Member = {
  user_id: string;
  github_login: string;
  name: string | null;
  avatar_url: string | null;
  role: Role;
  joined_at: string;
};

export type InviteRole = Exclude<Role, typeof ROLE.owner>;

export type Invite = {
  id: string;
  role: InviteRole;
  github_login: string | null;
  created_at: string;
  expires_at: string;
};

export type InviteCreated = Invite & { url: string };
