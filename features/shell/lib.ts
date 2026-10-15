/** A nav link is active on its own page and anything under it (`/settings` on `/settings/profile`). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** ⌘K on a Mac, Ctrl+K elsewhere; never while an input method is composing text. */
export function isCommandShortcut(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'isComposing'>,
): boolean {
  return event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey
    && !event.isComposing;
}

export function shortcutLabel(isMac: boolean): string {
  return isMac ? '⌘K' : 'Ctrl K';
}

const COLLAPSED_KEY = 'ow_sidebar_collapsed';

export function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    // storage blocked: the sidebar just opens expanded next time
  }
}
