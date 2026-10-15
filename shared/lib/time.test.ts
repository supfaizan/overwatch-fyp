import { describe, expect, it } from 'vitest';
import { timeAgo } from './time';

describe('timeAgo', () => {
  const now = Date.parse('2026-10-14T12:00:00Z');
  it('reads like Confluence', () => {
    expect(timeAgo('2026-10-14T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-10-14T11:55:00Z', now)).toBe('5 minutes ago');
    expect(timeAgo('2026-10-14T09:00:00Z', now)).toBe('3 hours ago');
    expect(timeAgo('2026-10-13T12:00:00Z', now)).toBe('yesterday');
    expect(timeAgo('2026-09-30T12:00:00Z', now)).toBe('2 weeks ago');
    expect(timeAgo('2026-08-01T12:00:00Z', now)).toBe('Aug 1, 2026');
  });
});
