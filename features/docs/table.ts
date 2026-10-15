import { Table, TableCell, TableHeader } from '@tiptap/extension-table';
import { plainColor } from './lib';

/**
 * Tables that keep what a mirrored page's tables have beyond the editor's own: their layout, numbered
 * rows and width, and each cell's background, which shows as a tint.
 */
const kept = { default: null, rendered: false };

export const DocTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      layout: kept,
      isNumberColumnEnabled: kept,
      width: kept,
      displayMode: kept,
      localId: kept,
    };
  },
});

const background = {
  default: null,
  parseHTML: (element: HTMLElement) => element.getAttribute('data-background'),
  renderHTML: (attrs: Record<string, unknown>) => {
    const color = plainColor(attrs.background);
    return color
      ? {
        'data-background': color,
        style: `background-color: color-mix(in srgb, ${color} 35%, transparent)`,
      }
      : {};
  },
};

export const DocTableCell = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), background };
  },
});

export const DocTableHeader = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), background };
  },
});
