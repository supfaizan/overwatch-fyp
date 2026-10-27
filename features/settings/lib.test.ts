import { describe, expect, it } from 'vitest';
import { formatCost, formatTokens } from './lib';

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
