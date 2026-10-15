'use client';

import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/envelope';
import { type ReactNode, useEffect } from 'react';
import { endSession, expiresIn, onSessionBroadcast, refreshSession } from './refresh';
import { type User, useSession } from './store';

// refresh this long before the access token expires
const REFRESH_EARLY_MS = 60_000;

/** The session lifecycle: restore on load, refresh ahead of expiry, follow other tabs. */
export default function SessionProvider({ children }: { children: ReactNode }) {
  const token = useSession((state) => {
    return state.token;
  });

  useEffect(() => {
    restore();
    return onSessionBroadcast();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }
    const timer = setTimeout(() => {
      refreshSession().catch(signOutIfRejected);
    }, Math.max(0, expiresIn(token) - REFRESH_EARLY_MS));
    return () => {
      return clearTimeout(timer);
    };
  }, [token]);

  return children;
}

async function restore(): Promise<void> {
  if (useSession.getState().status !== 'loading') {
    return;
  } // already restored this page load
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
  if (error instanceof ApiError && error.status === 401) {
    endSession();
  }
}
