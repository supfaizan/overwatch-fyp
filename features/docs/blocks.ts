import { mergeAttributes, Node, ReactNodeViewRenderer } from '@tiptap/react';
import { ExpandView, PanelView } from './components/block-views';

/**
 * Containers a mirrored page brings: a coloured panel (info, note, warning…) and a collapsible section.
 * Both are edited in place; their source attributes ride along so they go back as they came.
 */
const kept = (names: string[]) => {
  return Object.fromEntries(names.map((name) => {
    return [name, { default: null, rendered: false }];
  }));
};

export const PANEL_TYPES = ['info', 'note', 'success', 'warning', 'error', 'custom'] as const;
export type PanelType = (typeof PANEL_TYPES)[number];

export const Panel = Node.create({
  name: 'panel',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      panelType: {
        default: 'info',
        parseHTML: (element) => {
          return element.getAttribute('data-panel');
        },
        renderHTML: (attrs) => {
          return { 'data-panel': attrs.panelType };
        },
      },
      ...kept(['panelIcon', 'panelIconId', 'panelIconText', 'panelColor', 'localId']),
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-panel]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },

  renderMarkdown: (node, h) => {
    return h.renderChildren(node.content ?? [], '\n\n').split('\n').map((
      line,
    ) => {
      return (line ? `> ${line}` : '>');
    }).join('\n');
  },

  addNodeView() {
    return ReactNodeViewRenderer(PanelView);
  },
});

export const Expand = Node.create({
  name: 'expand',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: {
        default: '',
        parseHTML: (element) => {
          return element.getAttribute('data-title') ?? '';
        },
        renderHTML: (attrs) => {
          return { 'data-title': attrs.title };
        },
      },
      // Confluence's expand inside a table cell
      nested: { default: false, rendered: false },
      ...kept(['sourceMarks']),
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-expand]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-expand': '' }), 0];
  },

  renderMarkdown: (node, h) => {
    return `**${node.attrs?.title || 'Details'}**\n\n${
      h.renderChildren(node.content ?? [], '\n\n')
    }`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExpandView);
  },
});
