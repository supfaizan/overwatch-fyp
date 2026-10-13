import { GITHUB_SIGN_IN_URL } from '@/shared/api/envelope';
import { rememberDestination } from './redirect';

/** Leave for GitHub; the backend redirects back to /auth/complete (or /sign-in?error=...). */
export function startGithubSignIn(from: string | undefined): void {
  rememberDestination(from);
  window.location.assign(GITHUB_SIGN_IN_URL);
}
