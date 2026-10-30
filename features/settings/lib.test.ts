import { describe, expect, it } from 'vitest';
import { formatCost, formatTokens, meterTone, usageBuckets } from './lib';
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
  it('shows cents, or four places for amounts under a cent', () => {
    expect([formatCost(0), formatCost(1.5), formatCost(0.0012)]).toEqual([
      '$0.00',
      '$1.50',
      '$0.0012',
    ]);
  });
});

const summaryOf = (days: number, byDay: UsageSummary['by_day']): UsageSummary => {
  const zero = { calls: 0, prompt_tokens: 0, completion_tokens: 0, cached_tokens: 0, cost_usd: 0 };
  return { days, time_zone: 'UTC', total: zero, by_day: byDay, by_feature: [], by_member: [] };
};

const dayOf = (
  day: string,
  byFeature: Record<string, number>,
  byMember: Record<string, number>,
) => {
  return {
    day,
    calls: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    cached_tokens: 0,
    cost_usd: 0,
    calls_by_feature: byFeature,
    calls_by_member: byMember,
  };
};

describe('usageBuckets', () => {
  const today = new Date(2026, 9, 30, 9);

  it('has a bar for every day of the period, oldest first, empty days included', () => {
    const buckets = usageBuckets(
      summaryOf(3, [
        dayOf('2026-10-30', { chat: 2 }, { u1: 2 }),
        dayOf('2026-10-28', { chat: 1 }, {}),
      ]),
      today,
    );

    expect(buckets.map((b) => {
      return [b.start, b.byFeature];
    })).toEqual([
      ['2026-10-28', { chat: 1 }],
      ['2026-10-29', {}],
      ['2026-10-30', { chat: 2 }],
    ]);
  });

  it('groups long periods into weeks ending today, adding up their days', () => {
    const buckets = usageBuckets(
      summaryOf(90, [
        dayOf('2026-10-30', { chat: 2 }, { u1: 2 }),
        dayOf('2026-10-24', { chat: 1, decision_check: 3 }, { u1: 1, system: 3 }),
        dayOf('2026-10-23', { chat: 5 }, { u2: 5 }),
      ]),
      today,
    );

    expect(buckets).toHaveLength(13);
    expect(buckets.at(-1)).toEqual({
      start: '2026-10-24',
      end: '2026-10-30',
      byFeature: { chat: 3, decision_check: 3 },
      byMember: { u1: 3, system: 3 },
    });
    expect(buckets.at(-2)?.byFeature).toEqual({ chat: 5 });
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
