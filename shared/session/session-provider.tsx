'use client';

import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/envelope';
import { useWorkspace } from '@/shared/workspaces/store';
import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { type ReactNode, useEffect, useRef } from 'react';
import { SESSION_HINT_COOKIE } from './constants';
import { endSession, expiresIn, onSessionBroadcast, refreshSession } from './refresh';
import { type User, useSession } from './store';

// refresh this long before the access token expires
const REFRESH_EARLY_MS = 60_000;

/** The session lifecycle: restore on load, refresh ahead of expiry, follow other tabs. */
export default function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const token = useSession((state) => {
    return state.token;
  });
  const userId = useSession((state) => {
    return state.user?.id ?? null;
  });
  const previousUser = useRef<string | null>(null);

  useEffect(() => {
    restore();
    const unsubscribe = onSessionBroadcast(switchUser);
    // a frozen or cached tab misses broadcasts; the hint cookie every tab keeps tells it what changed meanwhile
    const resync = () => {
      if (document.visibilityState === 'visible') {
        followHintCookie();
      }
    };
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('pageshow', resync);
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('pageshow', resync);
    };
  }, []);

  // after a sign-out or a switch, nothing the last user loaded (or the workspace they had open) may show
  useEffect(() => {
    if (previousUser.current !== null && previousUser.current !== userId) {
      queryClient.clear();
      useWorkspace.getState().setId(null);
    }
    previousUser.current = userId;
  }, [userId, queryClient]);

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

/** Another tab signed in (as anyone, or as someone else): load that user here too. */
async function switchUser(token: string): Promise<void> {
  useSession.getState().switchTo(token);
  try {
    const user = await api.get<User>('/me');
    // a newer switch may have landed while this one loaded
    if (useSession.getState().token === token) {
      useSession.getState().setUser(user);
    }
  } catch {
    useSession.getState().clear();
  }
}

function followHintCookie(): void {
  const { status, clear } = useSession.getState();
  const hinted = Cookies.get(SESSION_HINT_COOKIE) !== undefined;
  if (status === 'authenticated' && !hinted) {
    clear();
  } else if (status === 'guest' && hinted) {
    useSession.setState({ status: 'loading' });
    restore();
  }
}

function signOutIfRejected(error: unknown): void {
  // a dropped connection isn't a sign-out; only the server rejecting the session is
  if (error instanceof ApiError && error.status === 401) {
    endSession();
  }
}
