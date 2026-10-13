// error codes the backend's GitHub callback sends to /sign-in?error=
const SIGN_IN_ERRORS: Record<string, string> = {
  oauth_cancelled: 'GitHub sign-in was cancelled.',
  oauth_state_mismatch: 'That sign-in link expired. Please try again.',
  github_unavailable: "GitHub isn't responding right now. Please try again in a moment.",
};

export function signInErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return SIGN_IN_ERRORS[code] ?? 'Sign-in failed. Please try again.';
}
