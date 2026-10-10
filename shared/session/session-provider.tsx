'use client';

import { useEffect, type ReactNode } from 'react';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/envelope';
import { endSession, expiresIn, onSessionBroadcast, refreshSession } from './refresh';
import { useSession, type User } from './store';

// refresh this long before the access token expires
const REFRESH_EARLY_MS = 60_000;

/** The session lifecycle: restore on load, refresh ahead of expiry, follow other tabs. */
export default function SessionProvider({ children }: { children: ReactNode }) {
  const token = useSession((state) => state.token);

  useEffect(() => {
    restore();
    return onSessionBroadcast();
  }, []);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      refreshSession().catch(signOutIfRejected);
    }, Math.max(0, expiresIn(token) - REFRESH_EARLY_MS));
    return () => clearTimeout(timer);
  }, [token]);

  return children;
}

async function restore(): Promise<void> {
  if (useSession.getState().status !== 'loading') return; // already restored this page load
  try {
    await refreshSession();
    useSession.getState().setUser(await api.get<User>('/me'));
  } catch {
    // no session, or the API is unreachable: either way there's no signed-in user here
    useSession.getState().clear();
  }
}

function signOutIfRejected(error: unknown): void {
  // a dropped connection isn't a sign-out; only the server rejecting the session is
  if (error instanceof ApiError && error.status === 401) endSession();
}
