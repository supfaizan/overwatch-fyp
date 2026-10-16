import type { User } from '@/shared/session/store';
import { describe, expect, it } from 'vitest';
import { loginMethods } from './login-methods';

const base: User = {
  id: 'u1',
  username: 'ada',
  email: null,
  github_login: null,
  name: null,
  avatar_url: null,
  email_verified: false,
  has_password: false,
};

describe('loginMethods', () => {
  it('never lets the only method go', () => {
    expect(loginMethods({ ...base, github_login: 'octocat' })).toEqual({
      github: { connected: true, removable: false },
      email: { connected: false, removable: false },
    });
    expect(loginMethods({ ...base, email: 'a@x.io', email_verified: true, has_password: true }))
      .toEqual({
        github: { connected: false, removable: false },
        email: { connected: true, removable: false },
      });
  });

  it('lets either go when both are there', () => {
    const both = {
      ...base,
      github_login: 'octocat',
      email: 'a@x.io',
      email_verified: true,
      has_password: true,
    };
    expect(loginMethods(both)).toEqual({
      github: { connected: true, removable: true },
      email: { connected: true, removable: true },
    });
  });
});
