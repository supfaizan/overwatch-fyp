import { describe, expect, it } from 'vitest';
import { isInside } from '../store';
import type { ViewEdge } from '../types';
import { describeEdge, mergeByPair, neighbourhood, relationTo } from './edges';

const edge = (
  source: string,
  target: string,
  type: ViewEdge['type'],
  weight = 1,
  collapsed = false,
): ViewEdge => ({
  source,
  target,
  type,
  weight,
  collapsed,
});

describe('mergeByPair', () => {
  it('draws one line per direction of a pair, named by the most specific relationship', () => {
    const merged = mergeByPair([
      edge('a', 'b', 'IMPORTS', 3),
      edge('a', 'b', 'CALLS', 2, true),
      edge('b', 'a', 'IMPORTS'),
    ]);

    expect(merged).toEqual([
      {
        id: 'a->b',
        source: 'a',
        target: 'b',
        types: ['CALLS', 'IMPORTS'],
        weight: 5,
        collapsed: true,
      },
      { id: 'b->a', source: 'b', target: 'a', types: ['IMPORTS'], weight: 1, collapsed: false },
    ]);
    expect(describeEdge(merged[0])).toBe('calls, imports · 5');
  });

  it('ranks unlisted types after the listed ones', () => {
    expect(mergeByPair([edge('a', 'b', 'SENDS'), edge('a', 'b', 'IMPORTS')])[0].types).toEqual([
      'IMPORTS',
      'SENDS',
    ]);
  });
});

describe('focus', () => {
  const lines = [edge('a', 'b', 'CALLS'), edge('c', 'a', 'IMPORTS'), edge('c', 'd', 'IMPORTS')];

  it('tells what the focused node uses from what uses it', () => {
    expect(lines.map((line) => relationTo(line, 'a'))).toEqual([
      'outgoing',
      'incoming',
      'unrelated',
    ]);
    expect(relationTo(lines[0], null)).toBe('none');
  });

  it('finds the nodes one hop away', () => {
    expect([...neighbourhood(lines, 'a')].sort()).toEqual(['a', 'b', 'c']);
    expect(neighbourhood(lines, null).size).toBe(0);
  });
});

describe('isInside', () => {
  it('matches a container and what sits under it, only at a separator', () => {
    expect(isInside('repo:api', 'repo:api')).toBe(true);
    expect(isInside('repo:api/auth', 'repo:api')).toBe(true);
    expect(isInside('repo:api/auth.py#login', 'repo:api/auth.py')).toBe(true);
    expect(isInside('repo:apiary', 'repo:api')).toBe(false);
  });
});
