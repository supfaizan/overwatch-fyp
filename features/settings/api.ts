import { api } from '@/shared/api/client';
import type { ConnectedRepo } from '@/shared/repos/types';
import type { Workspace } from '@/shared/workspaces/types';
import type {
  Connection,
  ConnectionStatus,
  Invite,
  InviteCreated,
  InviteRole,
  Member,
  SyncTarget,
  Target,
} from './types';

export const getConnectionStatus = () => {
  return api.get<ConnectionStatus>('/onboarding/status');
};

export const reindexRepo = (repoFullName: string) => {
  return api.post<ConnectedRepo>(`/github/repos/${repoFullName}/index`);
};
export const disconnectRepo = (repoFullName: string) => {
  return api.delete<null>(`/github/repos/${repoFullName}`);
};

export const getConnections = () => {
  return api.get<Connection[]>('/connections');
};
export const startAuthorization = (provider: string) => {
  return api.post<{ authorization_url: string }>(`/connections/${provider}/authorize`, {
    return_to: 'settings',
  });
};
export const disconnect = (provider: string) => {
  return api.delete<null>(`/connections/${provider}`);
};
export const getAvailableTargets = (provider: string) => {
  return api.get<Target[]>(`/connections/${provider}/targets/available`);
};
export const addTarget = ({ provider, target }: { provider: string; target: Target }) => {
  return api.post<SyncTarget>(`/connections/${provider}/targets`, {
    key: target.key,
    name: target.name,
  });
};
export const syncNow = (provider: string) => {
  return api.post<null>(`/connections/${provider}/sync`);
};

const workspace = (id: string) => {
  return `/workspaces/${id}`;
};

export const renameWorkspace = ({ id, name }: { id: string; name: string }) => {
  return api.patch<Workspace>(workspace(id), { name });
};
export const deleteWorkspace = (id: string) => {
  return api.delete<null>(workspace(id));
};

export const getMembers = (id: string) => {
  return api.get<Member[]>(`${workspace(id)}/members`);
};
export const updateMember = (
  { id, userId, role }: { id: string; userId: string; role: Member['role'] },
) => {
  return api.patch<null>(`${workspace(id)}/members/${userId}`, { role });
};
export const removeMember = ({ id, userId }: { id: string; userId: string }) => {
  return api.delete<null>(`${workspace(id)}/members/${userId}`);
};

export const getInvites = (id: string) => {
  return api.get<Invite[]>(`${workspace(id)}/invites`);
};
export const createInvite = (
  { id, role, githubLogin, email }: {
    id: string;
    role: InviteRole;
    githubLogin?: string;
    email?: string;
  },
) => {
  return api.post<InviteCreated>(`${workspace(id)}/invites`, {
    role,
    github_login: githubLogin ?? null,
    email: email ?? null,
  });
};
export const resendInvite = ({ id, inviteId }: { id: string; inviteId: string }) => {
  return api.post<Invite>(`${workspace(id)}/invites/${inviteId}/resend`);
};
export const revokeInvite = ({ id, inviteId }: { id: string; inviteId: string }) => {
  return api.delete<null>(`${workspace(id)}/invites/${inviteId}`);
};
