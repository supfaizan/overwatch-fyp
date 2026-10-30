import { NATIVE_SOURCE } from '@/shared/lib/integrations';
import { SEARCH_RESULT_KIND, type SearchResult } from './types';

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

/** Characters typed before ⌘K searches items and pages (the API's minimum). */
export const MIN_SEARCH_LENGTH = 2;

/** Where a ⌘K result opens: a page, or an item on its board (by key, so items not on the board still open). */
export function resultHref(result: SearchResult): string {
  if (result.kind === SEARCH_RESULT_KIND.document) {
    return `/documents/${result.id}`;
  }
  // the board's address params (features/board): which board, and which item is open
  const params = new URLSearchParams({
    ...(result.board_id && { board: result.board_id }),
    item: result.key ?? '',
  });
  return `/board?${params}`;
}

/** `text` split around each case-insensitive match of `query`, to mark the matches. */
export function highlightParts(text: string, query: string): { text: string; match: boolean }[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [{ text, match: false }];
  }
  const parts = [];
  let from = 0;
  // compared slice by slice, not in a lowercased copy: lowercasing can change a string's length
  let at = 0;
  while (at + needle.length <= text.length) {
    if (text.slice(at, at + needle.length).toLowerCase() !== needle) {
      at++;
      continue;
    }
    if (at > from) {
      parts.push({ text: text.slice(from, at), match: false });
    }
    parts.push({ text: text.slice(at, at + needle.length), match: true });
    from = at = at + needle.length;
  }
  if (from < text.length) {
    parts.push({ text: text.slice(from), match: false });
  }
  return parts;
}

/** A source as people read it ("jira" → "Jira"); nothing for our own items and pages. */
export function sourceLabel(source: string): string | null {
  return source === NATIVE_SOURCE ? null : source.charAt(0).toUpperCase() + source.slice(1);
}
