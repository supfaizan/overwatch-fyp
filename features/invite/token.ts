const TOKEN_KEY = 'ow_invite_token';
const INVITE_PATH = '/invite';

/** `#token` from a new link, or the last path segment of a link sent before tokens moved into the fragment. */
export function tokenFromUrl(hash: string, pathname: string): string | null {
  const fromHash = hash.replace(/^#/, '');
  if (fromHash) return fromHash;
  const segment = pathname.startsWith(`${INVITE_PATH}/`) ? pathname.slice(INVITE_PATH.length + 1) : '';
  return segment ? decodeURIComponent(segment) : null;
}

/**
 * The invite token for this tab: taken from the address once, then kept in session storage so it
 * survives signing in, and cleared from the address bar (and so from history and screenshots).
 */
export function takeInviteToken(): string | null {
  const fromUrl = tokenFromUrl(window.location.hash, window.location.pathname);
  try {
    if (fromUrl) sessionStorage.setItem(TOKEN_KEY, fromUrl);
    window.history.replaceState(null, '', INVITE_PATH);
    return fromUrl ?? sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return fromUrl;
  }
}

export function forgetInviteToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing stored
  }
}
