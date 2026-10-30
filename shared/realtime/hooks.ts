'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { realtimeClient, type RealtimeStatus, type TopicListener } from './client';

/**
 * Listen to a realtime topic (`decision:<id>`) while the component is mounted; `null` listens to
 * nothing. Handlers can change on every render without resubscribing.
 */
export function useRealtimeTopic(topic: string | null, listener: TopicListener): void {
  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  });
  useEffect(() => {
    if (!topic) {
      return;
    }
    return realtimeClient().subscribe(topic, {
      onEvent: (event) => {
        return latest.current.onEvent(event);
      },
      onResync: () => {
        return latest.current.onResync();
      },
      onEnd: (reason) => {
        return latest.current.onEnd?.(reason);
      },
    });
  }, [topic]);
}

/** The realtime connection's state, e.g. to show "Reconnecting…". */
export function useRealtimeStatus(): RealtimeStatus {
  const client = realtimeClient();
  return useSyncExternalStore(client.onStatus, client.getStatus, () => {
    return 'idle';
  });
}

/** Send a signal (like typing) to a topic this tab listens to. */
export function realtimeSignal(topic: string, name: string, state: 'start' | 'stop'): void {
  realtimeClient().signal(topic, name, state);
}
