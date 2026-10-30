import { describe, expect, it } from 'vitest';
import { shares } from './bar-chart';

describe('shares', () => {
  it('rounds to whole percents that still add up to 100', () => {
    expect(shares([1, 1, 1])).toEqual([34, 33, 33]);
    expect(shares([3, 21, 32])).toEqual([5, 38, 57]);
  });

  it('is all zeros when nothing was counted', () => {
    expect(shares([0, 0])).toEqual([0, 0]);
  });
});
