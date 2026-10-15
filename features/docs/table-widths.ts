import { TableMap, columnResizingPluginKey } from '@tiptap/pm/tables';
import type { EditorView } from '@tiptap/pm/view';

/**
 * Gives every column of a table the width it's drawn at now, as Confluence keeps them.
 *
 * A column without a width shares the table's width with the others, so dragging one edge only
 * moves space between columns. Once all are set, the table is exactly their sum: dragging the last
 * edge makes the whole table wider or narrower, past the text if need be. Left out of undo history.
 */
export function pinColumnWidths(view: EditorView, tableDom: HTMLTableElement) {
  // a position inside one of its cells: the table element itself belongs to the table's node view
  const cell = tableDom.querySelector('td, th');
  if (!cell) return;
  const $inside = view.state.doc.resolve(view.posAtDOM(cell, 0));
  let depth = $inside.depth;
  while (depth > 0 && $inside.node(depth).type.name !== 'table') depth -= 1;
  const table = $inside.node(depth);
  if (table.type.name !== 'table') return;
  const start = $inside.start(depth);
  const map = TableMap.get(table);
  const cells = [...new Set(map.map)];
  if (cells.every((offset) => table.nodeAt(offset)?.attrs.colwidth?.every(Boolean))) return;

  // each column's drawn width, read off the first row's cells
  const widths: number[] = [];
  for (let col = 0; col < map.width; col += 1) {
    const offset = map.map[col];
    const node = table.nodeAt(offset);
    const dom = view.nodeDOM(start + offset);
    const span = node?.attrs.colspan ?? 1;
    widths[col] = Math.round((dom instanceof HTMLElement ? dom.getBoundingClientRect().width : 0) / span);
  }
  if (widths.some((width) => !width)) return;

  const tr = view.state.tr;
  for (const offset of cells) {
    const node = table.nodeAt(offset);
    if (!node) continue;
    const col = map.colCount(offset);
    tr.setNodeMarkup(start + offset, undefined, { ...node.attrs, colwidth: widths.slice(col, col + node.attrs.colspan) });
  }
  view.dispatch(tr.setMeta('addToHistory', false));
}

/** The table the selection is in, as drawn. */
export function tableAtSelection(view: EditorView): HTMLTableElement | null {
  const { node } = view.domAtPos(view.state.selection.from);
  const element = node instanceof HTMLElement ? node : node.parentElement;
  return element?.closest('table') ?? null;
}

/** No column gets narrower than this, here or in the resize plugin. */
export const CELL_MIN_WIDTH = 80;

/**
 * Starts dragging an inner column edge, Confluence-style: the space comes from (or goes to) the column
 * on its right, so the table keeps its width. Returns false for the last edge, which the resize plugin
 * drags instead, making the whole table wider or narrower. Widths are drawn live and saved on release.
 */
export function dragInnerColumnEdge(view: EditorView, event: MouseEvent): boolean {
  const handle = columnResizingPluginKey.getState(view.state)?.activeHandle ?? -1;
  if (handle < 0 || event.button !== 0) return false;
  const $cell = view.state.doc.resolve(handle);
  const table = $cell.node(-1);
  const start = $cell.start(-1);
  const map = TableMap.get(table);
  const cell = view.state.doc.nodeAt(handle);
  if (!cell) return false;
  const left = map.colCount(handle - start) + cell.attrs.colspan - 1;
  const right = left + 1;
  if (right >= map.width) return false;

  const tableDom = view.nodeDOM(start - 1);
  const cols = tableDom instanceof HTMLElement ? tableDom.querySelectorAll<HTMLTableColElement>('colgroup > col') : null;
  if (!cols || cols.length < map.width) return false;
  const widthOf = (col: number) => table.nodeAt(map.map[col])?.attrs.colwidth?.[col - map.colCount(map.map[col])] ?? 0;
  const [startLeft, startRight] = [widthOf(left), widthOf(right)];
  if (!startLeft || !startRight) return false;

  event.preventDefault();
  const startX = event.clientX;
  let delta = 0;
  const draw = () => {
    cols[left].style.width = `${startLeft + delta}px`;
    cols[right].style.width = `${startRight - delta}px`;
  };
  const move = (moved: MouseEvent) => {
    delta = Math.min(Math.max(moved.clientX - startX, CELL_MIN_WIDTH - startLeft), startRight - CELL_MIN_WIDTH);
    draw();
  };
  const finish = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', finish);
    document.body.style.removeProperty('cursor');
    if (!delta) return;
    const widths: Record<number, number> = { [left]: startLeft + delta, [right]: startRight - delta };
    const tr = view.state.tr;
    for (const offset of new Set(map.map)) {
      const node = table.nodeAt(offset);
      if (!node) continue;
      const first = map.colCount(offset);
      const covered = node.attrs.colwidth?.map((width: number, index: number) => widths[first + index] ?? width);
      if (covered?.some((width: number, index: number) => width !== node.attrs.colwidth[index])) {
        tr.setNodeMarkup(start + offset, undefined, { ...node.attrs, colwidth: covered });
      }
    }
    view.dispatch(tr);
  };
  document.body.style.cursor = 'col-resize';
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', finish);
  return true;
}
