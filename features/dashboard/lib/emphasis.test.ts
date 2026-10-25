import { describe, expect, it } from 'vitest';
import { emphasis, RECEDED } from './emphasis';

const edges = [
  { source: 'r:a', target: 'r:b' },
  { source: 'r:c', target: 'r:a' },
  { source: 'r:d', target: 'r:e' },
];
const resting = { hovered: null, selected: null, highlighted: [] };

describe('emphasis', () => {
  it('draws everything at full strength when nothing is in focus', () => {
    const { focusId, opacityOf } = emphasis(edges, resting, 'r');

    expect(focusId).toBeNull();
    expect(opacityOf('r:d')).toBe(1);
  });

  it('lights the focused node and its neighbours, receding the rest', () => {
    const { focusId, opacityOf } = emphasis(edges, { ...resting, selected: 'r:a' }, 'r');

    expect(focusId).toBe('r:a');
    expect(['r:a', 'r:b', 'r:c'].map(opacityOf)).toEqual([1, 1, 1]);
    expect(opacityOf('r:d')).toBe(RECEDED.node);
  });

  it('lets hover win over the selection and the highlight', () => {
    const { focusId } = emphasis(edges, {
      hovered: 'r:d',
      selected: 'r:a',
      highlighted: ['r:b'],
    }, 'r');

    expect(focusId).toBe('r:d');
  });

  it('lets a highlight win over the selection, lighting closed folders that hold it', () => {
    const { focusId, opacityOf } = emphasis(edges, {
      ...resting,
      selected: 'r:a',
      highlighted: ['r:src/app.ts#main'],
    }, 'r');

    expect(focusId).toBeNull();
    expect(opacityOf('r:src')).toBe(1);
    expect(opacityOf('r:src/app.ts')).toBe(1);
    expect(opacityOf('r:srcs')).toBe(RECEDED.node);
  });

  it('lights the external dependencies folder for a highlighted package', () => {
    const { opacityOf } = emphasis(edges, { ...resting, highlighted: ['r:pkg:npm/react'] }, 'r');

    expect(opacityOf('r:__external__')).toBe(1);
    expect(opacityOf('r:src')).toBe(RECEDED.node);
  });

  it('lets a walkthrough win over the highlight and the selection, but not over hover', () => {
    const walk = { walked: new Set(['r:a', 'r:b']), upcoming: new Set(['r:c']) };
    const walking = emphasis(
      edges,
      { ...resting, selected: 'r:a', highlighted: ['r:d'], walk },
      'r',
    );

    expect(walking.focusId).toBeNull();
    expect(['r:a', 'r:b'].map(walking.opacityOf)).toEqual([1, 1]);
    expect(walking.opacityOf('r:c')).toBeGreaterThan(RECEDED.node);
    expect(walking.opacityOf('r:c')).toBeLessThan(1);
    expect(walking.opacityOf('r:d')).toBe(RECEDED.node);

    expect(emphasis(edges, { ...resting, hovered: 'r:d', walk }, 'r').focusId).toBe('r:d');
  });
});
