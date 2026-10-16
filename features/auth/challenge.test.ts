import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearChallenge, readChallenge, saveChallenge, setResendAt } from './challenge';
import { CHALLENGE_PURPOSE } from './constants';

const ISSUED = { challenge_id: 'c1', email: 'ada@example.com', resend_available_in: 60 };

describe('the challenge a tab waits on', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => {
        return store.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        return void store.set(key, value);
      },
      removeItem: (key: string) => {
        return void store.delete(key);
      },
    });
  });

  it('is kept per purpose with its resend time', () => {
    saveChallenge(ISSUED, CHALLENGE_PURPOSE.verifyEmail, 1_000);
    expect(readChallenge(CHALLENGE_PURPOSE.verifyEmail)).toEqual({
      id: 'c1',
      email: 'ada@example.com',
      purpose: 'verify_email',
      resendAt: 61_000,
    });
    expect(readChallenge(CHALLENGE_PURPOSE.resetPassword)).toBeNull();
  });

  it('moves its resend time and can be forgotten', () => {
    saveChallenge(ISSUED, CHALLENGE_PURPOSE.resetPassword, 0);
    setResendAt('c1', 30, 5_000);
    expect(readChallenge(CHALLENGE_PURPOSE.resetPassword)?.resendAt).toBe(35_000);
    // another challenge's countdown (one kept only in a dialog) leaves the stored one alone
    setResendAt('other', 90, 5_000);
    expect(readChallenge(CHALLENGE_PURPOSE.resetPassword)?.resendAt).toBe(35_000);
    clearChallenge();
    expect(readChallenge(CHALLENGE_PURPOSE.resetPassword)).toBeNull();
  });

  it('ignores anything malformed', () => {
    sessionStorage.setItem('ow_auth_challenge', '{"id": 3}');
    expect(readChallenge(CHALLENGE_PURPOSE.verifyEmail)).toBeNull();
  });
});
