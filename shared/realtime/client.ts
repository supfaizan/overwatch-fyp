import { API_URL } from '@/shared/api/envelope';
import { refreshSession } from '@/shared/session/refresh';
import { useSession } from '@/shared/session/store';
import { reconnectDelay } from './backoff';
import {
  CLOSE_CODE,
  END_REASON,
  type EndReason,
  ERROR_CODE,
  parseServerFrame,
  type RealtimeEvent,
  realtimeUrl,
  type ServerFrame,
} from './protocol';

/** What a feature listening to a topic is told. */
export type TopicListener = {
  /** Something happened on the topic. */
  onEvent: (event: RealtimeEvent) => void;
  /**
   * The subscription is (again) in place: events from before it may have been missed, so refetch.
   * Called on every (re)subscribe, including the first, which closes the gap between the page's
   * first fetch and the subscription.
   */
  onResync: () => void;
  /** The server ended the subscription: access lost, or what it's about was deleted. */
  onEnd?: (reason: EndReason) => void;
};

/** `open` once signed in on the socket; `offline` while the browser says there's no network. */
export type RealtimeStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'offline';

/** The socket closes this long after its last topic is dropped, so moving between pages doesn't reconnect. */
const IDLE_CLOSE_MS = 30_000;
/** No pong this long after a ping: the connection is dead even if the browser hasn't noticed. */
const PONG_TIMEOUT_MS = 10_000;
/** After being refused for sending too much, wait at least this long. */
const TOO_MANY_WAIT_MS = 10_000;

/**
 * One socket per tab to `/realtime`, shared by every feature: they subscribe to topics
 * (`decision:<id>`) and get that topic's events. It opens on the first subscription, signs in with
 * the session's token (again whenever it's refreshed), pings to notice a dead connection,
 * reconnects with backoff, and on reconnect resubscribes and asks each listener to refetch.
 *
 * The socket only says what happened; changes are made through the REST API.
 */
export class RealtimeClient {
  private socket: WebSocket | null = null;
  private ready = false;
  private status: RealtimeStatus = 'idle';
  private attempt = 0;
  private refs = 0;
  private readonly listeners = new Map<string, Set<TopicListener>>();
  /** subscribe requests waiting for an answer: ref -> topic */
  private readonly subscribing = new Map<string, string>();
  private readonly statusListeners = new Set<() => void>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private stopSession: (() => void) | null = null;

  /** Listen to a topic; returns the function that stops listening. */
  subscribe(topic: string, listener: TopicListener): () => void {
    const topicListeners = this.listeners.get(topic) ?? new Set();
    const first = topicListeners.size === 0;
    topicListeners.add(listener);
    this.listeners.set(topic, topicListeners);
    this.clearIdle();
    if (first && this.ready) {
      this.requestSubscribe(topic);
    }
    this.start();
    return () => {
      topicListeners.delete(listener);
      if (topicListeners.size > 0) {
        return;
      }
      this.listeners.delete(topic);
      if (this.ready) {
        this.send({ type: 'unsubscribe', ref: this.nextRef(), topic });
      }
      if (this.listeners.size === 0) {
        this.idleTimer = setTimeout(() => {
          return this.stop();
        }, IDLE_CLOSE_MS);
      }
    };
  }

  /** Something passing on a topic this tab listens to, like typing; dropped while disconnected. */
  signal(topic: string, name: string, state: 'start' | 'stop'): void {
    if (this.ready && this.listeners.has(topic)) {
      this.send({ type: 'signal', topic, name, state });
    }
  }

  getStatus = (): RealtimeStatus => {
    return this.status;
  };

  onStatus = (listener: () => void): () => void => {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  };

  private start(): void {
    if (this.stopSession) {
      return;
    }
    // follow the session: a refreshed token signs in again, another user starts over, signing out stops
    let previous = useSession.getState();
    this.stopSession = useSession.subscribe((state) => {
      const userChanged = state.user?.id !== previous.user?.id && previous.user !== null;
      if (!state.token) {
        this.disconnect();
      } else if (userChanged) {
        this.disconnect();
        this.connect();
      } else if (state.token !== previous.token && this.ready) {
        this.send({ type: 'auth', token: state.token });
      } else if (!previous.token) {
        // signed in (or back) while topics were waiting
        this.connect();
      }
      previous = state;
    });
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    document.addEventListener('visibilitychange', this.onVisible);
    this.connect();
  }

  private stop(): void {
    this.stopSession?.();
    this.stopSession = null;
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
    document.removeEventListener('visibilitychange', this.onVisible);
    this.disconnect();
    this.setStatus('idle');
  }

