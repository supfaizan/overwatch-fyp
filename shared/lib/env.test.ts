import { describe, expect, it } from 'vitest';
import { parseFlag, parseProductName } from './env';

describe('parseProductName', () => {
  it('writes each brand the way users see it', () => {
    expect(parseProductName('overwatch')).toBe('Overwatch');
    expect(parseProductName('bearings')).toBe('Bearings');
  });
  it('defaults to Overwatch when unset', () => {
    expect(parseProductName(undefined)).toBe('Overwatch');
    expect(parseProductName('')).toBe('Overwatch');
  });
  it('refuses anything else', () => {
    expect(() => {
      return parseProductName('Bearings');
    }).toThrow('NEXT_PUBLIC_PRODUCT_NAME must be one of overwatch, bearings; got "Bearings"');
    expect(() => {
      return parseProductName('toString');
    }).toThrow();
  });
});

describe('parseFlag', () => {
  it('reads true and false, and unset as false', () => {
    expect(parseFlag('FLAG', 'true')).toBe(true);
    expect(parseFlag('FLAG', 'false')).toBe(false);
    expect(parseFlag('FLAG', undefined)).toBe(false);
    expect(parseFlag('FLAG', '')).toBe(false);
  });
  it('refuses anything else', () => {
    expect(() => {
      return parseFlag('FLAG', 'yes');
    }).toThrow('FLAG must be true or false; got "yes"');
  });
});
