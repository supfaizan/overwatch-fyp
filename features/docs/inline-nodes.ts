import { mergeAttributes, Node } from '@tiptap/react';

/**
 * Small things inside a line that came from a mirrored page: an emoji, a status lozenge, a date. Their
 * attributes are kept exactly as the source sent them, so they go back unchanged.
 */
const attrs = (names: string[]) => Object.fromEntries(names.map((name) => [name, { default: null, rendered: false }]));

const ESCAPED = /\\u([0-9a-fA-F]{4})/g;

/**
 * An emoji's character: from its `id` (Unicode code points, `1f468-200d-1f469`), else its `text`
 * (Confluence templates send it escaped, `📊`), else its `:shortName:` (a custom emoji).
 */
export function emojiGlyph({ id, text, shortName }: { id?: string | null; text?: string | null; shortName?: string | null }): string {
  const points = (id ?? '').split('-');
  if (points.every((point) => /^[0-9a-f]{2,6}$/i.test(point))) {
    const values = points.map((point) => parseInt(point, 16));
    if (values.every((value) => value <= 0x10ffff && (value < 0xd800 || value > 0xdfff))) return String.fromCodePoint(...values);
  }
  const decoded = (text ?? '').replace(ESCAPED, (_, unit: string) => String.fromCharCode(parseInt(unit, 16)));
  return decoded || shortName || '';
}

export const Emoji = Node.create({
  name: 'emoji',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes: () => attrs(['shortName', 'id', 'text']),

  parseHTML() {
    return [{ tag: 'span[data-emoji]', getAttrs: (element) => ({ shortName: element.getAttribute('data-emoji'), text: element.textContent }) }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const glyph = emojiGlyph(node.attrs);
    const custom = glyph === node.attrs.shortName;
    return ['span', mergeAttributes(HTMLAttributes, { 'data-emoji': node.attrs.shortName ?? '', ...(custom && { 'data-custom': '' }), role: 'img', 'aria-label': node.attrs.shortName ?? glyph }), glyph];
  },

  renderMarkdown: (node) => emojiGlyph(node.attrs ?? {}),
});

export const Status = Node.create({
  name: 'status',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes: () => attrs(['text', 'color', 'localId', 'style']),

  parseHTML() {
    return [{ tag: 'span[data-status]', getAttrs: (element) => ({ color: element.getAttribute('data-status'), text: element.textContent }) }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-status': node.attrs.color ?? 'neutral' }), String(node.attrs.text ?? '')];
  },

  renderMarkdown: (node) => `\`${node.attrs?.text ?? ''}\``,
});

const DAY = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const dayOf = (timestamp: unknown) => {
  const date = new Date(Number(timestamp));
  return Number.isNaN(date.getTime()) ? '' : DAY.format(date);
};

export const DateNode = Node.create({
  name: 'date',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes: () => attrs(['timestamp']),

  parseHTML() {
    return [{ tag: 'time[data-timestamp]', getAttrs: (element) => ({ timestamp: element.getAttribute('data-timestamp') }) }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['time', mergeAttributes(HTMLAttributes, { 'data-timestamp': node.attrs.timestamp ?? '' }), dayOf(node.attrs.timestamp)];
  },

  renderMarkdown: (node) => dayOf(node.attrs?.timestamp),
});
