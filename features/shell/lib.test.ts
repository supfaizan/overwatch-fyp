import { describe, expect, it } from 'vitest';
import { isActive, isCommandShortcut, shortcutLabel } from './lib';

describe('isActive', () => {
  it('matches the page and pages under it, not a longer sibling', () => {
    expect(isActive('/dashboard', '/dashboard')).toBe(true);
    expect(isActive('/settings/profile', '/settings')).toBe(true);
    expect(isActive('/dashboards', '/dashboard')).toBe(false);
    expect(isActive('/board', '/dashboard')).toBe(false);
  });
});

describe('isCommandShortcut', () => {
  const key = (overrides: Partial<Parameters<typeof isCommandShortcut>[0]>) =>
    isCommandShortcut({ key: 'k', metaKey: false, ctrlKey: false, altKey: false, isComposing: false, ...overrides });

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
