import { describe, expect, it } from 'vitest';
import { emojiGlyph } from './inline-nodes';

describe('emojiGlyph', () => {
  it('reads the character from its code points first', () => {
    expect(emojiGlyph({ id: '1f4ca', text: '\\uD83D\\uDCCA' })).toBe('📊');
    expect(emojiGlyph({ id: '1f468-200d-1f469-200d-1f467' })).toBe('👨‍👩‍👧');
  });

  it('decodes escaped text when there are no code points', () => {
    expect(emojiGlyph({ id: '', text: '\\uD83E\\uDD14' })).toBe('🤔');
    expect(emojiGlyph({ text: '🎯' })).toBe('🎯');
  });

  it('keeps a custom emoji as its short name', () => {
    expect(emojiGlyph({ id: 'atlassian-blue_star', shortName: ':blue_star:' })).toBe(':blue_star:');
    expect(emojiGlyph({ id: 'a3f9e2c1-0d4b-4c1e-9f7a-1b2c3d4e5f60', text: ':party:', shortName: ':party:' })).toBe(':party:');
  });
});
