/** Non-secret cookie that only tells proxy.ts a session probably exists; the API still checks every request. */
export const SESSION_HINT_COOKIE = 'ow_session';

/** BroadcastChannel tabs use to share new access tokens and sign-outs. */
export const SESSION_CHANNEL = 'overwatch-session';
/** Web Lock that keeps refreshes one at a time across tabs. */
export const REFRESH_LOCK = 'overwatch-session-refresh';
