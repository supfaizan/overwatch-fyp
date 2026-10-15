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

export type ChallengeIssued = { challenge_id: string; email: string; resend_available_in: number };
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
export const signUpWithInvite = (values: InviteSignUpValues & { token: string }) => {
  return api.post<AccessToken & { workspace: Workspace }>('/auth/signup/invite', values);
};
export const signIn = (values: SignInValues) => {
  return api.post<AccessToken>('/auth/login', values);
};
export const verifyEmail = (challengeId: string, code: string) => {
  return api.post<AccessToken>('/auth/email/verify', { challenge_id: challengeId, code });
};
export const resendCode = (challengeId: string) => {
  return api.post<{ resend_available_in: number }>('/auth/otp/resend', {
    challenge_id: challengeId,
  });
};
export const requestPasswordReset = (values: ForgotPasswordValues) => {
  return api.post<ChallengeIssued>('/auth/password/forgot', values);
};
export const resetPassword = (challengeId: string, code: string, password: string) => {
  return api.post<null>('/auth/password/reset', { challenge_id: challengeId, code, password });
};
export const checkUsername = (username: string, signal?: AbortSignal) => {
  return api.get<UsernameAvailability>('/auth/username-availability', {
    params: { username },
    signal,
  });
};
export const setUsername = (username: string) => {
  return api.request<User>({ method: 'PUT', url: '/me/username', data: { username } });
};
