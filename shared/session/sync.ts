import { decodeJwt } from 'jose';
import type { User } from './store';

/** What tabs tell each other: a new access token, a changed profile, or that a user signed out. */
export type SessionMessage =
  | { type: 'token'; token: string }
  | { type: 'user'; user: User }
  | { type: 'signed-out'; userId: string | null };

export type SessionAction = 'set-token' | 'switch-user' | 'set-user' | 'clear' | 'ignore';

type Current = { status: 'loading' | 'authenticated' | 'guest'; userId: string | null };

/** The user an access token is for; null when it can't be read. */
export function tokenSubject(token: string): string | null {
  try {
    const { sub } = decodeJwt(token);
    return typeof sub === 'string' ? sub : null;
  } catch {
    return null;
  }
}

/**
 * How a tab reacts to another tab's message: a token for the same user just replaces its own, a token for anyone else
 * (or arriving while signed out) means loading that user afresh, a profile change or a sign-out only applies to the
 * user it names.
 */
export function sessionAction(current: Current, message: SessionMessage): SessionAction {
  if (message.type === 'token') {
    if (current.status === 'loading') {
      return 'set-token';
    }
    return current.userId !== null && tokenSubject(message.token) === current.userId
      ? 'set-token'
      : 'switch-user';
  }
  if (message.type === 'user') {
    return message.user.id === current.userId ? 'set-user' : 'ignore';
  }
  if (current.status === 'guest') {
    return 'ignore';
  }
  return message.userId !== null && message.userId !== current.userId ? 'ignore' : 'clear';
}
