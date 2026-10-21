import type { ChallengeIssued } from './api';
import type { ChallengePurpose } from './constants';

/**
 * The code being waited for, kept for this tab only: the challenge id (useless without the emailed
 * code), the address it went to, and when another may be sent. Never put in the URL.
 */
export type Challenge = { id: string; email: string; purpose: ChallengePurpose; resendAt: number };

const CHALLENGE_KEY = 'ow_auth_challenge';

/** The challenge the backend just issued, as this tab tracks it. */
export function challengeFrom(
  { challenge_id, email, resend_available_in }: ChallengeIssued,
  purpose: ChallengePurpose,
  now = Date.now(),
): Challenge {
  return { id: challenge_id, email, purpose, resendAt: now + resend_available_in * 1000 };
}

/** Keep the challenge for the code screen the browser goes to next. */
export function saveChallenge(
  issued: ChallengeIssued,
  purpose: ChallengePurpose,
  now = Date.now(),
): Challenge {
  const challenge = challengeFrom(issued, purpose, now);
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

/** Move a stored challenge's resend countdown; a challenge kept only in a dialog's state has nothing stored. */
export function setResendAt(id: string, seconds: number, now = Date.now()): void {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(CHALLENGE_KEY) ?? 'null');
    if (stored && typeof stored === 'object' && (stored as Partial<Challenge>).id === id) {
      sessionStorage.setItem(
        CHALLENGE_KEY,
        JSON.stringify({ ...stored, resendAt: now + seconds * 1000 }),
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
