import { describe, expect, it } from 'vitest';
import { filledTicks, formatCost, formatTokens, meterTone, usageBuckets } from './lib';
import type { UsageSummary } from './types';

describe('formatTokens', () => {
  it('shortens large counts', () => {
    expect([formatTokens(950), formatTokens(12_340), formatTokens(4_100_000)]).toEqual([
      '950',
      '12.3K',
      '4.1M',
    ]);
  });
});

describe('formatCost', () => {
  it('shows cents, and amounts under a cent as less than one', () => {
    expect([formatCost(0), formatCost(1.5), formatCost(0.0012)]).toEqual([
      '$0.00',
      '$1.50',
      '<$0.01',
    ]);
  });
});

const totals = (actions: number) => {
  return {
    actions,
    calls: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    cached_tokens: 0,
    cost_usd: 0,
  };
};

const summaryOf = (days: number, byDay: [string, number][]): UsageSummary => {
  return {
    days,
    time_zone: 'UTC',
    total: totals(0),
    by_day: byDay.map(([day, actions]) => {
      return { day, ...totals(actions) };
    }),
    by_member: [],
  };
};

describe('usageBuckets', () => {
  const today = new Date(2026, 9, 30, 9);

  it('has a bar for every day of the period, oldest first, empty days included', () => {
    const buckets = usageBuckets(summaryOf(3, [['2026-10-30', 2], ['2026-10-28', 1]]), today);

    expect(buckets.map((b) => {
      return [b.start, b.actions];
    })).toEqual([
      ['2026-10-28', 1],
      ['2026-10-29', 0],
      ['2026-10-30', 2],
    ]);
  });

  it('groups long periods into weeks ending today, adding up their days', () => {
    const buckets = usageBuckets(
      summaryOf(90, [['2026-10-30', 2], ['2026-10-24', 4], ['2026-10-23', 5]]),
      today,
    );

    expect(buckets).toHaveLength(13);
    expect(buckets.at(-1)).toEqual({ start: '2026-10-24', end: '2026-10-30', actions: 6 });
    expect(buckets.at(-2)?.actions).toBe(5);
  });
});

describe('meterTone', () => {
  it('warns from 80% and is full once nothing is left, or past a lowered limit', () => {
    expect([meterTone(10, 20), meterTone(16, 20), meterTone(20, 20), meterTone(25, 20)]).toEqual([
      'ok',
      'warning',
      'full',
      'full',
    ]);
  });
});

describe('filledTicks', () => {
  it('fills a tick only once it is earned, all of them when full or past a lowered limit', () => {
    expect([
      filledTicks(0, 1000, 20),
      filledTicks(214, 1000, 20),
      filledTicks(999, 1000, 20),
      filledTicks(1000, 1000, 20),
      filledTicks(25, 20, 20),
      filledTicks(5, 0, 20),
    ]).toEqual([0, 4, 19, 20, 20, 20]);
  });
});
