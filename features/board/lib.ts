import { STATUS_CATEGORY, type MoveWorkItem, type StatusCategory, type WorkItem } from './types';

export const COLUMNS: { id: StatusCategory; title: string }[] = [
  { id: STATUS_CATEGORY.todo, title: 'To do' },
  { id: STATUS_CATEGORY.inProgress, title: 'In progress' },
  { id: STATUS_CATEGORY.done, title: 'Done' },
];

const byRank = (a: WorkItem, b: WorkItem) => a.rank - b.rank || a.id.localeCompare(b.id);

/** Items per column, in board order. */
export function groupByColumn(items: WorkItem[]): Record<StatusCategory, WorkItem[]> {
  const columns: Record<StatusCategory, WorkItem[]> = { todo: [], in_progress: [], done: [] };
  for (const item of items) columns[item.status_category].push(item);
  for (const column of Object.values(columns)) column.sort(byRank);
  return columns;
}

/**
 * Where a card dropped at `index` of a column lands: the neighbours the server places it
 * between, and the rank it will get (the same midpoint rule), for an optimistic update.
 */
export function placement(column: WorkItem[], index: number): Omit<MoveWorkItem, 'status_category'> & { rank: number } {
  const before = column[index - 1];
  const after = column[index];
  const rank =
    before && after ? (before.rank + after.rank) / 2 : before ? before.rank + 1 : after ? after.rank - 1 : Date.now() / 1000;
  return { before_id: before?.id ?? null, after_id: after?.id ?? null, rank };
}

/** The move for dropping `id` at `index` of `category`, plus the items as they'll look after it. */
export function moveItem(items: WorkItem[], id: string, category: StatusCategory, index: number) {
  const column = groupByColumn(items.filter((item) => item.id !== id))[category];
  const { rank, ...neighbours } = placement(column, index);
  const move: MoveWorkItem = { status_category: category, ...neighbours };
  return { move, rank, items: items.map((item) => (item.id === id ? { ...item, status_category: category, rank } : item)) };
}

const isColumn = (id: string): id is StatusCategory => COLUMNS.some((column) => column.id === id);

/**
 * Where a drag ends: on a column (its end) or on a card (that card's place). A card moved
 * down its own column goes after the card it's dropped on, otherwise before it.
 */
export function dropTarget(items: WorkItem[], activeId: string, overId: string): { category: StatusCategory; index: number } | null {
  const others = groupByColumn(items.filter((item) => item.id !== activeId));
  if (isColumn(overId)) return { category: overId, index: others[overId].length };

  const active = items.find((item) => item.id === activeId);
  const over = items.find((item) => item.id === overId);
  if (!active || !over || active === over) return null;
  const full = groupByColumn(items)[over.status_category];
  const movingDown = active.status_category === over.status_category && full.indexOf(active) < full.indexOf(over);
  return { category: over.status_category, index: others[over.status_category].indexOf(over) + (movingDown ? 1 : 0) };
}
