import { describe, expect, it } from 'vitest';
import { typeOf } from './type-icon';
import type { WorkItemType } from './types';

const type = (id: string, name: string): WorkItemType => {
  return {
    id,
    name,
    icon: 'Circle',
    color: 'gray',
    source: 'native',
    created_at: '',
  };
};

describe('typeOf', () => {
  const types = [type('b', 'Bug'), type('t', 'Task')];

  it('finds an item’s type, and counts an untyped one as a Task', () => {
    expect(typeOf(types, 'b')?.name).toBe('Bug');
    expect(typeOf(types, null)?.name).toBe('Task');
    expect(typeOf([type('b', 'Bug')], null)?.name).toBe('Bug');
  });

  it('shows nothing for a type it doesn’t know, or before types load', () => {
    expect(typeOf(types, 'gone')).toBeUndefined();
    expect(typeOf(undefined, 'b')).toBeUndefined();
  });
});
