import { COLUMN_COLOR, PRIORITY_LEVEL, STATUS_CATEGORY, type Board, type Column, type ColumnColor, type MoveWorkItem, type PriorityLevel, type WorkItem } from './types';

const byRank = (a: WorkItem, b: WorkItem) => a.rank - b.rank || a.id.localeCompare(b.id);

/** Items per column of the board, in board order; an item in no column isn't shown. */
export function groupByColumn(items: WorkItem[], columns: Column[]): Record<string, WorkItem[]> {
  const grouped: Record<string, WorkItem[]> = Object.fromEntries(columns.map((column) => [column.id, []]));
  for (const item of items) if (item.column_id && grouped[item.column_id]) grouped[item.column_id].push(item);
  for (const column of Object.values(grouped)) column.sort(byRank);
  return grouped;
}

/**
 * Where a card dropped at `index` of a column lands: the neighbours the server places it
 * between, and the rank it will get (the same midpoint rule), for an optimistic update.
 */
export function placement(column: WorkItem[], index: number): Omit<MoveWorkItem, 'column_id'> & { rank: number } {
  const before = column[index - 1];
  const after = column[index];
  const rank =
    before && after ? (before.rank + after.rank) / 2 : before ? before.rank + 1 : after ? after.rank - 1 : Date.now() / 1000;
  return { before_id: before?.id ?? null, after_id: after?.id ?? null, rank };
}

/** The move for dropping `id` at `index` of a column, plus the items as they'll look after it. */
export function moveItem(items: WorkItem[], columns: Column[], id: string, columnId: string, index: number) {
  const column = groupByColumn(items.filter((item) => item.id !== id), columns)[columnId] ?? [];
  const { rank, ...neighbours } = placement(column, index);
  const move: MoveWorkItem = { column_id: columnId, ...neighbours };
  return { move, rank, items: items.map((item) => (item.id === id ? { ...item, column_id: columnId, rank } : item)) };
}

/**
 * Where a drag ends: on a column (its end) or on a card (that card's place). A card moved
 * down its own column goes after the card it's dropped on, otherwise before it.
 */
export function dropTarget(items: WorkItem[], columns: Column[], activeId: string, overId: string): { columnId: string; index: number } | null {
  const others = groupByColumn(items.filter((item) => item.id !== activeId), columns);
  if (others[overId]) return { columnId: overId, index: others[overId].length };

  const active = items.find((item) => item.id === activeId);
  const over = items.find((item) => item.id === overId);
  if (!active || !over || active === over || !over.column_id || !others[over.column_id]) return null;
  const full = groupByColumn(items, columns)[over.column_id];
  const movingDown = active.column_id === over.column_id && full.indexOf(active) < full.indexOf(over);
  return { columnId: over.column_id, index: others[over.column_id].indexOf(over) + (movingDown ? 1 : 0) };
}

/** The backlog view's section for items in no sprint; sprint sections use the sprint's id. */
export const BACKLOG_SECTION = 'backlog';

export const sectionOf = (item: WorkItem) => item.sprint_id ?? BACKLOG_SECTION;

export const sortByRank = (items: WorkItem[]) => [...items].sort(byRank);

/**
 * Where a backlog-view drag ends: on a section (its end) or on a row (that row's place). A row
 * moved down its own section goes after the row it's dropped on, otherwise before it.
 */
export function sectionDrop(sections: Record<string, WorkItem[]>, activeId: string, overId: string): { section: string; index: number } | null {
  const without = (items: WorkItem[]) => items.filter((item) => item.id !== activeId);
  if (sections[overId]) return { section: overId, index: without(sections[overId]).length };

  const all = Object.values(sections).flat();
  const active = all.find((item) => item.id === activeId);
  const over = all.find((item) => item.id === overId);
  if (!active || !over || active === over) return null;
  const section = sectionOf(over);
  const full = sections[section] ?? [];
  const movingDown = sectionOf(active) === section && full.indexOf(active) < full.indexOf(over);
  return { section, index: without(full).indexOf(over) + (movingDown ? 1 : 0) };
}

const BLOCKED_RE = /block|imped|stuck|on.?hold/i;
const CHECKING_RE = /review|\bqa\b|test|verif/i;
const SHELVED_RE = /archiv|cancel|won.?t|reject/i;

/** A column's color: the board's choice, else one its name suggests, else its category's. */
export function columnColor(column: Column): ColumnColor {
  if (column.color) return column.color;
  if (BLOCKED_RE.test(column.name)) return COLUMN_COLOR.red;
  if (CHECKING_RE.test(column.name)) return COLUMN_COLOR.purple;
  if (SHELVED_RE.test(column.name)) return COLUMN_COLOR.slate;
  if (column.status_category === STATUS_CATEGORY.done) return COLUMN_COLOR.green;
  return column.status_category === STATUS_CATEGORY.inProgress ? COLUMN_COLOR.blue : COLUMN_COLOR.gray;
}

/** Full class names per color, so Tailwind sees them: the card's raised bottom edge and the column's dot. */
export const COLOR_CLASSES: Record<ColumnColor, { edge: string; dot: string }> = {
  gray: { edge: 'shadow-border-strong', dot: 'bg-border-strong' },
  blue: { edge: 'shadow-accent-blue', dot: 'bg-accent-blue' },
  green: { edge: 'shadow-success', dot: 'bg-success' },
  red: { edge: 'shadow-danger', dot: 'bg-danger' },
  amber: { edge: 'shadow-accent-amber', dot: 'bg-accent-amber' },
  purple: { edge: 'shadow-accent-purple', dot: 'bg-accent-purple' },
  orange: { edge: 'shadow-accent-orange', dot: 'bg-accent-orange' },
  slate: { edge: 'shadow-accent-slate', dot: 'bg-accent-slate' },
};

