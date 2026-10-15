import type { Schema } from '@tiptap/pm/model';
import { type Editor, mergeAttributes, Node, ReactNodeViewRenderer } from '@tiptap/react';
import LinkCardView from './components/link-card';
import { embedFor } from './embeds';
import { CARD_KIND, type CardKind } from './types';

/**
 * A link shown three ways, as Confluence shows its smart links: a chip in the line (`inlineCard`), a card
 * with its title and picture (`blockCard`), or the thing itself playing in the page (`embedCard`). A
 * mirrored page's original rides along in `raw` and goes back as it came until the link is changed.
 */
const CARD_KINDS: string[] = Object.values(CARD_KIND);

/** A link on its own line: playing in the page where its site allows, a card otherwise. */
export const cardFor = (schema: Schema, url: string) => schema.nodes[embedFor(url) ? CARD_KIND.embed : CARD_KIND.block].create({ url });

const cardAttributes = {
  url: { default: '', parseHTML: (element: HTMLElement) => element.getAttribute('href') ?? '', renderHTML: (attrs: Record<string, unknown>) => ({ href: attrs.url }) },
  raw: { default: null, rendered: false },
};

const card = (name: CardKind, inline: boolean) =>
  Node.create({
    name,
    group: inline ? 'inline' : 'block',
    inline,
    atom: true,
    selectable: true,
    draggable: !inline,

    addAttributes() {
      if (name !== CARD_KIND.embed) return cardAttributes;
      const kept = { default: null, rendered: false };
      return { ...cardAttributes, layout: kept, width: kept, originalHeight: kept };
    },

    // before the link mark, which would otherwise take these as plain links
    parseHTML() {
      return [{ tag: `a[data-card="${name}"]`, priority: 100 }];
    },

    renderHTML({ HTMLAttributes }) {
      return ['a', mergeAttributes(HTMLAttributes, { 'data-card': name, target: '_blank', rel: 'noopener noreferrer' }), String(HTMLAttributes.href ?? '')];
    },

    renderMarkdown: (node) => `<${node.attrs?.url ?? ''}>`,

    addNodeView() {
      return ReactNodeViewRenderer(LinkCardView, inline ? { as: 'span' } : undefined);
    },
  });

export const InlineCard = card(CARD_KIND.inline, true);
export const BlockCard = card(CARD_KIND.block, false);
export const EmbedCard = card(CARD_KIND.embed, false);

/** Shows the card at `pos` another way; it's a new link at the source after that, so `raw` goes. */
export function setCardKind(editor: Editor, pos: number, kind: CardKind) {
  const { state } = editor;
  const node = state.doc.nodeAt(pos);
  if (!node || !CARD_KINDS.includes(node.type.name)) return false;
  const target = state.schema.nodes[kind];
  const next = target.create({ url: node.attrs.url });
  const { tr } = state;
  if (node.isInline === target.isInline) {
    tr.setNodeMarkup(pos, target, next.attrs);
  } else if (target.isInline) {
    tr.replaceWith(pos, pos + node.nodeSize, state.schema.nodes.paragraph.create(null, next));
  } else {
    // a chip becomes a card on its own line: in place of its paragraph if that held only it, else after
    const $pos = state.doc.resolve(pos);
    const container = $pos.node($pos.depth - 1);
    const index = $pos.index($pos.depth - 1);
    const alone = $pos.parent.childCount === 1 && container.canReplaceWith(index, index + 1, target);
    if (alone) tr.replaceWith($pos.before(), $pos.after(), next);
    else if (container.canReplaceWith(index + 1, index + 1, target)) tr.insert($pos.after(), next).delete(pos, pos + node.nodeSize);
    else return false;
  }
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}
