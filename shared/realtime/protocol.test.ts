import { describe, expect, it } from 'vitest';
import { reconnectDelay } from './backoff';
import { parseServerFrame, realtimeUrl } from './protocol';

describe('parseServerFrame', () => {
  it('reads the frames it knows and ignores the rest', () => {
    const event = {
      type: 'event',
      id: 'e1',
      topic: 'decision:d1',
      event: 'decision.comment.created',
      ts: '2026-10-29T10:00:00Z',
      data: { id: 'm1' },
    };
    expect(parseServerFrame(JSON.stringify(event))).toEqual(event);
    expect(parseServerFrame('{"type":"later","x":1}')).toBeNull();
    expect(parseServerFrame('not json')).toBeNull();
    expect(parseServerFrame(new ArrayBuffer(2))).toBeNull();
  });
});

describe('realtimeUrl', () => {
  it('turns the API address into its socket address', () => {
    expect(realtimeUrl('https://api.usebearings.app')).toBe('wss://api.usebearings.app/realtime');
    expect(realtimeUrl('http://localhost:8000')).toBe('ws://localhost:8000/realtime');
  });
});

describe('reconnectDelay', () => {
  it('waits up to a cap that doubles with each attempt, never past 30 s', () => {
    const most = () => {
      return 1;
    };
    expect([0, 1, 2, 10].map((attempt) => {
      return reconnectDelay(attempt, most);
    })).toEqual([500, 1000, 2000, 30_000]);
    expect(reconnectDelay(3, () => {
      return 0.5;
    })).toBe(2000);
  });
});
