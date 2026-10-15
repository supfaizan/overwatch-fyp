import { api } from '@/shared/api/client';
import type { ROLE, Role, Workspace } from '@/shared/workspaces/types';

export const INVITE_KIND = { link: 'link', github: 'github', email: 'email' } as const;
export type InviteKind = (typeof INVITE_KIND)[keyof typeof INVITE_KIND];

export type InvitePreview = {
  workspace_name: string;
  invited_by: string;
  role: Exclude<Role, typeof ROLE.owner>;
};
/** What a signed-out visitor holding the link sees; `email` and `account_exists` only for email invites. */
export type PublicInvitePreview = InvitePreview & {
  kind: InviteKind;
  email: string | null;
  account_exists: boolean | null;
};

// the token goes in the body, out of URLs and access logs
export const publicPreview = (token: string) => {
  return api.post<PublicInvitePreview>('/invites/public-preview', { token });
};
export const previewInvite = (token: string) => {
  return api.post<InvitePreview>('/invites/preview', { token });
};
export const acceptInvite = (token: string) => {
  return api.post<Workspace>('/invites/accept', { token });
};
