import { describe, expect, it } from 'vitest';
import { forcePositions } from './force-layout';

const repo = 'o/r';
const folders = ['o/r:api', 'o/r:web', 'o/r:lib'];
const apiFiles = ['o/r:api/a.ts', 'o/r:api/b.ts', 'o/r:api/c.ts'];

const dots = (ids: string[]) => {
  return ids.map((id) => {
    return { id, size: id === repo ? 64 : 32, name: id.split(':').at(-1) ?? id };
  });
};
const under = (parent: string, children: string[]) => {
  return children.map((child) => {
    return { parent, child };
  });
};

const closed = { nodes: dots([repo, ...folders]), tree: under(repo, folders) };
const opened = {
  nodes: dots([repo, ...folders, ...apiFiles]),
  tree: [...closed.tree, ...under('o/r:api', apiFiles)],
};

const centreOf = (positions: Record<string, { x: number; y: number }>, id: string) => {
  const size = id === repo ? 64 : 32;
  return { x: positions[id].x + size / 2, y: positions[id].y + size / 2 };
};
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  return Math.hypot(a.x - b.x, a.y - b.y);
};

describe('forcePositions', () => {
  it('places every node, finitely', () => {
    const positions = forcePositions(opened.nodes, opened.tree);

    expect(Object.keys(positions).sort()).toEqual(
      opened.nodes.map((node) => {
        return node.id;
      }).sort(),
    );
    for (const point of Object.values(positions)) {
      expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
    }
  });

  it('draws the same view the same way, whatever order it arrives in', () => {
    const first = forcePositions(opened.nodes, opened.tree);
    const again = forcePositions([...opened.nodes].reverse(), [...opened.tree].reverse());

    expect(again).toEqual(first);
  });

  it("keeps a folder's contents closer to it than to other folders", () => {
    const positions = forcePositions(opened.nodes, opened.tree);
    const api = centreOf(positions, 'o/r:api');
    const web = centreOf(positions, 'o/r:web');

    for (const file of apiFiles) {
      const at = centreOf(positions, file);
      expect(distance(at, api)).toBeLessThan(distance(at, web));
    }
  });

  it('keeps nodes apart', () => {
    const positions = forcePositions(opened.nodes, opened.tree);
    const ids = Object.keys(positions);

    for (const [index, a] of ids.entries()) {
      for (const b of ids.slice(index + 1)) {
        expect(distance(centreOf(positions, a), centreOf(positions, b))).toBeGreaterThan(32);
      }
    }
  });

  it('opening a folder leaves what was already placed roughly where it was', () => {
    const before = forcePositions(closed.nodes, closed.tree);
    const after = forcePositions(opened.nodes, opened.tree, before);

    for (const id of ['o/r:web', 'o/r:lib', repo]) {
      expect(distance(centreOf(after, id), centreOf(before, id))).toBeLessThan(40);
    }
  });

  it('never leaves a new node overlapping placed ones that surround its folder', () => {
    // a folder boxed in by a tight ring of already placed nodes
    const ring = Array.from({ length: 8 }, (_, index) => {
      return `o/r:n${index}`;
    });
    const placed: Record<string, { x: number; y: number }> = { 'o/r:hub': { x: -16, y: -16 } };
    ring.forEach((id, index) => {
      const angle = (index / ring.length) * 2 * Math.PI;
      placed[id] = { x: 70 * Math.cos(angle) - 16, y: 70 * Math.sin(angle) - 16 };
    });
    const opened = ['o/r:hub/a', 'o/r:hub/b', 'o/r:hub/c'];
    const all = [...dots(['o/r:hub', ...ring, ...opened])];
    const positions = forcePositions(all, under('o/r:hub', opened), placed);

    for (const id of opened) {
      for (
        const other of Object.keys(positions).filter((key) => {
          return key !== id;
        })
      ) {
        // two 32px circles, each with its clearance
        expect(distance(centreOf(positions, id), centreOf(positions, other))).toBeGreaterThan(32);
      }
    }
  });

  it('ignores tree lines to nodes that are not drawn', () => {
    const positions = forcePositions(closed.nodes, [...closed.tree, {
      parent: 'o/r:x',
      child: 'o/r:y',
    }]);

    expect(Object.keys(positions)).toHaveLength(closed.nodes.length);
  });
});
