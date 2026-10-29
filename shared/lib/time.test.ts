import { describe, expect, it } from 'vitest';
import { fromIsoDay, timeAgo, toIsoDay } from './time';

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

describe('iso days', () => {
  it('reads a day as local midnight, not UTC', () => {
    const day = fromIsoDay('2026-03-01');
    expect([day.getFullYear(), day.getMonth(), day.getDate(), day.getHours()]).toEqual([
      2026,
      2,
      1,
      0,
    ]);
  });

  it('round-trips and pads', () => {
    expect(toIsoDay(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDay(fromIsoDay('2026-12-31'))).toBe('2026-12-31');
  });
});
