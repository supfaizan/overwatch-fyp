import { describe, expect, it } from 'vitest';
import {
  foldersToOpen,
  stepName,
  walkEdges,
  walkMarks,
  walkPath,
  walkStandIns,
} from './walkthrough';

const REPO = 'o/r';
const drawn = new Set([
  REPO,
  `${REPO}:api`,
  `${REPO}:api/users.py`,
  `${REPO}:__external__`,
  `${REPO}:web`,
]);

describe('foldersToOpen', () => {
  it('opens only what is still closed', () => {
    expect(foldersToOpen(['a'], ['a', 'a/b'], 64)).toEqual(['a/b']);
  });

  it('opens nothing when that would pass the cap', () => {
    expect(foldersToOpen(['a', 'b'], ['c', 'c/d'], 3)).toEqual([]);
    expect(foldersToOpen(['a', 'b'], ['c'], 3)).toEqual(['c']);
  });
});

describe('walkStandIns', () => {
  it('draws a step as itself, or as the innermost drawn folder holding it', () => {
    expect(walkStandIns(
      [
        `${REPO}:api/users.py`,
        `${REPO}:api/users.py#get@2`,
        `${REPO}:web/app/page.tsx`,
        `${REPO}:pkg:npm/react`,
        `${REPO}:setup.py`,
      ],
      drawn,
      REPO,
    )).toEqual([
      `${REPO}:api/users.py`,
      `${REPO}:api/users.py`,
      `${REPO}:web`,
      `${REPO}:__external__`,
      REPO,
    ]);
  });

  it('has nothing to stand in when not even the repository is drawn', () => {
    expect(walkStandIns([`${REPO}:api`], new Set(), REPO)).toEqual([null]);
  });
});

describe('walkMarks', () => {
  it('numbers each node with every step it stands for, marking the current one', () => {
    const marks = walkMarks(['a', 'b', 'a', null], 2);

    expect(marks.get('a')).toEqual({ numbers: [1, 3], current: true });
    expect(marks.get('b')).toEqual({ numbers: [2], current: false });
    expect(marks.size).toBe(2);
  });
});

describe('walkPath', () => {
  it('lists the hops taken so far, skipping stays and undrawn steps', () => {
    expect(walkPath(['a', 'a', 'b', null, 'c', 'd'], 5)).toEqual([['a', 'b'], ['c', 'd']]);
    expect(walkPath(['a', 'b', 'c'], 1)).toEqual([['a', 'b']]);
    expect(walkPath(['a', 'b'], 0)).toEqual([]);
  });
});

describe('stepName', () => {
  it('names a step by its file, symbol, package or repository', () => {
    expect(stepName(`${REPO}:api/users.py`, REPO)).toBe('users.py');
    expect(stepName(`${REPO}:api/users.py#UserService.get@2`, REPO)).toBe('UserService.get');
    expect(stepName(`${REPO}:pkg:npm/@scope/name`, REPO)).toBe('@scope/name');
    expect(stepName(REPO, REPO)).toBe('r');
    expect(stepName(`${REPO}:__external__`, REPO)).toBe('external dependencies');
  });
});

describe('walkEdges', () => {
  const edges = [{ id: 'a->b', source: 'a', target: 'b' }];

  it('points a hop along its line, or against one drawn the other way, with an arrow at the walked end', () => {
    const [along] = walkEdges(edges, [['a', 'b']], false);
    const [against] = walkEdges(edges, [['b', 'a']], false);

    expect([Boolean(along.markerEnd), Boolean(along.markerStart)]).toEqual([true, false]);
    expect([Boolean(against.markerEnd), Boolean(against.markerStart)]).toEqual([false, true]);
  });

  it('draws a dashed line of its own between steps nothing joins, and only the latest hop flows', () => {
    const result = walkEdges(edges, [['a', 'b'], ['b', 'c']], true);
    const added = result.find((edge) => {
      return edge.id === 'walk:b->c';
    });

    expect(added?.style?.strokeDasharray).toBe('6 4');
    expect(result.map((edge) => {
      return edge.animated;
    })).toEqual([false, true]);
  });
});
