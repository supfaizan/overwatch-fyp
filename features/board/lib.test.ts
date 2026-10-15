import { describe, expect, it } from 'vitest';
import {
  arrange,
  BACKLOG_SECTION,
  cellId,
  columnColor,
  deadEndColumns,
  type DraftColumn,
  dropHint,
  dropTarget,
  groupByColumn,
  hiddenByDefault,
  itemLink,
  laneDropTarget,
  mergePages,
  moveItem,
  movesFrom,
  orderLanes,
  parseZoneId,
  placement,
  presetNext,
  presetOf,
  priorityLevel,
  sectionDrop,
  unreachableColumns,
  zoneId,
} from './lib';
import type { Board, Column, WorkItem } from './types';

const item = (
  id: string,
  column_id: string | null,
  rank: number,
  sprint_id: string | null = null,
): WorkItem => ({
  id,
  source: 'native',
  key: id,
  title: id,
  description: null,
  description_md: null,
  status: null,
  status_category: 'todo',
  column_id,
  sprint_id,
  rank,
  assignee: null,
  priority: null,
  type_id: null,
  issue_type: null,
  reporter: null,
  labels: [],
  parent: null,
  due_date: null,
  story_points: null,
  subtasks: [],
  links: [],
  target_key: null,
  external_url: null,
  editable: true,
  created_at: '',
  updated_at: '',
});

const columns: Column[] = [
  { id: 'todo', name: 'To do', status_category: 'todo' },
  { id: 'col_review', name: 'In Review', status_category: 'in_progress' },
  { id: 'done', name: 'Done', status_category: 'done' },
];
const items = [
  item('c', 'todo', 3),
  item('a', 'todo', 1),
  item('b', 'todo', 2),
  item('x', 'done', 1),
];
const ids = (column: WorkItem[]) => column.map((i) => i.id);

describe('groupByColumn', () => {
  it('sorts each of the board’s columns by rank', () => {
    const grouped = groupByColumn(items, columns);
    expect([ids(grouped.todo), ids(grouped.col_review), ids(grouped.done)]).toEqual([
      ['a', 'b', 'c'],
      [],
      ['x'],
    ]);
  });

  it('leaves out items in no column, or a column the board no longer has', () => {
    const grouped = groupByColumn(
      [...items, item('hidden', null, 1), item('stale', 'col_gone', 1)],
      columns,
    );
    expect(Object.values(grouped).flat().map((i) => i.id).sort()).toEqual(['a', 'b', 'c', 'x']);
  });
});

describe('placement', () => {
  const column = groupByColumn(items, columns).todo;

  it('takes the midpoint between neighbours', () => {
    expect(placement(column, 1)).toEqual({ before_id: 'a', after_id: 'b', rank: 1.5 });
  });

  it('goes before the first card or after the last', () => {
    expect(placement(column, 0)).toEqual({ before_id: null, after_id: 'a', rank: 0 });
    expect(placement(column, 3)).toEqual({ before_id: 'c', after_id: null, rank: 4 });
  });

  it('has no neighbours in an empty column', () => {
    expect(placement([], 0)).toMatchObject({ before_id: null, after_id: null });
  });
});

describe('moveItem', () => {
  it('reorders optimistically and describes the move', () => {
    const result = moveItem(items, columns, 'c', 'todo', 0);
    expect(result.move).toEqual({ column_id: 'todo', before_id: null, after_id: 'a' });
    expect(ids(groupByColumn(result.items, columns).todo)).toEqual(['c', 'a', 'b']);
  });

  it('moves across columns, including a tracker’s own', () => {
    const result = moveItem(items, columns, 'a', 'col_review', 0);
    expect(result.move).toEqual({ column_id: 'col_review', before_id: null, after_id: null });
    expect(ids(groupByColumn(result.items, columns).col_review)).toEqual(['a']);
  });
});

