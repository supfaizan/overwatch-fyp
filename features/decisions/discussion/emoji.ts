/**
 * Emoji names like Slack's (`:thumbsup:`): typed in the composer, they're suggested as you type
 * and turned into the emoji on send. Names come from emojibase's iamcal set (Slack's own), loaded
 * on first use as its own chunk.
 */

/** emojibase's shortcode file: codepoints (`1F44D`, `2764-FE0F-200D-1F525`) -> one name or several. */
export type ShortcodeData = Record<string, string | string[]>;
export type Shortcode = { name: string; emoji: string };

const VARIATION_SELECTOR = 0xfe0f;
const NAME_CHARS = '[a-z0-9_+-]';
const TYPING_NAME_RE = new RegExp(`(^|\\s):(${NAME_CHARS}{2,})$`);
const NAME_IN_TEXT_RE = new RegExp(`:(${NAME_CHARS}+):`, 'g');

export const loadShortcodes = async (): Promise<ShortcodeData> => {
  return (await import('emojibase-data/en/shortcodes/iamcal.json')).default;
};

/** The emoji for its codepoints; a lone symbol (❤, ☀) gets the selector that shows it as an emoji. */
export function emojiFromHexcode(hexcode: string): string {
  const points = hexcode.split('-').map((hex) => {
    return Number.parseInt(hex, 16);
  });
  if (points.length === 1 && points[0] < 0x1f000) {
    points.push(VARIATION_SELECTOR);
  }
  return String.fromCodePoint(...points);
}

/** Every name, each with its emoji. */
export function shortcodeList(data: ShortcodeData): Shortcode[] {
  return Object.entries(data).flatMap(([hexcode, names]) => {
    const emoji = emojiFromHexcode(hexcode);
    return (Array.isArray(names) ? names : [names]).map((name) => {
      return { name, emoji };
    });
  });
}

/** The name being typed just before the caret (`:thu`), and where its colon is; null when there isn't one. */
export function shortcodeQuery(
  text: string,
  caret: number,
): { start: number; query: string } | null {
  const match = TYPING_NAME_RE.exec(text.slice(0, caret));
  if (!match) {
    return null;
  }
  return { start: caret - match[2].length - 1, query: match[2] };
}

/** Names starting with the query first, then the ones containing it. */
export function matchShortcodes(list: Shortcode[], query: string, limit = 8): Shortcode[] {
  const starting = list.filter((shortcode) => {
    return shortcode.name.startsWith(query);
  });
  const containing = list.filter((shortcode) => {
    return !shortcode.name.startsWith(query) && shortcode.name.includes(query);
  });
  return [...starting, ...containing].slice(0, limit);
}

/** `text` with each known `:name:` as its emoji; unknown names stay as typed. */
export function replaceShortcodes(text: string, byName: ReadonlyMap<string, string>): string {
  return text.replace(NAME_IN_TEXT_RE, (whole, name: string) => {
    return byName.get(name) ?? whole;
  });
}

/** Who reacted, for a tooltip: "You, sara and 2 others". */
export function reactionSummary(
  userIds: string[],
  nameOf: (userId: string) => string,
  me: string | undefined,
): string {
  const names = [
    ...(me && userIds.includes(me) ? ['You'] : []),
    ...userIds.filter((id) => {
      return id !== me;
    }).map(nameOf),
  ];
  if (names.length <= 3) {
    return names.length > 1
      ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
      : names.join('');
  }
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`;
}
