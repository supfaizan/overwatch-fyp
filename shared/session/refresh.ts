import axios from 'axios';
import { decodeJwt } from 'jose';
import { API_URL, toApiError, type ApiEnvelope } from '@/shared/api/envelope';
import { useSession } from './store';

// tabs share the refresh cookie but not memory: new tokens and sign-outs are broadcast
type SessionMessage = { type: 'token'; token: string } | { type: 'signed-out' };

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('overwatch-session');
// refresh calls skip the interceptors, so a failed refresh never tries to refresh itself
const authHttp = axios.create({ baseURL: API_URL, withCredentials: true });

let inFlight: Promise<string> | null = null;

/** Milliseconds until the token expires (negative once it has). */
export function expiresIn(token: string): number {
  try {
    const { exp } = decodeJwt(token);
    return typeof exp === 'number' ? exp * 1000 - Date.now() : -1;
  } catch {
    return -1;
  }
}

/**
 * Swap the refresh cookie for a new access token. One refresh at a time per tab, and across
 * tabs via a Web Lock: the backend revokes the whole session if a refresh token is used twice.
 */
export function refreshSession(): Promise<string> {
  const before = useSession.getState().token;
  inFlight ??= withLock(async () => {
    // another tab may have refreshed (and broadcast) while this one waited for the lock
    const current = useSession.getState().token;
    if (current && current !== before && expiresIn(current) > 60_000) return current;

    try {
      const { data } = await authHttp.post<ApiEnvelope<{ access_token: string }>>('/auth/refresh');
      const token = data.data.access_token;
      useSession.getState().setToken(token);
      channel?.postMessage({ type: 'token', token } satisfies SessionMessage);
      return token;
    } catch (error) {
      throw toApiError(error);
    }
  }).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Forget the session here and in every other tab. */
export function endSession(): void {
  useSession.getState().clear();
  channel?.postMessage({ type: 'signed-out' } satisfies SessionMessage);
}

/** Mirror other tabs' refreshes and sign-outs; returns an unsubscribe function. */
export function onSessionBroadcast(): () => void {
  if (!channel) return () => undefined;
  const listener = ({ data }: MessageEvent<SessionMessage>) => {
    if (data.type === 'token') useSession.getState().setToken(data.token);
    else useSession.getState().clear();
  };
  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
}

function withLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.locks) return task();
  return navigator.locks.request('overwatch-session-refresh', task) as Promise<T>;
}