describe('dropTarget', () => {
  it('puts a card dropped on a column at its end', () => {
    expect(dropTarget(items, columns, 'a', 'done')).toEqual({ columnId: 'done', index: 1 });
  });

  it('puts a card moved down its column after the card it lands on', () => {
    expect(dropTarget(items, columns, 'a', 'b')).toEqual({ columnId: 'todo', index: 1 });
  });

  it('puts a card moved up, or across, before the card it lands on', () => {
    expect(dropTarget(items, columns, 'c', 'a')).toEqual({ columnId: 'todo', index: 0 });
    expect(dropTarget(items, columns, 'x', 'b')).toEqual({ columnId: 'todo', index: 1 });
  });

  it('ignores dropping a card on itself, or on nothing it knows', () => {
    expect(dropTarget(items, columns, 'a', 'a')).toBeNull();
    expect(dropTarget(items, columns, 'a', 'nowhere')).toBeNull();
  });
});

describe('sectionDrop', () => {
  const sections = {
    s1: [item('a', 'todo', 1, 's1'), item('b', 'todo', 2, 's1')],
    [BACKLOG_SECTION]: [item('p', 'todo', 1), item('q', 'todo', 2)],
  };

  it('puts a row dropped on a section at its end', () => {
    expect(sectionDrop(sections, 'a', BACKLOG_SECTION)).toEqual({
      section: BACKLOG_SECTION,
      index: 2,
    });
    expect(sectionDrop(sections, 'a', 's1')).toEqual({ section: 's1', index: 1 });
  });

  it('places a row among the rows of another section', () => {
    expect(sectionDrop(sections, 'p', 'b')).toEqual({ section: 's1', index: 1 });
  });

  it('puts a row moved down its own section after the row it lands on', () => {
    expect(sectionDrop(sections, 'p', 'q')).toEqual({ section: BACKLOG_SECTION, index: 1 });
  });

  it('ignores dropping a row on itself', () => {
    expect(sectionDrop(sections, 'a', 'a')).toBeNull();
  });
});

describe('columnColor', () => {
  const column = (
    name: string,
    status_category: Column['status_category'],
    color: Column['color'] = null,
  ): Column => ({ id: name, name, status_category, color });

  it('follows the category', () => {
    expect([
      columnColor(column('To Do', 'todo')),
      columnColor(column('In Progress', 'in_progress')),
      columnColor(column('Done', 'done')),
    ]).toEqual(['gray', 'blue', 'green']);
  });

  it('reads what a name says over its category', () => {
    expect(columnColor(column('Blocked', 'in_progress'))).toBe('red');
    expect(columnColor(column('In QA', 'in_progress'))).toBe('purple');
    expect(columnColor(column('In Review', 'in_progress'))).toBe('purple');
    expect(columnColor(column('Archived', 'done'))).toBe('slate');
  });

  it('keeps the board’s own choice', () => {
    expect(columnColor(column('Blocked', 'in_progress', 'amber'))).toBe('amber');
  });
});

describe('priorityLevel', () => {
  it('places common priority names on the five-step scale', () => {
    expect(['Highest', 'Blocker', 'High', 'Medium', 'minor', 'Lowest'].map(priorityLevel)).toEqual([
      'highest',
      'highest',
      'high',
      'medium',
      'low',
      'lowest',
    ]);
  });

  it('knows nothing of a custom name', () => {
    expect(priorityLevel('P0')).toBeNull();
    expect(priorityLevel(null)).toBeNull();
  });
});

describe('mergePages', () => {
  it('keeps each card once, the copy updated last', () => {
    const stale = { ...item('a', 'todo', 1), updated_at: '2026-10-01' };
    const fresh = { ...item('a', 'done', 5), updated_at: '2026-10-02' };
    expect(mergePages([[stale, item('b', 'todo', 2)], [fresh]]).map((i) => [i.id, i.column_id]))
      .toEqual([['a', 'done'], ['b', 'todo']]);
  });
});

describe('arrange', () => {
  const board = { columns } as Board;

  it('orders columns as given, the rest after, and applies colors', () => {
    const arranged = arrange(board, ['done', 'todo'], { done: 'red' });
    expect(arranged.columns.map((c) => [c.id, c.color ?? null])).toEqual([['done', 'red'], [
      'todo',
      null,
    ], ['col_review', null]]);
  });
});

