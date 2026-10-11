import { api } from '@/shared/api/client';
import type { Role, Workspace } from '@/shared/workspaces/types';

export type InvitePreview = { workspace_name: string; invited_by: string; role: Exclude<Role, 'owner'> };

export const previewInvite = (token: string) => api.get<InvitePreview>(`/invites/${token}`);
export const acceptInvite = (token: string) => api.post<Workspace>(`/invites/${token}/accept`);
