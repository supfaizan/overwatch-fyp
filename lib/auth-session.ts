/* Client-side session plumbing shared by the axios layer and AuthBootstrap.
   Tabs share the refresh cookie but not memory, so token refreshes and logouts
   are broadcast: one tab signing out signs out every tab, and a token minted
   by one tab is adopted by the others instead of each refreshing on its own. */

import { isAxiosError } from "axios";
import { GUEST_REDIRECT, PUBLIC_ROUTES } from "@/constants";

type AuthMessage = { type: "token"; token: string } | { type: "logout" };

const CHANNEL_NAME = "overwatch-auth";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  channel ??= new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function broadcastAuth(message: AuthMessage): void {
  getChannel()?.postMessage(message);
}

/** Subscribe to auth events from other tabs; returns an unsubscribe function. */
export function onAuthBroadcast(
  handler: (message: AuthMessage) => void,
): () => void {
  const current = getChannel();
  if (!current) return () => undefined;

  const listener = (event: MessageEvent<AuthMessage>) => handler(event.data);
  current.addEventListener("message", listener);
  return () => current.removeEventListener("message", listener);
}

/** True only when the server rejected the session itself. Network failures
 *  and 5xx responses are transient and must not log the user out. */
export function isSessionRejected(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401;
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (isPublicRoute(pathname)) return;
  const from = encodeURIComponent(`${pathname}${search}`);
  window.location.assign(`${GUEST_REDIRECT}?from=${from}`);
}