describe('hiddenByDefault', () => {
  it('hides archived columns only', () => {
    expect([hiddenByDefault({ ...columns[2], name: 'Archived' }), hiddenByDefault(columns[2])])
      .toEqual([true, false]);
  });
});

describe('swimlanes', () => {
  const owned = (
    id: string,
    column: string,
    rank: number,
    assignee: string | null,
    priority: string | null = null,
  ): WorkItem => ({
    ...item(id, column, rank),
    assignee: assignee ? { id: assignee, name: assignee.toUpperCase() } : null,
    priority,
  });
  const laned = [
    owned('a', 'todo', 1, 'zoe'),
    owned('b', 'todo', 2, 'amy'),
    owned('c', 'done', 1, null),
    owned('d', 'todo', 3, 'amy'),
  ];

  it('orders lanes by assignee alphabetically, unassigned last', () => {
    const lanes = [{ key: 'zoe', label: 'ZOE', total: 1 }, { key: 'none', label: null, total: 2 }, {
      key: 'amy',
      label: 'AMY',
      total: 3,
    }];
    expect(orderLanes(lanes, 'assignee').map((lane) => lane.label)).toEqual([
      'AMY',
      'ZOE',
      'Unassigned',
    ]);
  });

  it('orders priority lanes as the board lists priorities', () => {
    const lanes = [{ key: 'Low', label: 'Low', total: 1 }, { key: 'none', label: null, total: 1 }, {
      key: 'High',
      label: 'High',
      total: 1,
    }];
    expect(orderLanes(lanes, 'priority', ['High', 'Low']).map((lane) => lane.label)).toEqual([
      'High',
      'Low',
      'No priority',
    ]);
  });

  it('drops into another lane’s cell, among its cards', () => {
    expect(laneDropTarget(laned, columns, 'assignee', 'a', cellId('amy', 'todo'))).toEqual({
      lane: 'amy',
      columnId: 'todo',
      index: 2,
    });
    expect(laneDropTarget(laned, columns, 'assignee', 'a', 'd')).toEqual({
      lane: 'amy',
      columnId: 'todo',
      index: 1,
    });
  });

  it('moves a card down its own cell after the card it lands on', () => {
    expect(laneDropTarget(laned, columns, 'assignee', 'b', 'd')).toEqual({
      lane: 'amy',
      columnId: 'todo',
      index: 1,
    });
  });
});

