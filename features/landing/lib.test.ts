import { describe, expect, it } from 'vitest';
import type { Arc } from './constants';
import { arcPath, pointOnArc } from './lib';

const ARC: Arc = [[0, 0], [0, 100], [100, 100], [100, 0]];

describe('pointOnArc', () => {
  it('starts and ends on the arc ends', () => {
    expect(pointOnArc(ARC, 0)).toEqual([0, 0]);
    expect(pointOnArc(ARC, 1)).toEqual([100, 0]);
  });
  it('finds the middle of a symmetric arc', () => {
    expect(pointOnArc(ARC, 0.5)).toEqual([50, 75]);
  });
});

describe('arcPath', () => {
  it('draws one cubic curve', () => {
    expect(arcPath(ARC)).toBe('M0 0 C0 100 100 100 100 0');
  });
});
