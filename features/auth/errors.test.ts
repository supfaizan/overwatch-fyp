import { describe, expect, it } from 'vitest';
import { signInErrorMessage } from './errors';

describe('signInErrorMessage', () => {
  it('explains known callback errors', () => {
    expect(signInErrorMessage('oauth_cancelled')).toBe('GitHub sign-in was cancelled.');
  });

  it('falls back for unknown codes and stays quiet without one', () => {
    expect(signInErrorMessage('something_new')).toBe('Sign-in failed. Please try again.');
    expect(signInErrorMessage(undefined)).toBeNull();
  });
});
