import type { Arc } from './constants';

/** The point `t` (0 to 1) of the way along a cubic Bézier. */
export function pointOnArc([p0, p1, p2, p3]: Arc, t: number): [number, number] {
  const u = 1 - t;
  const weights = [u ** 3, 3 * u ** 2 * t, 3 * u * t ** 2, t ** 3];
  return [0, 1].map((axis) => {
    return [p0, p1, p2, p3].reduce((sum, point, i) => {
      return sum + point[axis] * weights[i];
    }, 0);
  }) as [number, number];
}

/** An arc as an SVG path. */
export function arcPath([p0, p1, p2, p3]: Arc): string {
  return `M${p0.join(' ')} C${p1.join(' ')} ${p2.join(' ')} ${p3.join(' ')}`;
}
