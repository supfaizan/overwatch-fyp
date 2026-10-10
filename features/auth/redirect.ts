const DESTINATION_KEY = 'ow_after_sign_in';
export const DEFAULT_DESTINATION = '/onboarding';

/** Only same-site paths: `//evil.com` and `/\evil.com` would leave the site. */
export function safeDestination(path: string | null | undefined): string {
  return path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') ? path : DEFAULT_DESTINATION;
}

export function rememberDestination(from: string | undefined): void {
  try {
    sessionStorage.setItem(DESTINATION_KEY, safeDestination(from));
  } catch {
    // storage blocked: the user just lands on the default page
  }
}

export function takeDestination(): string {
  try {
    const path = sessionStorage.getItem(DESTINATION_KEY);
    sessionStorage.removeItem(DESTINATION_KEY);
    return safeDestination(path);
  } catch {
    return DEFAULT_DESTINATION;
  }
}
