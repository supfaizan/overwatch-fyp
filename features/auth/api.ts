import { api } from '@/shared/api/client';
import { GITHUB_SIGN_IN_URL } from '@/shared/api/envelope';
import type { User } from '@/shared/session/store';
import type { Workspace } from '@/shared/workspaces/types';
import type { UsernameProblem } from './constants';
import { rememberDestination } from './redirect';
import type {
  ForgotPasswordValues,
  InviteSignUpValues,
  SignInValues,
  SignUpValues,
} from './schemas';

export type ChallengeIssued = {
  challenge_id: string;
  email: string;
  resend_available_in: number;
};
export type UsernameAvailability = {
  username: string;
  available: boolean;
  reason: UsernameProblem | null;
};
type AccessToken = { access_token: string };

/** Leave for GitHub; the backend redirects back to /auth/complete (or /sign-in?error=...). */
export function startGithubSignIn(from: string | undefined): void {
  rememberDestination(from);
  window.location.assign(GITHUB_SIGN_IN_URL);
}

export const signUp = (values: SignUpValues) => {
  return api.post<ChallengeIssued>('/auth/signup', values);
};
export const signUpWithInvite = (
  values: InviteSignUpValues & { token: string },
) => {
  return api.post<AccessToken & { workspace: Workspace }>(
    '/auth/signup/invite',
    values,
  );
};
export const signIn = (values: SignInValues) => {
  return api.post<AccessToken>('/auth/login', values);
};
export const verifyEmail = (challengeId: string, code: string) => {
  return api.post<AccessToken>('/auth/email/verify', {
    challenge_id: challengeId,
    code,
  });
};
export const resendCode = (challengeId: string) => {
  return api.post<{ resend_available_in: number }>('/auth/otp/resend', {
    challenge_id: challengeId,
  });
};
export const requestPasswordReset = (values: ForgotPasswordValues) => {
  return api.post<ChallengeIssued>('/auth/password/forgot', values);
};
export const resetPassword = (
  challengeId: string,
  code: string,
  password: string,
) => {
  return api.post<null>('/auth/password/reset', {
    challenge_id: challengeId,
    code,
    password,
  });
};
export const checkUsername = (username: string, signal?: AbortSignal) => {
  return api.get<UsernameAvailability>('/auth/username-availability', {
    params: { username },
    signal,
  });
};
export const setUsername = (username: string) => {
  return api.request<User>({
    method: 'PUT',
    url: '/me/username',
    data: { username },
  });
};

/** One side of a merge, as the person confirming it sees it. */
export type MergeProfile = {
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
  github_login: string | null;
  created_at: string | null;
};
export type MergePreview = {
  current: MergeProfile;
  other: MergeProfile;
  proof: 'email_otp' | 'github_oauth';
  moves: {
    workspaces: number;
    repos: number;
    documents: number;
    work_items: number;
    comments: number;
    chats: number;
  };
  personal_workspace_name: string | null;
  conflicts: ('github' | 'email')[];
};
export type AddEmailResult =
  | { outcome: 'added'; me: User; merge: null }
  | { outcome: 'merge_required'; me: null; merge: MergePreview };
export type KeepProfile = 'current' | 'other';

export const addEmail = (email: string, password: string) => {
  return api.post<ChallengeIssued>('/me/email', { email, password });
};
export const verifyAddedEmail = (challengeId: string, code: string) => {
  return api.post<AddEmailResult>('/me/email/verify', {
    challenge_id: challengeId,
    code,
  });
};
export const getPendingMerge = () => {
  return api.get<MergePreview>('/me/merge');
};
export const confirmMerge = (keepProfile: KeepProfile) => {
  return api.post<User>('/me/merge', { keep_profile: keepProfile });
};
export const cancelMerge = () => {
  return api.request<null>({ method: 'DELETE', url: '/me/merge' });
};
export const removeGithub = (password: string) => {
  return api.request<User>({
    method: 'DELETE',
    url: '/me/github',
    data: { password },
  });
};
export const removeEmail = (password: string) => {
  return api.request<User>({
    method: 'DELETE',
    url: '/me/email',
    data: { password },
  });
};
