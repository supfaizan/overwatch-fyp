import { describe, expect, it } from 'vitest';
import {
  emojiFromHexcode,
  matchShortcodes,
  reactionSummary,
  replaceShortcodes,
  shortcodeList,
  shortcodeQuery,
} from './emoji';

describe('emoji names', () => {
  const list = shortcodeList({
    '1F44D': ['+1', 'thumbsup'],
    '2764': 'heart',
    '1F525': 'fire',
    '2764-FE0F-200D-1F525': 'heart_on_fire',
  });

  it('turns codepoints into emoji, showing a lone symbol as an emoji', () => {
    expect(emojiFromHexcode('1F44D')).toBe('👍');
    expect(emojiFromHexcode('2764')).toBe('❤️');
    expect(
      list.find((s) => {
        return s.name === 'thumbsup';
      })?.emoji,
    ).toBe('👍');
  });

  it('finds the name being typed at the caret, only after a space or at the start', () => {
    expect(shortcodeQuery('nice :thu', 9)).toEqual({ start: 5, query: 'thu' });
    expect(shortcodeQuery(':he', 3)).toEqual({ start: 0, query: 'he' });
    expect(shortcodeQuery('nice :t', 7)).toBeNull();
    expect(shortcodeQuery('10:30', 5)).toBeNull();
  });

  it('suggests names starting with the query before those containing it', () => {
    expect(
      matchShortcodes(list, 'fire').map((s) => {
        return s.name;
      }),
    ).toEqual(['fire', 'heart_on_fire']);
  });

  it('replaces known names on send and leaves the rest', () => {
    const byName = new Map(list.map((s) => {
      return [s.name, s.emoji];
    }));
    expect(replaceShortcodes('ship it :fire: :nope: at 10:30:00', byName)).toBe(
      'ship it 🔥 :nope: at 10:30:00',
    );
  });
});

describe('reactionSummary', () => {
  const nameOf = (id: string) => {
    return id;
  };

  it('puts you first and counts the rest past three', () => {
    expect(reactionSummary(['sara', 'me'], nameOf, 'me')).toBe('You and sara');
    expect(reactionSummary(['sara'], nameOf, 'me')).toBe('sara');
    expect(reactionSummary(['a', 'b', 'c'], nameOf, 'me')).toBe('a, b and c');
    expect(reactionSummary(['a', 'b', 'c', 'me'], nameOf, 'me')).toBe('You, a and 2 others');
  });
});
