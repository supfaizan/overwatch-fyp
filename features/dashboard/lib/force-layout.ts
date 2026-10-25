import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import type { NodeLabel } from '../types';

type Point = { x: number; y: number };
type Dot = SimulationNodeDatum & { id: string; size: number; name: string; anchor?: Point };
type Strand = SimulationLinkDatum<Dot> & { length: number };

/** Must match what WebNode and WebOverflow draw: the layout keeps their circles apart by these. */
const DOT_SIZES: Record<NodeLabel, number> = {
  Repository: 64,
  Module: 44,
  File: 32,
  Package: 32,
  Route: 28,
  Channel: 28,
  Symbol: 24,
};
/** an overflow marker, which has no label */
const OVERFLOW_SIZE = 32;

export function dotSize(label?: NodeLabel): number {
  return label ? DOT_SIZES[label] : OVERFLOW_SIZE;
}

/** a name is drawn beneath its circle in 12px monospace, cut off past `max-w-40` */
const CHAR_WIDTH = 7.2;
const NAME_CHARS = 22;
/** clearance kept around each node and its name */
const GAP = 14;
/** an open folder's close button, pinned past its top-right */
const CONTROL_ROOM = 10;
const TICKS = 300;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
/** the widest a folder's contents fan out, and the angle each sibling adds until then */
const FAN = Math.PI;
const FAN_STEP = 0.5;
/** arc length each sibling needs in its fan */
const SEAT = 70;
const SEAT_TRIES = 20;
const ANCHOR = 0.3;

/** How far a node and its name reach from its centre: wide enough that neighbours' names don't meet. */
const reach = (node: { size: number; name: string }) => {
  const nameWidth = Math.min(node.name.length, NAME_CHARS) * CHAR_WIDTH;
  return Math.max(node.size / 2 + CONTROL_ROOM, nameWidth / 2) + GAP;
};

type Seat = Point & { reach: number; radius: number };

/** turns either side of a seat's angle to try when it's taken, nearest first */
const TURNS = [0, 0.25, -0.25, 0.5, -0.5, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6];
/** room a strand keeps from a circle it passes */
const STRAND_CLEARANCE = 6;

/** Whether the straight strand between two points keeps clear of every circle but its own ends. */
const isUnblocked = (from: Point, to: Point, taken: Seat[]) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSq = dx * dx + dy * dy || 1;
  return taken.every((other) => {
    if (Math.hypot(other.x - from.x, other.y - from.y) < 1) {
      return true;
    }
    const along = Math.max(
      0,
      Math.min(1, ((other.x - from.x) * dx + (other.y - from.y) * dy) / lengthSq),
    );
    const near = Math.hypot(other.x - (from.x + along * dx), other.y - (from.y + along * dy));
    return near >= other.radius + STRAND_CLEARANCE;
  });
};

/** Whether a strand between two points crosses none of `strands`; strands sharing an end don't cross. */
const crossesNone = (from: Point, to: Point, strands: [Point, Point][]) => {
  const side = (a: Point, b: Point, c: Point) => {
    return Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  };
  const same = (a: Point, b: Point) => {
    return Math.hypot(a.x - b.x, a.y - b.y) < 1;
  };
  return strands.every(([start, end]) => {
    if (same(start, from) || same(end, from) || same(start, to) || same(end, to)) {
      return true;
    }
    return side(from, to, start) === side(from, to, end)
      || side(start, end, from) === side(start, end, to);
  });
};

const isClear = (point: Point, room: number, taken: Seat[]) => {
  return taken.every((other) => {
    return Math.hypot(point.x - other.x, point.y - other.y) >= room + other.reach;
  });
};

const byText = (a: string, b: string) => {
  return a < b ? -1 : a > b ? 1 : 0;
};

/**
 * Positions for the web: each folder sits among its contents on short, strong strands. Only the
 * folder tree places nodes; relationships pulling code towards its users would interleave folders and
 * cross their strands, and they're drawn over the top anyway. Nodes placed last time are anchored
 * there, so opening a folder grows the web around it instead of reshuffling it.
 * Returns top-left corners, as React Flow positions nodes.
 */
