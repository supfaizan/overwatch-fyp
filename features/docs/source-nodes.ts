import { Mark, mergeAttributes, Node } from '@tiptap/react';

/**
 * What a mirrored page has that this editor doesn't (a Confluence panel, macro, mention…). The backend
 * sends the original as `raw` and writes it back exactly as it came, so it's shown read-only: it can be
 * moved or deleted, not edited. `raw` rides along in the HTML too, so copying it within a page keeps it.
 */
type SourceOptions = { sourceName: string };

const rawAttribute = (tag: string) => {
  return {
    default: null,
    parseHTML: (element: HTMLElement) => {
      try {
        return JSON.parse(element.getAttribute(tag) ?? 'null');
      } catch {
        return null;
      }
    },
    renderHTML: (attrs: Record<string, unknown>) => {
      return { [tag]: JSON.stringify(attrs.raw ?? null) };
    },
  };
};

const hint = (label: string, sourceName: string) => {
  return `${label} · edit it in ${sourceName}`;
};

export const SourceBlock = Node.create<SourceOptions>({
  name: 'sourceBlock',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addOptions: () => {
    return { sourceName: 'its source' };
  },

  addAttributes() {
    return {
      raw: rawAttribute('data-source-block'),
      label: {
        default: 'Content',
        renderHTML: () => {
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-source-block]',
      getAttrs: (element) => {
        return { label: element.getAttribute('data-label') ?? 'Content' };
      },
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const label = String(node.attrs.label);
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-label': label, contenteditable: 'false' }),
      hint(label, this.options.sourceName),
    ];
  },

  renderMarkdown: (node) => {
    return `_[${node.attrs?.label ?? 'Content'}]_`;
  },
});

export const SourceInline = Node.create<SourceOptions>({
  name: 'sourceInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addOptions: () => {
    return { sourceName: 'its source' };
  },

  addAttributes() {
    return {
      raw: rawAttribute('data-source-inline'),
      label: {
        default: '',
        renderHTML: () => {
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [{
      tag: 'span[data-source-inline]',
      getAttrs: (element) => {
        return { label: element.textContent ?? '' };
      },
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        title: `Edit it in ${this.options.sourceName}`,
        contenteditable: 'false',
      }),
      String(node.attrs.label),
    ];
  },

  renderMarkdown: (node) => {
    return String(node.attrs?.label ?? '');
  },
});

/** Formatting this editor lacks (text colour, sub/superscript), kept on the text it was on. */
export const SourceMark = Mark.create({
  name: 'sourceMark',

  addAttributes() {
    return {
      marks: {
        default: [],
        parseHTML: (element: HTMLElement) => {
          try {
            return JSON.parse(element.getAttribute('data-source-mark') ?? '[]');
          } catch {
            return [];
          }
        },
        renderHTML: (attrs: Record<string, unknown>) => {
          return {
            'data-source-mark': JSON.stringify(attrs.marks ?? []),
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-source-mark]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});
