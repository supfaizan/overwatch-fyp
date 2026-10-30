import type { InfiniteData } from '@tanstack/react-query';
import { z } from 'zod';
import type { DiscussionMessage, DiscussionPage } from './types';

/** The cached discussion: `pages[0]` is the newest page, each next one older. */
export type CachedDiscussion = InfiniteData<DiscussionPage>;

/** Messages by the same author within this long of each other share one header. */
const GROUP_WITHIN_MS = 5 * 60_000;

const byId = (a: DiscussionMessage, b: DiscussionMessage) => {
  return a.id < b.id ? -1 : 1;
};

/**
 * The discussion with `message` in it: a new one joins the newest page, a known one is replaced
 * only by a higher version, so duplicates and late arrivals change nothing.
 */
export function upsertMessage(
  data: CachedDiscussion | undefined,
  message: DiscussionMessage,
): CachedDiscussion | undefined {
  if (!data) {
    return data;
  }
  const known = data.pages.flatMap((page) => {
    return page.messages;
  }).find((candidate) => {
    return candidate.id === message.id;
  });
  if (known && known.version >= message.version) {
    return data;
  }
  const pages = data.pages.map((page, index) => {
    if (known) {
      return {
        ...page,
        messages: page.messages.map((candidate) => {
          return candidate.id === message.id ? message : candidate;
        }),
      };
    }
    return index === 0 ? { ...page, messages: [...page.messages, message].sort(byId) } : page;
  });
  return { ...data, pages };
}

/** The discussion without the message `id`. */
export function removeMessage(
  data: CachedDiscussion | undefined,
  id: string,
): CachedDiscussion | undefined {
  if (!data) {
    return data;
  }
  return {
    ...data,
    pages: data.pages.map((page) => {
      return {
        ...page,
        messages: page.messages.filter((message) => {
          return message.id !== id;
        }),
      };
    }),
  };
}

/** Every loaded message, oldest first. */
export function allMessages(data: CachedDiscussion | undefined): DiscussionMessage[] {
  return (data?.pages ?? []).toReversed().flatMap((page) => {
    return page.messages;
  });
}

const dayKey = (date: Date) => {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

/** A day separator's label: "Today", "Yesterday", else the date ("Tue 28 Oct", or "Mon, 20 Oct 2025" in another year). */
export function dayLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(date) === dayKey(now)) {
    return 'Today';
  }
  if (dayKey(date) === dayKey(yesterday)) {
    return 'Yesterday';
  }
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  }).format(date);
}

/** A row of the thread: a day separator, or a message (`continued` when it follows its author's last one closely, so it drops the header). */
export type ThreadRow =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: DiscussionMessage; continued: boolean };

/** The thread as shown: a separator before each day's first message, and an author's quick follow-ups grouped. */
export function threadRows(messages: DiscussionMessage[], now: Date): ThreadRow[] {
  const rows: ThreadRow[] = [];
  let previous: DiscussionMessage | null = null;
  for (const message of messages) {
    const at = new Date(message.created_at);
    const sameDay = previous !== null && dayKey(new Date(previous.created_at)) === dayKey(at);
    if (!sameDay) {
      rows.push({
        kind: 'day',
        key: `day-${dayKey(at)}`,
        label: dayLabel(message.created_at, now),
      });
    }
    const continued = previous !== null && sameDay
      && previous.author.id === message.author.id
      && at.getTime() - new Date(previous.created_at).getTime() < GROUP_WITHIN_MS;
    rows.push({ kind: 'message', key: message.id, message, continued });
    previous = message;
  }
  return rows;
}

/** Mirrors the backend: a message's author edits it. */
export function canEdit(message: DiscussionMessage, userId: string | undefined): boolean {
  return Boolean(userId) && message.author.id === userId;
}

/** Mirrors the backend: a message's author or an admin deletes it. */
export function canDelete(
  message: DiscussionMessage,
  userId: string | undefined,
  isAdmin: boolean,
): boolean {
  return isAdmin || canEdit(message, userId);
}

/** The discussion's realtime events (the backend's EventName). */
export const DISCUSSION_EVENT = {
  created: 'decision.comment.created',
  updated: 'decision.comment.updated',
  deleted: 'decision.comment.deleted',
  typingStarted: 'decision.typing.started',
  typingStopped: 'decision.typing.stopped',
} as const;

const messageSchema = z.object({
  id: z.string(),
  decision_id: z.string(),
  author: z.object({ id: z.string().nullable(), name: z.string().nullable() }),
  body: z.string(),
  client_id: z.string().nullable(),
  reactions: z.array(z.object({ emoji: z.string(), user_ids: z.array(z.string()) })),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    content_type: z.string(),
    kind: z.string(),
    size: z.number(),
  })),
  version: z.number(),
  edited: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
const messageEvent = z.object({ message: messageSchema });
const deletedEvent = z.object({ id: z.string() });
const typingEvent = z.object({ user: z.object({ id: z.string(), name: z.string() }) });

/** What a realtime event does to the discussion, read and checked; null for one it doesn't know. */
export type DiscussionChange =
  | { kind: 'upsert'; message: DiscussionMessage }
  | { kind: 'remove'; id: string }
  | { kind: 'typing'; user: { id: string; name: string }; typing: boolean };

export function readEvent(name: string, data: unknown): DiscussionChange | null {
  switch (name) {
    case DISCUSSION_EVENT.created:
    case DISCUSSION_EVENT.updated: {
      const parsed = messageEvent.safeParse(data);
      return parsed.success ? { kind: 'upsert', message: parsed.data.message } : null;
    }
    case DISCUSSION_EVENT.deleted: {
      const parsed = deletedEvent.safeParse(data);
      return parsed.success ? { kind: 'remove', id: parsed.data.id } : null;
    }
    case DISCUSSION_EVENT.typingStarted:
    case DISCUSSION_EVENT.typingStopped: {
      const parsed = typingEvent.safeParse(data);
      return parsed.success
        ? {
          kind: 'typing',
          user: parsed.data.user,
          typing: name === DISCUSSION_EVENT.typingStarted,
        }
        : null;
    }
    default:
      return null;
  }
}

/** The discussion with a change applied; a typing change leaves it as it is. */
export function applyChange(
  data: CachedDiscussion | undefined,
  change: DiscussionChange,
): CachedDiscussion | undefined {
  if (change.kind === 'upsert') {
    return upsertMessage(data, change.message);
  }
  return change.kind === 'remove' ? removeMessage(data, change.id) : data;
}

/** Who's typing, as a line under the thread: one or two names, three, then "Several people". */
export function typingLabel(names: string[]): string {
  if (names.length === 0) {
    return '';
  }
  if (names.length === 1) {
    return `${names[0]} is typing…`;
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]} are typing…`;
  }
  if (names.length === 3) {
    return `${names[0]}, ${names[1]} and ${names[2]} are typing…`;
  }
  return 'Several people are typing…';
}