export function forcePositions(
  nodes: { id: string; size: number; name: string }[],
  tree: { parent: string; child: string }[],
  previous: Record<string, Point> = {},
): Record<string, Point> {
  const sizes = new Map(nodes.map((node) => {
    return [node.id, node.size];
  }));
  const byId = new Map(nodes.map((node) => {
    return [node.id, node];
  }));
  const parentOf = new Map(
    tree.filter((line) => {
      return line.parent !== line.child && sizes.has(line.parent) && sizes.has(line.child);
    }).map((line) => {
      return [line.child, line.parent];
    }),
  );

  // new nodes start in a fan beyond their parent, pointing away from its own parent, so a folder's
  // contents open outwards instead of across its neighbours' strands
  const newSiblings = new Map<string | undefined, number>();
  for (const node of nodes) {
    if (!previous[node.id]) {
      const parent = parentOf.get(node.id);
      newSiblings.set(parent, (newSiblings.get(parent) ?? 0) + 1);
    }
  }
  const placed = nodes.filter((node) => {
    return previous[node.id];
  }).map((node) => {
    return {
      x: previous[node.id].x + node.size / 2,
      y: previous[node.id].y + node.size / 2,
      reach: reach(node),
      radius: node.size / 2,
    };
  });
  // a seat clear of everything placed, so a new node doesn't start wedged among nodes held in place,
  // reached by a strand that crosses none already drawn
  const taken = [...placed];
  const centreOf = (id: string) => {
    const size = sizes.get(id) ?? 0;
    return { x: previous[id].x + size / 2, y: previous[id].y + size / 2 };
  };
  const drawn: [Point, Point][] = [...parentOf].filter(([child, parent]) => {
    return previous[child] && previous[parent];
  }).map(([child, parent]) => {
    return [centreOf(parent), centreOf(child)];
  });
  const seeded = new Map<string, Point>();
  const siblingsSeen = new Map<string | undefined, number>();
  const seed = (id: string): Point => {
    const known = seeded.get(id);
    if (known) {
      return known;
    }
    const corner = previous[id];
    const size = sizes.get(id) ?? 0;
    let point: Point;
    if (corner) {
      point = { x: corner.x + size / 2, y: corner.y + size / 2 };
    } else {
      const parent = parentOf.get(id);
      const index = siblingsSeen.get(parent) ?? 0;
      siblingsSeen.set(parent, index + 1);
      if (parent) {
        const origin = seed(parent);
        const grandparent = parentOf.get(parent);
        const count = newSiblings.get(parent) ?? 1;
        let angle: number;
        let spread = 2 * Math.PI;
        if (grandparent) {
          const away = seed(grandparent);
          spread = Math.min(FAN, count * FAN_STEP);
          const step = count > 1 ? spread / (count - 1) : 0;
          angle = Math.atan2(origin.y - away.y, origin.x - away.x)
            + (index - (count - 1) / 2) * step;
        } else {
          angle = (index / count) * 2 * Math.PI;
        }
        // far enough out that the fan's arc has room for every sibling; if that seat is taken, or its
        // strand would run under another node, try either side of it, then further out
        const room = reach(byId.get(id) ?? { size, name: '' });
        const base = Math.max(100, (count * SEAT) / spread);
        const seatAt = (distance: number, turn: number) => {
          return {
            x: origin.x + distance * Math.cos(angle + turn),
            y: origin.y + distance * Math.sin(angle + turn),
          };
        };
        point = seatAt(base, 0);
        for (let ring = 0; ring < SEAT_TRIES; ring++) {
          const distance = base + (ring * SEAT) / 2;
          const turn = TURNS.find((option) => {
            const seat = seatAt(distance, option);
            return isClear(seat, room, taken) && isUnblocked(origin, seat, taken)
              && crossesNone(origin, seat, drawn);
          });
          if (turn !== undefined) {
            point = seatAt(distance, turn);
            break;
          }
        }
        taken.push({ ...point, reach: room, radius: size / 2 });
        drawn.push([origin, point]);
      } else {
        const distance = 40 * Math.sqrt(index);
        point = {
          x: distance * Math.cos(index * GOLDEN_ANGLE),
          y: distance * Math.sin(index * GOLDEN_ANGLE),
        };
      }
    }
    seeded.set(id, point);
    return point;
  };

  // everything sorted, so the same view always seeds, and so settles, the same way
  const dots: Dot[] = [...nodes].sort((a, b) => {
    return byText(a.id, b.id);
  }).map((node) => {
    const at = seed(node.id);
    return { ...node, x: at.x, y: at.y, anchor: previous[node.id] && at };
  });

  const childCount = new Map<string, number>();
  for (const parent of parentOf.values()) {
    childCount.set(parent, (childCount.get(parent) ?? 0) + 1);
  }
  const strands = [...parentOf].sort(([a], [b]) => {
    return byText(a, b);
  }).map(([child, parent]) => {
    // a crowded folder holds its contents further out, on a ring with a seat for each
    const length = Math.max(
      ((sizes.get(parent) ?? 0) + (sizes.get(child) ?? 0)) / 2 + 48,
      ((childCount.get(parent) ?? 0) * SEAT) / (2 * Math.PI),
    );
    return { source: parent, target: child, length };
  });

  // placed nodes are held where they were, yielding a little to make room; a new node with no parent
  // to hold it drifts to the middle
  const hold = (dot: Dot) => {
    return dot.anchor ? ANCHOR : parentOf.has(dot.id) ? 0 : 0.02;
  };
  const simulation = forceSimulation(dots)
    .force(
      'tree',
      forceLink<Dot, Strand>(strands)
        .id((dot) => {
          return dot.id;
        })
        .distance((line) => {
          return line.length;
        })
        .strength(0.9),
    )
    .force('charge', forceManyBody<Dot>().strength(-260).distanceMax(700))
    .force(
      'collide',
      forceCollide<Dot>(reach).iterations(3),
    )
    .force(
      'x',
      forceX<Dot>((dot) => {
        return dot.anchor?.x ?? 0;
      }).strength(hold),
    )
    .force(
      'y',
      forceY<Dot>((dot) => {
        return dot.anchor?.y ?? 0;
      }).strength(hold),
    )
    .stop();
  simulation.tick(TICKS);

  return Object.fromEntries(dots.map((dot) => {
    return [dot.id, { x: (dot.x ?? 0) - dot.size / 2, y: (dot.y ?? 0) - dot.size / 2 }];
  }));
}
