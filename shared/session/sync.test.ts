import { describe, expect, it } from 'vitest';
import { sessionAction, tokenSubject } from './sync';

// decodeJwt doesn't check signatures, so an unsigned token is enough here
const tokenFor = (sub: string) => {
  const part = (value: object) => {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  };
  return `${part({ alg: 'none' })}.${part({ sub, exp: 9_999_999_999 })}.`;
};

describe('tokenSubject', () => {
  it('reads the user id', () => {
    expect(tokenSubject(tokenFor('u1'))).toBe('u1');
  });

  it('is null for a malformed token', () => {
    expect(tokenSubject('not-a-jwt')).toBeNull();
  });
});

describe('sessionAction', () => {
  const signedIn = { status: 'authenticated' as const, userId: 'u1' };
  const guest = { status: 'guest' as const, userId: null };
  const loading = { status: 'loading' as const, userId: null };
  const profile = (id: string) => {
    return {
      id,
      username: 'ada',
      email: null,
      github_login: null,
      name: null,
      avatar_url: null,
      email_verified: false,
      has_password: false,
    };
  };

  it.each([
    [
      'a token while still loading',
      loading,
      { type: 'token' as const, token: tokenFor('u2') },
      'set-token',
    ],
    [
      'a fresh token for the same user',
      signedIn,
      { type: 'token' as const, token: tokenFor('u1') },
      'set-token',
    ],
    [
      'a token while signed out',
      guest,
      { type: 'token' as const, token: tokenFor('u1') },
      'switch-user',
    ],
    [
      'a token for another user',
      signedIn,
      { type: 'token' as const, token: tokenFor('u2') },
      'switch-user',
    ],
    ['this user signing out', signedIn, { type: 'signed-out' as const, userId: 'u1' }, 'clear'],
    [
      'a sign-out that names no user',
      signedIn,
      { type: 'signed-out' as const, userId: null },
      'clear',
    ],
    ['another user signing out', signedIn, { type: 'signed-out' as const, userId: 'u2' }, 'ignore'],
    [
      'a sign-out while already signed out',
      guest,
      { type: 'signed-out' as const, userId: 'u1' },
      'ignore',
    ],
    [
      'this user changing their profile',
      signedIn,
      { type: 'user' as const, user: profile('u1') },
      'set-user',
    ],
    ['another user changing their profile', signedIn, {
      type: 'user' as const,
      user: profile('u2'),
    }, 'ignore'],
  ])('%s', (_, current, message, action) => {
    expect(sessionAction(current, message)).toBe(action);
  });
});
