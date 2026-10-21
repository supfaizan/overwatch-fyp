import { describe, expect, it } from 'vitest';
import { tokenFromUrl } from './token';

describe('tokenFromUrl', () => {
  it('reads the fragment of a new link', () => {
    expect(tokenFromUrl('#abc-123_x', '/invite')).toBe('abc-123_x');
  });

  it('reads the path of a link sent before fragments', () => {
    expect(tokenFromUrl('', '/invite/abc-123_x')).toBe('abc-123_x');
  });

  it('finds nothing on a bare invite page', () => {
    expect(tokenFromUrl('', '/invite')).toBeNull();
    expect(tokenFromUrl('#', '/invite/')).toBeNull();
  });
});
