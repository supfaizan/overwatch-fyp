// mirrors the backend schemas (app/onboarding, app/connectors, app/workspaces)

import type {
  ConnectionStatus as TrackerStatus,
  ConnectorCategory,
} from '@/shared/connections/constants';
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

/** A project (list, board) or docs space an account can sync; `id` is the key people know it by. */
export type Target = { key: string; name: string | null; id: string | null };

/** A connector (Jira, Confluence, ...) and this workspace's state for it. */
export type Connection = {
  provider: string;
  name: string;
  category: ConnectorCategory;
  status: TrackerStatus;
  /** False when the grant can't write back (made before edits were): reconnect to edit. */
  can_write: boolean;
  external_account: { id: string; name: string | null; url: string | null } | null;
  connected_at: string | null;
  targets: SyncTarget[];
};

export type Member = {
  user_id: string;
  username: string | null;
  github_login: string | null;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: Role;
  joined_at: string;
};

export type InviteRole = Exclude<Role, typeof ROLE.owner>;

/** Who may accept: anyone with the link, one GitHub account, or one email address (mailed the link). */
export const INVITE_KIND = { link: 'link', github: 'github', email: 'email' } as const;
export type InviteKind = (typeof INVITE_KIND)[keyof typeof INVITE_KIND];

export type Invite = {
  id: string;
  kind: InviteKind;
  role: InviteRole;
  github_login: string | null;
  email: string | null;
  created_at: string;
  expires_at: string;
  last_sent_at: string | null;
};

/** `url` carries the token and is shown once; email invites have none, the link only goes to that inbox. */
export type InviteCreated = Invite & { url: string | null };