  private connect(): void {
    const { token } = useSession.getState();
    if (this.socket || !token || this.listeners.size === 0) {
      return;
    }
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }
    this.clearReconnect();
    this.setStatus(this.attempt === 0 ? 'connecting' : 'reconnecting');
    const socket = new WebSocket(realtimeUrl(API_URL));
    this.socket = socket;
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', token: useSession.getState().token }));
    };
    socket.onmessage = (message) => {
      const received = parseServerFrame(message.data);
      if (received) {
        this.handle(received);
      }
    };
    socket.onclose = (closed) => {
      // a socket replaced or stopped on purpose has nothing more to do
      if (this.socket === socket) {
        this.onClosed(closed.code);
      }
    };
  }

  private handle(received: ServerFrame): void {
    switch (received.type) {
      case 'ready':
        this.ready = true;
        this.attempt = 0;
        this.setStatus('open');
        this.startHeartbeat(received.heartbeat_ms);
        for (const topic of this.listeners.keys()) {
          this.requestSubscribe(topic);
        }
        return;
      case 'subscribed':
        this.subscribing.delete(received.ref);
        this.each(received.topic, (listener) => {
          return listener.onResync();
        });
        return;
      case 'event':
        this.each(received.topic, (listener) => {
          return listener.onEvent(received);
        });
        return;
      case 'unsubscribed':
        if (received.reason === END_REASON.forbidden || received.reason === END_REASON.gone) {
          const reason = received.reason;
          this.each(received.topic, (listener) => {
            return listener.onEnd?.(reason);
          });
        }
        return;
      case 'pong':
        this.clearPong();
        return;
      case 'error': {
        // a refused subscription: the topic doesn't exist, or this user can't see it
        const topic = received.ref ? this.subscribing.get(received.ref) : undefined;
        if (received.ref) {
          this.subscribing.delete(received.ref);
        }
        if (topic && received.code === ERROR_CODE.topicNotFound) {
          this.each(topic, (listener) => {
            return listener.onEnd?.(END_REASON.notFound);
          });
        }
        return;
      }
    }
  }

  private onClosed(code: number): void {
    this.dropSocket();
    if (code === CLOSE_CODE.badOrigin || this.listeners.size === 0) {
      this.setStatus('idle');
      return;
    }
    if (code === CLOSE_CODE.unauthorized) {
      // the token ran out on the socket: get a new one, then come straight back
      refreshSession().then(
        () => {
          return this.connect();
        },
        () => {
          return this.scheduleReconnect(TOO_MANY_WAIT_MS);
        },
      );
      return;
    }
    this.scheduleReconnect(code === CLOSE_CODE.tooMany ? TOO_MANY_WAIT_MS : 0);
  }

  private scheduleReconnect(atLeastMs: number): void {
    this.setStatus(navigator.onLine ? 'reconnecting' : 'offline');
    if (!navigator.onLine) {
      return;
    }
    const delay = Math.max(atLeastMs, reconnectDelay(this.attempt));
    this.attempt += 1;
    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => {
      return this.connect();
    }, delay);
  }

  private startHeartbeat(everyMs: number): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping', ref: this.nextRef() });
      this.pongTimer ??= setTimeout(() => {
        // a dead connection: closing it reconnects
        return this.socket?.close();
      }, PONG_TIMEOUT_MS);
    }, everyMs);
  }

  private disconnect(): void {
    const socket = this.socket;
    this.dropSocket();
    this.clearReconnect();
    socket?.close(1000);
  }

  private dropSocket(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
    }
    this.socket = null;
    this.ready = false;
    this.subscribing.clear();
    this.stopHeartbeat();
  }

  private send(data: Record<string, unknown>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  private each(topic: string, call: (listener: TopicListener) => void): void {
    // a copy: a listener may stop listening while being called
    for (const listener of Array.from(this.listeners.get(topic) ?? [])) {
      call(listener);
    }
  }

  private setStatus(status: RealtimeStatus): void {
    if (status !== this.status) {
      this.status = status;
      for (const listener of this.statusListeners) {
        listener();
      }
    }
  }

  private requestSubscribe(topic: string): void {
    const ref = this.nextRef();
    this.subscribing.set(ref, topic);
    this.send({ type: 'subscribe', ref, topic });
  }

  private nextRef(): string {
    this.refs += 1;
    return String(this.refs);
  }

  private onOnline = (): void => {
    this.attempt = 0;
    this.connect();
  };

  private onOffline = (): void => {
    this.setStatus('offline');
  };

  // a tab coming back from the background reconnects at once rather than waiting out a backoff
  private onVisible = (): void => {
    if (document.visibilityState === 'visible' && !this.socket) {
      this.attempt = 0;
      this.connect();
    }
  };

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.heartbeatTimer = null;
    this.clearPong();
  }

  private clearPong(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
    }
    this.pongTimer = null;
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = null;
  }

  private clearIdle(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.idleTimer = null;
  }
}

let client: RealtimeClient | null = null;

/** The tab's realtime client, made on first use. */
export function realtimeClient(): RealtimeClient {
  client ??= new RealtimeClient();
  return client;
}
