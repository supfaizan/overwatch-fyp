import { describe, expect, it } from 'vitest';
import {
  highlightParts,
  isActive,
  isCommandShortcut,
  resultHref,
  shortcutLabel,
  sourceLabel,
} from './lib';

describe('isActive', () => {
  it('matches the page and pages under it, not a longer sibling', () => {
    expect(isActive('/dashboard', '/dashboard')).toBe(true);
    expect(isActive('/settings/profile', '/settings')).toBe(true);
    expect(isActive('/dashboards', '/dashboard')).toBe(false);
    expect(isActive('/board', '/dashboard')).toBe(false);
  });
});

describe('isCommandShortcut', () => {
  const key = (overrides: Partial<Parameters<typeof isCommandShortcut>[0]>) => {
    return isCommandShortcut({
      key: 'k',
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      isComposing: false,
      ...overrides,
    });
  };

  it('opens on ⌘K or Ctrl+K, caps lock included', () => {
    expect(key({ metaKey: true })).toBe(true);
    expect(key({ ctrlKey: true })).toBe(true);
    expect(key({ key: 'K', metaKey: true })).toBe(true);
  });

  it('ignores a plain k, Alt chords and input-method composition', () => {
    expect(key({})).toBe(false);
    expect(key({ metaKey: true, altKey: true })).toBe(false);
    expect(key({ metaKey: true, isComposing: true })).toBe(false);
  });
});

describe('shortcutLabel', () => {
  it('shows ⌘ on a Mac and Ctrl elsewhere', () => {
    expect(shortcutLabel(true)).toBe('⌘K');
    expect(shortcutLabel(false)).toBe('Ctrl K');
  });
});

describe('search results', () => {
  const ticket = {
    kind: 'work_item',
    id: 'i1',
    title: 'Imports',
    source: 'jira',
    key: 'DEV-1449',
    board_id: 'b1',
    snippet: null,
  } as const;

  it('opens a page by id and an item on its board by key, even without a board', () => {
    expect(resultHref({ ...ticket, kind: 'document', key: null, board_id: null })).toBe(
      '/documents/i1',
    );
    expect(resultHref(ticket)).toBe('/board?board=b1&item=DEV-1449');
    expect(resultHref({ ...ticket, board_id: null })).toBe('/board?item=DEV-1449');
  });

  it('marks every match whatever its case', () => {
    expect(highlightParts('Order imports, then IMPORTS again', 'imports')).toEqual([
      { text: 'Order ', match: false },
      { text: 'imports', match: true },
      { text: ', then ', match: false },
      { text: 'IMPORTS', match: true },
      { text: ' again', match: false },
    ]);
    expect(highlightParts('abc', ' ')).toEqual([{ text: 'abc', match: false }]);
    // 'İ' lowercases to two characters, which must not shift the match
    expect(highlightParts('İstanbul plan', 'plan')).toEqual([
      { text: 'İstanbul ', match: false },
      { text: 'plan', match: true },
    ]);
  });

  it('names a source, and nothing for our own', () => {
    expect(sourceLabel('confluence')).toBe('Confluence');
    expect(sourceLabel('native')).toBeNull();
  });
});
