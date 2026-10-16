import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const GROUP_BY = { none: 'none', assignee: 'assignee', priority: 'priority' } as const;
export type GroupBy = (typeof GROUP_BY)[keyof typeof GROUP_BY];

export const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: GROUP_BY.none, label: 'None' },
  { value: GROUP_BY.assignee, label: 'Assignee' },
  { value: GROUP_BY.priority, label: 'Priority' },
];

/** One person's view of one board; column order and colors are the board's, shared with the team. */
export type BoardView = {
  /** column id -> hidden; columns not listed follow `hiddenByDefault` */
  hidden: Record<string, boolean>;
  groupBy: GroupBy;
};

const EMPTY: BoardView = { hidden: {}, groupBy: GROUP_BY.none };

type ViewState = {
  /** keyed `userId:boardId` */
  views: Record<string, BoardView>;
  setHidden: (key: string, columnId: string, hidden: boolean) => void;
  setGroupBy: (key: string, groupBy: GroupBy) => void;
};

/** Per-person board preferences, kept in this browser; storage that's unavailable just means defaults. */
export const useBoardViews = create<ViewState>()(
  persist(
    (set) => {
      return {
        views: {},
        setHidden: (key, columnId, hidden) => {
          return set((state) => {
            const view = state.views[key] ?? EMPTY;
            return {
              views: {
                ...state.views,
                [key]: { ...view, hidden: { ...view.hidden, [columnId]: hidden } },
              },
            };
          });
        },
        setGroupBy: (key, groupBy) => {
          return set((state) => {
            return {
              views: { ...state.views, [key]: { ...(state.views[key] ?? EMPTY), groupBy } },
            };
          });
        },
      };
    },
    {
      name: 'overwatch:board-views',
      storage: createJSONStorage(() => {
        return localStorage;
      }),
    },
  ),
);

export const viewOf = (views: Record<string, BoardView>, key: string) => {
  return views[key] ?? EMPTY;
};