const PRIORITY_NAMES: [PriorityLevel, string[]][] = [
  [PRIORITY_LEVEL.highest, ['highest', 'blocker', 'critical', 'urgent']],
  [PRIORITY_LEVEL.high, ['high', 'major']],
  [PRIORITY_LEVEL.medium, ['medium', 'normal']],
  [PRIORITY_LEVEL.low, ['low', 'minor']],
  [PRIORITY_LEVEL.lowest, ['lowest', 'trivial']],
];

/** Where a tracker's priority name sits on the usual five-step scale; null for a name we don't know. */
export function priorityLevel(name: string | null): PriorityLevel | null {
  const lower = name?.trim().toLowerCase();
  return PRIORITY_NAMES.find(([, names]) => lower && names.includes(lower))?.[0] ?? null;
}

/**
 * Cards from a column's loaded pages, once each. Offset pages can overlap after a move shifts a column;
 * the copy updated last wins.
 */
export function mergePages(pages: WorkItem[][]): WorkItem[] {
  const merged = new Map<string, WorkItem>();
  for (const item of pages.flat()) {
    const seen = merged.get(item.id);
    if (!seen || item.updated_at > seen.updated_at) merged.set(item.id, item);
  }
  return [...merged.values()];
}

/** Columns are sortable alongside cards; their sortable ids are prefixed so the two never collide. */
const COLUMN_SORT_PREFIX = 'column:';
export const columnSortId = (columnId: string) => COLUMN_SORT_PREFIX + columnId;
export const columnFromSortId = (id: string) => (id.startsWith(COLUMN_SORT_PREFIX) ? id.slice(COLUMN_SORT_PREFIX.length) : null);

/** A board with a new column order and colors, as the server will return it (for an optimistic update). */
export function arrange(board: Board, order?: string[], colors?: Record<string, ColumnColor | null>): Board {
  const position = new Map((order ?? board.columns.map((column) => column.id)).map((id, index) => [id, index]));
  const columns = [...board.columns]
    .sort((a, b) => (position.get(a.id) ?? position.size) - (position.get(b.id) ?? position.size))
    .map((column) => (colors && column.id in colors ? { ...column, color: colors[column.id] } : column));
  return { ...board, columns };
}

const ARCHIVED_RE = /archiv/i;

/** Archived columns start hidden: they fill up and are rarely what anyone's looking for. */
export const hiddenByDefault = (column: Column) => ARCHIVED_RE.test(column.name);

export type Lane = { key: string; label: string; total: number };

/** The lane of items with no assignee (or no priority). */
export const NO_LANE = 'none';
const CELL_SEPARATOR = '::';

/** A swimlane cell's id (droppable, and paging): one lane, one column. */
export const cellId = (lane: string, columnId: string) => `${lane}${CELL_SEPARATOR}${columnId}`;

export function parseCellId(id: string): { lane: string; columnId: string } | null {
  const at = id.lastIndexOf(CELL_SEPARATOR);
  return at < 0 ? null : { lane: id.slice(0, at), columnId: id.slice(at + CELL_SEPARATOR.length) };
}

export const laneOf = (item: WorkItem, by: 'assignee' | 'priority') =>
  (by === 'assignee' ? item.assignee?.id : item.priority) ?? NO_LANE;

/**
 * Swimlanes in board order: by assignee alphabetically, by priority in the board's order (most urgent
 * first), with the lane for none last.
 */
export function orderLanes(lanes: { key: string; label: string | null; total: number }[], by: 'assignee' | 'priority', priorities: string[] = []): Lane[] {
  const none = by === 'assignee' ? 'Unassigned' : 'No priority';
  const rank = (lane: Lane) => (by === 'priority' && priorities.includes(lane.key) ? priorities.indexOf(lane.key) : priorities.length);
  return lanes
    .map((lane) => ({ key: lane.key, total: lane.total, label: lane.key === NO_LANE ? none : (lane.label ?? lane.key) }))
    .sort((a, b) => Number(a.key === NO_LANE) - Number(b.key === NO_LANE) || rank(a) - rank(b) || a.label.localeCompare(b.label));
}

/**
 * Where a swimlane drag ends: a cell (its end) or a card (that card's place in its cell). A card moved
 * down its own cell goes after the card it's dropped on, otherwise before it.
 */
export function laneDropTarget(
  items: WorkItem[], columns: Column[], by: 'assignee' | 'priority', activeId: string, overId: string,
): { lane: string; columnId: string; index: number } | null {
  const active = items.find((item) => item.id === activeId);
  if (!active) return null;
  const cellItems = (lane: string, columnId: string) =>
    (groupByColumn(items.filter((item) => laneOf(item, by) === lane), columns)[columnId] ?? []);

  const cell = parseCellId(overId);
  if (cell) return { ...cell, index: cellItems(cell.lane, cell.columnId).filter((item) => item.id !== activeId).length };

  const over = items.find((item) => item.id === overId);
  if (!over || over === active || !over.column_id) return null;
  const lane = laneOf(over, by);
  const full = cellItems(lane, over.column_id);
  const movingDown = laneOf(active, by) === lane && active.column_id === over.column_id && full.indexOf(active) < full.indexOf(over);
  return { lane, columnId: over.column_id, index: full.filter((item) => item.id !== activeId).indexOf(over) + (movingDown ? 1 : 0) };
}
