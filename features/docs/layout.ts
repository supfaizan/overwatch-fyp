import { type Editor, mergeAttributes, Node } from '@tiptap/react';

/**
 * Columns: a section of two or three side by side, each as wide as its `width` (a percentage, as
 * Confluence has it). Columns don't nest, so new ones only go outside one.
 */
export const MAX_COLUMNS = 3;

export const LayoutColumn = Node.create({
  name: 'layoutColumn',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      width: {
        default: null,
        parseHTML: (element) => Number(element.getAttribute('data-width')) || null,
        renderHTML: (attrs) => (attrs.width ? { 'data-width': attrs.width, style: `flex: ${attrs.width} 1 0%` } : { style: 'flex: 1 1 0%' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-layout-column]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-layout-column': '' }), 0];
  },

  renderMarkdown: (node, h) => h.renderChildren(node.content ?? [], '\n\n'),
});

export const LayoutSection = Node.create({
  name: 'layoutSection',
  group: 'block',
  content: `layoutColumn{1,${MAX_COLUMNS}}`,
  defining: true,
  draggable: true,

  addAttributes() {
    return { sourceMarks: { default: null, rendered: false } };
  },

  parseHTML() {
    return [{ tag: 'div[data-layout-section]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-layout-section': '' }), 0];
  },

  renderMarkdown: (node, h) => h.renderChildren(node.content ?? [], '\n\n'),
});

/** Puts `count` empty columns of even width where the selection is; not inside other columns. */
export function insertColumns(editor: Editor, count: number) {
  if (editor.isActive(LayoutSection.name)) return false;
  const width = Math.round((100 / count) * 100) / 100;
  const column = { type: LayoutColumn.name, attrs: { width }, content: [{ type: 'paragraph' }] };
  return editor.chain().focus().insertContent({ type: LayoutSection.name, content: Array.from({ length: count }, () => column) }).run();
}

/** Lays the columns around the selection back out, one after another. */
export function removeColumns(editor: Editor) {
  const { state } = editor;
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name !== LayoutSection.name) continue;
    const blocks: (typeof node)[] = [];
    node.forEach((column) => column.forEach((block) => void blocks.push(block)));
    editor.view.dispatch(state.tr.replaceWith($from.before(depth), $from.after(depth), blocks));
    editor.commands.focus();
    return true;
  }
  return false;
}
