import { describe, expect, it } from 'vitest';
import { displayName, handle } from './lib';

describe('people in the UI', () => {
  it('prefers the name, then the username', () => {
    expect(displayName({ name: 'Ada', username: 'ada' })).toBe('Ada');
    expect(displayName({ name: null, username: 'ada' })).toBe('ada');
    expect(displayName({ name: null, username: null, email: 'a@x.dev' })).toBe('a@x.dev');
  });

  it('shows @username, falling back to the GitHub login or the email', () => {
    expect(handle({ name: null, username: 'ada', github_login: 'Lovelace' })).toBe('@ada');
    expect(handle({ name: null, username: null, github_login: 'Lovelace' })).toBe('@Lovelace');
    expect(handle({ name: null, username: null, email: 'a@x.dev' })).toBe('a@x.dev');
  });
});
