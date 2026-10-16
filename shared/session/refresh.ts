import { API_URL, type ApiEnvelope, toApiError } from '@/shared/api/envelope';
import axios from 'axios';
import { decodeJwt } from 'jose';
import { REFRESH_LOCK, SESSION_CHANNEL } from './constants';
import { type User, useSession } from './store';
import { sessionAction, type SessionMessage } from './sync';

// a refresh that hangs holds the cross-tab lock, so it gives up after this long
const REFRESH_TIMEOUT_MS = 15_000;

// tabs share the refresh cookie but not memory: new tokens, profile changes and sign-outs are broadcast
let channel: BroadcastChannel | null | undefined;
function sessionChannel(): BroadcastChannel | null {
  // browser only: Node has a BroadcastChannel too, and server rendering mustn't open one
  channel ??= typeof window === 'undefined' || typeof BroadcastChannel === 'undefined'
    ? null
    : new BroadcastChannel(SESSION_CHANNEL);
  return channel;
}

function broadcast(message: SessionMessage): void {
  sessionChannel()?.postMessage(message);
}

// refresh calls skip the interceptors, so a failed refresh never tries to refresh itself
const authHttp = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: REFRESH_TIMEOUT_MS,
});

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

/** Use a new access token here and in every other tab. */
export function publishToken(token: string): void {
  useSession.getState().setToken(token);
  broadcast({ type: 'token', token });
}

/** Show a changed profile here and in every other tab of the same user. */
export function publishUser(user: User): void {
  useSession.getState().setUser(user);
  broadcast({ type: 'user', user });
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
    if (current && current !== before && expiresIn(current) > 60_000) {
      return current;
    }

    try {
      const { data } = await authHttp.post<ApiEnvelope<{ access_token: string }>>('/auth/refresh');
      const token = data.data.access_token;
      publishToken(token);
      return token;
    } catch (error) {
      throw toApiError(error);
    }
  }).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Forget the session here and in every other tab of the same user. */
export function endSession(): void {
  const userId = useSession.getState().user?.id ?? null;
  useSession.getState().clear();
  broadcast({ type: 'signed-out', userId });
}

/**
 * Follow other tabs: their refreshes, profile changes and sign-outs. A token for someone else (or arriving while
 * signed out) goes to `onSwitch`, which loads that user. Returns an unsubscribe function.
 */
export function onSessionBroadcast(onSwitch: (token: string) => void): () => void {
  const current = sessionChannel();
  if (!current) {
    return () => {
      return undefined;
    };
  }
  const listener = ({ data }: MessageEvent<SessionMessage>) => {
    const { status, user, setToken, setUser, clear } = useSession.getState();
    const action = sessionAction({ status, userId: user?.id ?? null }, data);
    if (action === 'set-token' && data.type === 'token') {
      setToken(data.token);
    } else if (action === 'switch-user' && data.type === 'token') {
      onSwitch(data.token);
    } else if (action === 'set-user' && data.type === 'user') {
      setUser(data.user);
    } else if (action === 'clear') {
      clear();
    }
  };
  current.addEventListener('message', listener);
  return () => {
    return current.removeEventListener('message', listener);
  };
}

function withLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return task();
  }
  return navigator.locks.request(REFRESH_LOCK, task) as Promise<T>;
}
