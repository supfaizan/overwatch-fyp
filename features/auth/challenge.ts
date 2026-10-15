import type { ChallengeIssued } from './api';
import type { ChallengePurpose } from './constants';

/**
 * The code being waited for, kept for this tab only: the challenge id (useless without the emailed
 * code), the address it went to, and when another may be sent. Never put in the URL.
 */
export type Challenge = { id: string; email: string; purpose: ChallengePurpose; resendAt: number };

const CHALLENGE_KEY = 'ow_auth_challenge';

export function saveChallenge(
  { challenge_id, email, resend_available_in }: ChallengeIssued,
  purpose: ChallengePurpose,
  now = Date.now(),
): Challenge {
  const challenge = {
    id: challenge_id,
    email,
    purpose,
    resendAt: now + resend_available_in * 1000,
  };
  try {
    sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
  } catch {
    // storage blocked: the code screen asks the user to start again
  }
  return challenge;
}

export function readChallenge(purpose: ChallengePurpose): Challenge | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(CHALLENGE_KEY) ?? 'null');
    if (!value || typeof value !== 'object') {
      return null;
    }
    const challenge = value as Partial<Challenge>;
    const valid = typeof challenge.id === 'string' && typeof challenge.email === 'string'
      && typeof challenge.resendAt === 'number';
    return valid && challenge.purpose === purpose ? (challenge as Challenge) : null;
  } catch {
    return null;
  }
}

export function setResendAt(seconds: number, now = Date.now()): void {
  try {
    const value = sessionStorage.getItem(CHALLENGE_KEY);
    if (value) {
      sessionStorage.setItem(
        CHALLENGE_KEY,
        JSON.stringify({ ...JSON.parse(value), resendAt: now + seconds * 1000 }),
      );
    }
  } catch {
    // storage blocked: the countdown just restarts from the server's answer
  }
}

export function clearChallenge(): void {
  try {
    sessionStorage.removeItem(CHALLENGE_KEY);
  } catch {
    // nothing stored
  }
}