describe('movesFrom and dropHint', () => {
  const trackerColumns: Column[] = [
    { id: 'c-todo', name: 'To Do', status_category: 'todo', status_ids: ['1'] },
    { id: 'c-doing', name: 'Doing', status_category: 'in_progress', status_ids: ['2', '4'] },
    { id: 'c-review', name: 'Review', status_category: 'in_progress', status_ids: ['3'] },
  ];
  const tracker: Board = {
    id: 'b',
    source: 'jira',
    target_key: 'OVR',
    name: 'OVR',
    kind: 'kanban',
    column_mode: 'tracker',
    columns: trackerColumns,
    column_prompt: { status: 'none', columns: [] },
    editable: true,
    workflow: {
      statuses: {
        '1': { name: 'To Do', category: 'todo' },
        '2': { name: 'In Progress', category: 'in_progress' },
        '3': { name: 'In Review', category: 'in_progress' },
        '4': { name: 'Blocked', category: 'in_progress' },
      },
      workflows: {
        w: {
          name: 'Dev',
          transitions: [
            { id: '11', name: 'Start', from: ['1'], to: '2' },
            { id: '12', name: 'Park', from: ['1'], to: '4' },
            { id: '21', name: 'Send to review', from: ['2'], to: '3' },
            { id: '31', name: 'To Do', from: null, to: '1' },
          ],
        },
      },
      by_issue_type: { '10001': 'w' },
    },
  };
  const card = {
    ...item('OVR-1', 'c-todo', 1),
    source: 'jira',
    status: 'To Do',
    status_id: '1',
    issue_type_id: '10001',
  };

  it('reads where a card can go from its tracker workflow, one landing spot per status', () => {
    const moves = movesFrom(tracker, card);
    expect(dropHint(moves, card, trackerColumns[0], trackerColumns)).toBeUndefined(); // its own column
    expect(dropHint(moves, card, trackerColumns[1], trackerColumns)).toEqual({
      allowed: true,
      zones: [
        { statusId: '2', label: 'To Do → In Progress', detail: 'Start' },
        { statusId: '4', label: 'To Do → Blocked', detail: 'Park' },
      ],
    });
    expect(dropHint(moves, card, trackerColumns[2], trackerColumns)).toEqual({ allowed: false });
  });

  it('prefers the tracker’s live answer, and says nothing when there are no rules', () => {
    const live = {
      basis: 'live' as const,
      targets: [{
        column_id: 'c-review',
        status_id: '3',
        status: 'In Review',
        transition_name: 'In Review',
      }],
    };
    expect(dropHint(movesFrom(tracker, card, live), card, trackerColumns[2], trackerColumns))
      .toEqual({
        allowed: true,
        zones: [{ statusId: '3', label: 'To Do → In Review', detail: null }],
      });
    expect(movesFrom(tracker, card, { basis: 'open', targets: [] })).toBeNull();
    expect(movesFrom({ ...tracker, workflow: null }, card)).toBeNull();
  });

  it('follows a native board’s per-column rules, open when it has none', () => {
    const columns: Column[] = [
      { id: 'todo', name: 'To do', status_category: 'todo', next: ['doing'] },
      { id: 'doing', name: 'Doing', status_category: 'in_progress', next: null },
      { id: 'done', name: 'Done', status_category: 'done', next: [] },
    ];
    const native: Board = {
      ...tracker,
      source: 'native',
      column_mode: 'default',
      columns,
      workflow: null,
    };
    const task = item('OW-1', 'todo', 1);
    const moves = movesFrom(native, task);
    expect(dropHint(moves, task, columns[1], columns)).toEqual({
      allowed: true,
      zones: [{ statusId: null, label: 'To do → Doing', detail: null }],
    });
    expect(dropHint(moves, task, columns[2], columns)).toEqual({ allowed: false });
    expect(
      movesFrom({ ...native, columns: columns.map((column) => ({ ...column, next: null })) }, task),
    ).toBeNull();
  });

  it('round-trips a drop zone id', () => {
    expect(parseZoneId(zoneId('c-doing', '4'))).toEqual({ columnId: 'c-doing', statusId: '4' });
    expect(parseZoneId('c-doing')).toBeNull();
  });
});

describe('workflow presets', () => {
  const column = (
    id: string,
    status_category: DraftColumn['status_category'] = 'in_progress',
  ): DraftColumn => ({ id, name: id, status_category, color: null, next: null });
  const columns = [column('todo', 'todo'), column('doing'), column('done', 'done')];

  it('opens every move, or allows only the next and previous column', () => {
    expect(presetNext(columns, 'step').map((c) => c.next)).toEqual([['doing'], ['todo', 'done'], [
      'doing',
    ]]);
    expect(presetOf(presetNext(columns, 'step'))).toBe('step');
    expect(presetOf(columns)).toBe('open');
    expect(presetOf([{ ...columns[0], next: ['done'] }, columns[1], columns[2]])).toBe('custom');
  });

  it('warns about columns nothing reaches and columns cards can’t leave', () => {
    const custom = [{ ...columns[0], next: ['doing'] }, { ...columns[1], next: [] }, {
      ...columns[2],
      next: [],
    }];
    expect(unreachableColumns(custom).map((c) => c.id)).toEqual(['todo', 'done']);
    expect(deadEndColumns(custom).map((c) => c.id)).toEqual(['doing']);
  });
});

describe('itemLink', () => {
  it('opens the item on its board', () => {
    expect(itemLink('https://app.test/board', 'b1', 'KAN-43')).toBe(
      'https://app.test/board?board=b1&item=KAN-43',
    );
  });

  it('encodes the key', () => {
    expect(new URL(itemLink('https://app.test/board', 'b 1', 'A&B')).searchParams.get('item')).toBe(
      'A&B',
    );
  });
});
