import { describe, expect, it } from 'vitest';
import { waitlistSchema } from './schemas';

const ENTRY = { name: 'Ada Lovelace', email: 'ada@example.com', heard_from: 'friend' };

describe('waitlist rules', () => {
  it('trims the name and email', () => {
    const result = waitlistSchema.safeParse({
      ...ENTRY,
      name: '  Ada ',
      email: ' ada@example.com ',
    });
    expect(result.success && result.data).toEqual({ ...ENTRY, name: 'Ada' });
  });

  it('only accepts a listed source', () => {
    expect(waitlistSchema.safeParse({ ...ENTRY, heard_from: 'carrier pigeon' }).success).toBe(
      false,
    );
    expect(waitlistSchema.safeParse({ ...ENTRY, heard_from: undefined }).success).toBe(false);
  });

  it('puts each problem on its own field', () => {
    const result = waitlistSchema.safeParse({ name: ' ', email: 'nope', heard_from: '' });
    const fields = result.success ? [] : result.error.issues.map((issue) => {
      return issue.path[0];
    });
    expect(fields.sort()).toEqual(['email', 'heard_from', 'name']);
  });
});
