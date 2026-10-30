const BASE_MS = 500;
const MAX_MS = 30_000;

/**
 * How long to wait before reconnect `attempt` (0 first): a random time up to an exponentially
 * growing cap ("full jitter"), so tabs dropped together don't all come back at the same moment.
 */
export function reconnectDelay(attempt: number, random: () => number = Math.random): number {
  return Math.round(random() * Math.min(MAX_MS, BASE_MS * 2 ** attempt));
}
