import { describe, expect, it } from 'vitest';
import {
  allMessages,
  applyChange,
  type CachedDiscussion,
  canDelete,
  canEdit,
  dayLabel,
  readEvent,
  removeMessage,
  threadRows,
  typingLabel,
  upsertMessage,
} from './lib';
import type { DiscussionMessage } from './types';

const message = (
  id: string,
  { author = 'u1', at = '2026-10-29T10:00:00', version = 1, body = id } = {},
): DiscussionMessage => {
  return {
    id,
    decision_id: 'd1',
    author: { id: author, name: author },
    body,
    client_id: null,
    reactions: [],
    attachments: [],
    version,
    edited: version > 1,
    created_at: at,
    updated_at: at,
  };
};

const cached = (...pages: DiscussionMessage[][]): CachedDiscussion => {
  return {
    pages: pages.map((messages) => {
      return { messages, hasMore: false };
    }),
    pageParams: pages.map((_, index) => {
      return index ? `p${index}` : null;
    }),
  };
};

const ids = (data: CachedDiscussion | undefined) => {
  return allMessages(data).map((m) => {
    return m.id;
  });
};

describe('upsertMessage and removeMessage', () => {
  it('adds a new message to the newest page in id order, and reads pages oldest first', () => {
    const data = cached([message('m3'), message('m5')], [message('m1')]);
    expect(ids(upsertMessage(data, message('m4')))).toEqual(['m1', 'm3', 'm4', 'm5']);
  });

  it('keeps the newest copy whichever arrives last, and ignores duplicates', () => {
    const data = cached([message('m1', { body: 'v2', version: 2 })]);
    expect(upsertMessage(data, message('m1', { body: 'v1', version: 1 }))).toBe(data);
    expect(upsertMessage(data, message('m1', { body: 'v2', version: 2 }))).toBe(data);
    expect(allMessages(upsertMessage(data, message('m1', { body: 'v3', version: 3 })))[0].body)
      .toBe('v3');
  });

  it('removes a message from whichever page holds it', () => {
    expect(ids(removeMessage(cached([message('m2')], [message('m1')]), 'm1'))).toEqual(['m2']);
    expect(upsertMessage(undefined, message('m1'))).toBeUndefined();
  });
});

describe('threadRows', () => {
  const now = new Date('2026-10-29T12:00:00');

  it('separates days and groups an author’s quick follow-ups', () => {
    const rows = threadRows([
      message('a', { at: '2026-10-28T09:00:00' }),
      message('b', { at: '2026-10-29T09:00:00' }),
      message('c', { at: '2026-10-29T09:03:00' }),
      message('d', { at: '2026-10-29T09:20:00' }),
      message('e', { at: '2026-10-29T09:21:00', author: 'u2' }),
    ], now);

    expect(rows.map((row) => {
      return row.kind === 'day' ? row.label : `${row.message.id}${row.continued ? '+' : ''}`;
    })).toEqual(['Yesterday', 'a', 'Today', 'b', 'c+', 'd', 'e']);
  });

  it('names older days by date, with the year only when it isn’t this one', () => {
    expect(dayLabel('2026-10-20T09:00:00', now)).toBe('Tue 20 Oct');
    expect(dayLabel('2025-10-20T09:00:00', now)).toBe('Mon, 20 Oct 2025');
  });
});

describe('canEdit and canDelete', () => {
  it('lets the author edit, and the author or an admin delete', () => {
    const mine = message('m1', { author: 'me' });
    expect([canEdit(mine, 'me'), canEdit(mine, 'you'), canEdit(mine, undefined)]).toEqual([
      true,
      false,
      false,
    ]);
    expect([canDelete(mine, 'you', false), canDelete(mine, 'you', true)]).toEqual([false, true]);
  });
});

describe('readEvent and applyChange', () => {
  it('reads message events and applies them like the REST answers', () => {
    const data = cached([message('m1')]);
    const created = readEvent('decision.comment.created', { message: message('m2') });
    const deleted = readEvent('decision.comment.deleted', { id: 'm1' });

    expect(created?.kind).toBe('upsert');
    expect(ids(applyChange(applyChange(data, created!), deleted!))).toEqual(['m2']);
  });

  it('reads typing, and ignores events it doesn’t know or can’t read', () => {
    expect(readEvent('decision.typing.started', { user: { id: 'u2', name: 'sara' } })).toEqual({
      kind: 'typing',
      user: { id: 'u2', name: 'sara' },
      typing: true,
    });
    expect(readEvent('decision.comment.created', { message: { id: 'm1' } })).toBeNull();
    expect(readEvent('decision.renamed', {})).toBeNull();
  });
});

describe('typingLabel', () => {
  it('names up to three people, then says several', () => {
    expect(
      [[], ['beelal'], ['beelal', 'sara'], ['a', 'b', 'c'], ['a', 'b', 'c', 'd']].map(typingLabel),
    )
      .toEqual([
        '',
        'beelal is typing…',
        'beelal and sara are typing…',
        'a, b and c are typing…',
        'Several people are typing…',
      ]);
  });
});
