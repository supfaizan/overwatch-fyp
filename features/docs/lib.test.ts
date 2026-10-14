import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SAVE_STATUS, createAutosave, readingMinutes, timeAgo, withImageLinks, type SaveStatus } from './lib';

const CONFLICT = new Error('conflict');

function setup(save: () => Promise<void>) {
  const statuses: SaveStatus[] = [];
  const autosave = createAutosave({ delay: 1000, retryDelay: 5000, save, isConflict: (e) => e === CONFLICT, onStatus: (s) => statuses.push(s) });
  return { autosave, statuses };
}

/** A save that waits until `finish` is called. */
function pendingSave() {
  const finishes: (() => void)[] = [];
  const save = vi.fn(() => new Promise<void>((resolve) => finishes.push(resolve)));
  return { save, finish: () => finishes.shift()?.() };
}

describe('createAutosave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('saves once after typing pauses', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { autosave, statuses } = setup(save);

    autosave.change();
    await vi.advanceTimersByTimeAsync(600);
    autosave.change();
    await vi.advanceTimersByTimeAsync(999);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(save).toHaveBeenCalledTimes(1);
    expect(statuses.at(-1)).toBe(SAVE_STATUS.saved);
  });

  it('never overlaps saves, and sends edits made during one with the next', async () => {
    const { save, finish } = pendingSave();
    const { autosave, statuses } = setup(save);

    autosave.change();
    await vi.advanceTimersByTimeAsync(1000);
    autosave.change();
    await vi.advanceTimersByTimeAsync(5000);
    expect(save).toHaveBeenCalledTimes(1);

    finish();
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toBe(SAVE_STATUS.dirty);
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(2);
    finish();
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toBe(SAVE_STATUS.saved);
  });

  it('stops on a conflict until resumed', async () => {
    const save = vi.fn().mockRejectedValueOnce(CONFLICT).mockResolvedValue(undefined);
    const { autosave, statuses } = setup(save);

    autosave.change();
    await vi.advanceTimersByTimeAsync(1000);
    autosave.change();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(statuses.at(-1)).toBe(SAVE_STATUS.conflict);
    expect(save).toHaveBeenCalledTimes(1);
    expect(autosave.hasUnsaved()).toBe(true);

    await autosave.resume();
    expect(save).toHaveBeenCalledTimes(2);
    expect(statuses.at(-1)).toBe(SAVE_STATUS.saved);
  });

  it('retries a failed save', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const { autosave, statuses } = setup(save);

    autosave.change();
    await vi.advanceTimersByTimeAsync(1000);
    expect(statuses.at(-1)).toBe(SAVE_STATUS.error);
    await vi.advanceTimersByTimeAsync(5000);

    expect(save).toHaveBeenCalledTimes(2);
    expect(statuses.at(-1)).toBe(SAVE_STATUS.saved);
  });

  it('flushes at once and does nothing when there is nothing to save', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { autosave } = setup(save);

    await autosave.flush();
    autosave.change();
    await autosave.flush();

    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe('readingMinutes', () => {
  it('counts words at 200 a minute, at least one', () => {
    expect(readingMinutes(null)).toBe(1);
    expect(readingMinutes('# Title\n\n**short** note')).toBe(1);
    expect(readingMinutes(Array(1000).fill('word').join(' '))).toBe(5);
  });
});

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

describe('withImageLinks', () => {
  it('gives uploaded images fresh links and drops ones that never finished uploading', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'image', attrs: { attachmentId: 'a1', src: 'https://old' } },
        { type: 'image', attrs: { attachmentId: 'gone', src: 'https://old' } },
        { type: 'image', attrs: { attachmentId: null, src: 'blob:http://x/1' } },
        { type: 'image', attrs: { attachmentId: null, src: 'https://pasted.example/a.png' } },
        { type: 'blockquote', content: [{ type: 'image', attrs: { attachmentId: 'a1', src: 'x' } }] },
      ],
    };

    const out = withImageLinks(doc, { a1: 'https://fresh' });

    expect(out.content?.map((n) => n.attrs?.src ?? n.type)).toEqual(['https://fresh', 'https://pasted.example/a.png', 'blockquote']);
    expect(out.content?.[2].content?.[0].attrs?.src).toBe('https://fresh');
  });
});
