import { api } from '@/shared/api/client';
import { API_URL } from '@/shared/api/envelope';
import { endSession } from '@/shared/session/refresh';
import { rememberDestination } from './redirect';

/** Leave for GitHub; the backend redirects back to /auth/complete (or /sign-in?error=...). */
export function startGithubSignIn(from: string | undefined): void {
  rememberDestination(from);
  window.location.assign(`${API_URL}/auth/github/login`);
}

/** Sign out here (or on every device). Local state is cleared even if the request fails. */
export async function signOut({ everywhere = false } = {}): Promise<void> {
  try {
    await api.post<null>(everywhere ? '/auth/logout-all' : '/auth/logout');
  } finally {
    endSession();
  }
}
