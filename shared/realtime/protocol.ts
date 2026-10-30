import { z } from 'zod';

/**
 * The frames of the realtime socket, mirroring the backend (app/realtime/events.py): what the
 * server sends, read and checked here, and the codes it closes with.
 */

/** Why the server closed the socket. */
export const CLOSE_CODE = {
  badMessage: 4400,
  unauthorized: 4401,
  badOrigin: 4403,
  authTimeout: 4408,
  tooMany: 4429,
  /** this tab fell behind and missed events: it reconnects and refetches */
  slowConsumer: 1013,
} as const;

/** Error codes the client acts on (the backend's ErrorCode). */
export const ERROR_CODE = { topicNotFound: 'topic_not_found' } as const;

/** Why a subscription ended without the client asking. */
export const END_REASON = { forbidden: 'forbidden', gone: 'gone', notFound: 'not_found' } as const;
export type EndReason = (typeof END_REASON)[keyof typeof END_REASON];

const eventFrame = z.object({
  type: z.literal('event'),
  id: z.string(),
  topic: z.string(),
  /** `<resource>.<part>.<past_tense_verb>`, e.g. `decision.comment.created` */
  event: z.string(),
  ts: z.string(),
  data: z.unknown(),
});

const serverFrame = z.discriminatedUnion('type', [
  eventFrame,
  z.object({
    type: z.literal('ready'),
    protocol: z.number(),
    user_id: z.string(),
    heartbeat_ms: z.number(),
  }),
  z.object({ type: z.literal('subscribed'), ref: z.string(), topic: z.string() }),
  z.object({ type: z.literal('unsubscribed'), topic: z.string(), reason: z.string() }),
  z.object({ type: z.literal('pong'), ref: z.string() }),
  z.object({
    type: z.literal('error'),
    ref: z.string().optional(),
    code: z.string(),
    message: z.string(),
  }),
]);

export type RealtimeEvent = z.infer<typeof eventFrame>;
export type ServerFrame = z.infer<typeof serverFrame>;

/** A frame from the server, or null when it isn't one this client reads (a newer protocol, say). */
export function parseServerFrame(raw: unknown): ServerFrame | null {
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    const parsed = serverFrame.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** The socket's address on the API's host: `https://api…` becomes `wss://api…/realtime`. */
export function realtimeUrl(apiUrl: string): string {
  const url = new URL('/realtime', apiUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
