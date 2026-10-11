import { describe, expect, it } from 'vitest';
import { dropTarget, groupByColumn, moveItem, placement } from './lib';
import type { StatusCategory, WorkItem } from './types';

const item = (id: string, status_category: StatusCategory, rank: number): WorkItem => ({
  id, source: 'native', key: id, title: id, description: null, status: null, status_category, rank,
  assignee: null, priority: null, issue_type: null, target_key: null, external_url: null, editable: true,
  created_at: '', updated_at: '',
});

const items = [item('c', 'todo', 3), item('a', 'todo', 1), item('b', 'todo', 2), item('x', 'done', 1)];
const ids = (column: WorkItem[]) => column.map((i) => i.id);

describe('groupByColumn', () => {
  it('sorts each column by rank', () => {
    const columns = groupByColumn(items);
    expect([ids(columns.todo), ids(columns.in_progress), ids(columns.done)]).toEqual([['a', 'b', 'c'], [], ['x']]);
  });
});

describe('placement', () => {
  const column = groupByColumn(items).todo;

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
    const result = moveItem(items, 'c', 'todo', 0);
    expect(result.move).toEqual({ status_category: 'todo', before_id: null, after_id: 'a' });
    expect(ids(groupByColumn(result.items).todo)).toEqual(['c', 'a', 'b']);
  });

  it('moves across columns', () => {
    const result = moveItem(items, 'a', 'done', 1);
    expect(result.move).toEqual({ status_category: 'done', before_id: 'x', after_id: null });
    expect(ids(groupByColumn(result.items).done)).toEqual(['x', 'a']);
  });
});

describe('dropTarget', () => {
  it('puts a card dropped on a column at its end', () => {
    expect(dropTarget(items, 'a', 'done')).toEqual({ category: 'done', index: 1 });
  });

  it('puts a card moved down its column after the card it lands on', () => {
    expect(dropTarget(items, 'a', 'b')).toEqual({ category: 'todo', index: 1 });
  });

  it('puts a card moved up, or across, before the card it lands on', () => {
    expect(dropTarget(items, 'c', 'a')).toEqual({ category: 'todo', index: 0 });
    expect(dropTarget(items, 'x', 'b')).toEqual({ category: 'todo', index: 1 });
  });

  it('ignores dropping a card on itself', () => {
    expect(dropTarget(items, 'a', 'a')).toBeNull();
  });
});
