import { api } from '@/shared/api/client';
import type { ConnectedRepo } from '@/shared/repos/types';
import type { Workspace } from '@/shared/workspaces/types';
import type { ConnectionStatus, Invite, InviteCreated, InviteRole, Member } from './types';

export const getConnectionStatus = () => api.get<ConnectionStatus>('/onboarding/status');

export const reindexRepo = (repoFullName: string) => api.post<ConnectedRepo>(`/github/repos/${repoFullName}/index`);
export const disconnectRepo = (repoFullName: string) => api.delete<null>(`/github/repos/${repoFullName}`);

export const startJiraAuthorization = () => api.post<{ authorization_url: string }>('/jira/login');
export const disconnectJira = () => api.delete<null>('/jira/connection');

const workspace = (id: string) => `/workspaces/${id}`;

export const renameWorkspace = ({ id, name }: { id: string; name: string }) => api.patch<Workspace>(workspace(id), { name });
export const deleteWorkspace = (id: string) => api.delete<null>(workspace(id));

export const getMembers = (id: string) => api.get<Member[]>(`${workspace(id)}/members`);
export const updateMember = ({ id, userId, role }: { id: string; userId: string; role: Member['role'] }) =>
  api.patch<null>(`${workspace(id)}/members/${userId}`, { role });
export const removeMember = ({ id, userId }: { id: string; userId: string }) => api.delete<null>(`${workspace(id)}/members/${userId}`);

export const getInvites = (id: string) => api.get<Invite[]>(`${workspace(id)}/invites`);
export const createInvite = ({ id, role, githubLogin }: { id: string; role: InviteRole; githubLogin: string | null }) =>
  api.post<InviteCreated>(`${workspace(id)}/invites`, { role, github_login: githubLogin });
export const revokeInvite = ({ id, inviteId }: { id: string; inviteId: string }) => api.delete<null>(`${workspace(id)}/invites/${inviteId}`);
