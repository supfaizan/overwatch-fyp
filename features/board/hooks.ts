'use client';

import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { isRunning, JOB_POLL_MS } from '@/shared/lib/job-status';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { useDndContext } from '@dnd-kit/core';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as boardApi from './api';
import type { ItemPage } from './api';
import { arrange, cellId, type DropHint, dropHint, mergePages, movesFrom } from './lib';
import { NATIVE_SOURCE } from './types';
import type {
  Board,
  Column,
  ColumnColor,
  Comment,
  MoveWorkItem,
  Sprint,
  SprintFields,
  SyncTarget,
  Tracker,
  WorkItem,
  WorkItemChanges,
} from './types';

const root = ['board'] as const;
const keys = {
  boards: [...root, 'boards'] as const,
  // under the shared root, so anything invalidating work items refreshes every board's
  items: (boardId: string) => {
    return [...queryKeys.workItems, boardId] as const;
  },
  byKey: (boardId: string, key: string) => {
    return [...queryKeys.workItems, boardId, 'key', key] as const;
  },
  planned: (boardId: string, sprintId: string | null) => {
    return [...queryKeys.workItems, boardId, 'planned', sprintId ?? 'backlog'] as const;
  },
  sprints: (boardId: string) => {
    return [...root, 'sprints', boardId] as const;
  },
  priorities: (boardId: string) => {
    return [...root, 'priorities', boardId] as const;
  },
  comments: (itemId: string) => {
    return [...root, 'comments', itemId] as const;
  },
  assignees: (provider: string, targetKey: string | null) => {
    return [...queryKeys.connections, provider, targetKey, 'assignees'] as const;
  },
  members: (workspaceId: string) => {
    return [...root, 'members', workspaceId] as const;
  },
};

const showError = (error: ApiError) => {
  return toast.error(error.message);
};

// a board opened again within this long shows at once from the cache, and is refreshed behind it
const BOARD_CACHE_MS = 30 * 60_000;

export const useBoards = () => {
  return useQuery({ queryKey: keys.boards, queryFn: boardApi.getBoards, gcTime: BOARD_CACHE_MS });
};

/** One column's (or swimlane cell's) loaded cards: how many there are in all, and whether more are coming. */
type PagedState = { total: number; hasMore: boolean; loadingMore: boolean };

/**
 * Pages loaded per column (or cell), starting again from one page whenever `scope` changes; `more` asks
 * for the next page from the latest counts, so loading several at once keeps every one.
 */
function usePageCounts(scope: string) {
  const [pages, setPages] = useState<{ scope: string; counts: Record<string, number> }>({
    scope,
    counts: {},
  });
  const counts = pages.scope === scope ? pages.counts : {};
  const more = (id: string) => {
    return setPages((previous) => {
      const latest = previous.scope === scope ? previous.counts : {};
      return { scope, counts: { ...latest, [id]: (latest[id] ?? 1) + 1 } };
    });
  };
  return { counts, more };
}

/** A linked item that isn't among the loaded cards; off until there's a key to look up. */
export function useWorkItemByKey(boardId: string | undefined, key: string | null) {
  return useQuery({
    queryKey: keys.byKey(boardId ?? '', key ?? ''),
    queryFn: () => {
      return boardApi.getWorkItemByKey(boardId ?? '', key ?? '');
    },
    enabled: Boolean(boardId && key),
    retry: false,
  });
}

/**
 * The loaded cards of a board's columns, a page at a time per column: each page is its own query,
 * so the board still sees every loaded card in one place (for drops and swimlanes), and scrolling a
 * column only asks for its next page.
 */
export function useBoardItems(board: Board | undefined, columns: Column[], sprint: string) {
  // a different board, kind or sprint starts again from the first page
  const { counts, more } = usePageCounts(`${board?.id}|${board?.kind}|${sprint}`);
  const requests = board
    ? columns.flatMap((column) => {
      return Array.from({ length: counts[column.id] ?? 1 }, (_, index) => {
        return { column, page: index + 1 };
      });
    })
    : [];
  const results = useQueries({
    queries: requests.map(({ column, page }) => {
      return {
        queryKey: [...keys.items(board?.id ?? ''), board?.kind, sprint, column.id, page],
        queryFn: () => {
          return boardApi.getColumnPage(board as Board, column, sprint, page);
        },
        gcTime: BOARD_CACHE_MS,
      };
    }),
  });

  const perColumn: Record<string, PagedState> = {};
  for (const column of columns) {
    const own = results.filter((_, index) => {
      return requests[index].column.id === column.id;
    });
    const loaded = own.reduce((sum, result) => {
      return sum + (result.data?.items.length ?? 0);
    }, 0);
    const total = own[0]?.data?.total ?? 0;
    perColumn[column.id] = {
      total,
      hasMore: loaded < total,
      loadingMore: own.length > 1 && Boolean(own.at(-1)?.isPending),
    };
  }
  const firstPages = results.filter((_, index) => {
    return requests[index].page === 1;
  });

  return {
    items: mergePages(results.map((result) => {
      return result.data?.items ?? [];
    })),
    columns: perColumn,
    isPending: !board || firstPages.some((result) => {
      return result.isPending;
    }),
    error: results.find((result) => {
      return result.isError;
    })?.error ?? null,
    refetch: () => {
      return results.forEach((result) => {
        return void result.refetch();
      });
    },
    loadMore: (columnId: string) => {
      if (perColumn[columnId]?.hasMore && !perColumn[columnId].loadingMore) {
        more(columnId);
      }
    },
  };
}

export const useSprints = (boardId: string | undefined) => {
  return useQuery({
    queryKey: keys.sprints(boardId ?? ''),
    queryFn: () => {
      return boardApi.getSprints(boardId ?? '');
    },
    enabled: Boolean(boardId),
    gcTime: BOARD_CACHE_MS,
  });
};

/** The backlog view's sections: each open sprint's items, then the backlog's (null). */
export const usePlanned = (boardId: string, sprintIds: (string | null)[]) => {
  return useQueries({
    queries: sprintIds.map((sprintId) => {
      return {
        queryKey: keys.planned(boardId, sprintId),
        queryFn: () => {
          return boardApi.getPlanned(boardId, sprintId);
        },
        gcTime: BOARD_CACHE_MS,
      };
    }),
  });
};

/** Creating, starting and completing sprints change the board's kind, its sprints and what each view shows. */
function useSprintMutation<TArg>(mutationFn: (arg: TArg) => Promise<Sprint>, success: string) {
  const queryClient = useQueryClient();
  return useMutation<Sprint, ApiError, TArg>({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: root });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workItems });
      toast.success(success);
    },
    onError: showError,
  });
}

export const useCreateSprint = () => {
  return useSprintMutation(
    (body: SprintFields & { boardId: string }) => {
      return boardApi.createSprint(body);
    },
    'Sprint created.',
  );
};
export const useStartSprint = () => {
  return useSprintMutation(boardApi.startSprint, 'Sprint started.');
};
export const useCompleteSprint = () => {
  return useSprintMutation(boardApi.completeSprint, 'Sprint completed.');
};

type SprintMove = {
  boardId: string;
  item: WorkItem;
  to: string | null;
  before_id: string | null;
  after_id: string | null;
  rank: number;
};

/** Moves a card between sprints and the backlog right away, and puts it back if the server, or the tracker, refuses. */
export function useSetItemSprint() {
  const queryClient = useQueryClient();
  return useMutation<
    WorkItem,
    ApiError,
    SprintMove,
    { snapshots: [readonly unknown[], ItemPage | undefined][] }
  >({
    mutationFn: ({ item, to, before_id, after_id }) => {
      return boardApi.setItemSprint({ id: item.id, sprint_id: to, before_id, after_id });
    },
    onMutate: async ({ boardId, item, to, rank }) => {
      const from = keys.planned(boardId, item.sprint_id);
      const into = keys.planned(boardId, to);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: from }),
        queryClient.cancelQueries({ queryKey: into }),
      ]);
      const snapshots: [readonly unknown[], ItemPage | undefined][] = [
        [from, queryClient.getQueryData<ItemPage>(from)],
        [into, queryClient.getQueryData<ItemPage>(into)],
      ];
      const moved = { ...item, sprint_id: to, rank };
      const without = (page: ItemPage) => {
        return page.items.filter((candidate) => {
          return candidate.id !== item.id;
        });
      };
      queryClient.setQueryData<ItemPage>(
        from,
        (page) => {
          return page && { items: without(page), total: page.total - 1 };
        },
      );
      queryClient.setQueryData<ItemPage>(
        into,
        (page) => {
          return page && { items: [...without(page), moved], total: page.total + 1 };
        },
      );
      return { snapshots };
    },
    onError: (error, _, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
      showError(error);
    },
    onSettled: () => {
      return void queryClient.invalidateQueries({ queryKey: queryKeys.workItems });
    },
  });
}

type ColumnSettings = {
  boardId: string;
  column_order?: string[];
  column_colors?: Record<string, ColumnColor | null>;
};

/**
 * A board grouped into swimlanes: its lanes, then each lane's cards per column, a batch at a time per
 * cell, so every person's (or priority's) column starts with its own first batch and scrolls for more.
 */
export function useSwimlaneItems(
  board: Board | undefined,
  columns: Column[],
  by: 'assignee' | 'priority' | null,
  sprint: string,
) {
  const enabled = Boolean(board && by && columns.length);
  const lanes = useQuery({
    queryKey: [...keys.items(board?.id ?? ''), board?.kind, sprint, 'lanes', by],
    queryFn: () => {
      return boardApi.getLanes(board as Board, by ?? 'assignee', sprint);
    },
    enabled,
    gcTime: BOARD_CACHE_MS,
  });
  const { counts, more } = usePageCounts(`${board?.id}|${board?.kind}|${sprint}|${by}`);
  const requests = enabled
    ? (lanes.data ?? []).flatMap((lane) => {
      return columns.flatMap((column) => {
        const cell = cellId(lane.key, column.id);
        return Array.from(
          { length: counts[cell] ?? 1 },
          (_, index) => {
            return { cell, lane: lane.key, column, page: index + 1 };
          },
        );
      });
    })
    : [];
  const results = useQueries({
    queries: requests.map(({ lane, column, page }) => {
      return {
        queryKey: [
          ...keys.items(board?.id ?? ''),
          board?.kind,
          sprint,
          'lane',
          by,
          lane,
          column.id,
          page,
        ],
        queryFn: () => {
          return boardApi.getColumnPage(board as Board, column, sprint, page, {
            by: by ?? 'assignee',
            key: lane,
          });
        },
        gcTime: BOARD_CACHE_MS,
      };
    }),
  });

  // each cell's first page carries its total; its last page, if past the first, is the one loading
  const loaded: Record<string, number> = {};
  const cells: Record<string, PagedState> = {};
  requests.forEach(({ cell, page }, index) => {
    const result = results[index];
    loaded[cell] = (loaded[cell] ?? 0) + (result.data?.items.length ?? 0);
    if (page === 1) {
      cells[cell] = { total: result.data?.total ?? 0, hasMore: false, loadingMore: false };
    } else if (page === counts[cell]) {
      cells[cell].loadingMore = result.isPending;
    }
  });
  for (const [cell, state] of Object.entries(cells)) {
    state.hasMore = loaded[cell] < state.total;
  }

  return {
    lanes: lanes.data ?? [],
    items: mergePages(results.map((result) => {
      return result.data?.items ?? [];
    })),
    cells,
    isPending: enabled
      && (lanes.isPending
        || results.some((result, index) => {
          return requests[index].page === 1 && result.isPending;
        })),
    error: lanes.error ?? results.find((result) => {
      return result.isError;
    })?.error ?? null,
    refetch: () => {
      void lanes.refetch();
      results.forEach((result) => {
        return void result.refetch();
      });
    },
    loadMore: (cell: string) => {
      if (cells[cell]?.hasMore && !cells[cell].loadingMore) {
        more(cell);
      }
    },
  };
}

/** Column order and colors, shown at once and put back if the server refuses. */
export function useColumnSettings() {
  const queryClient = useQueryClient();
  return useMutation<Board, ApiError, ColumnSettings, { previous?: Board[] }>({
    mutationFn: boardApi.updateColumnSettings,
    onMutate: async ({ boardId, column_order, column_colors }) => {
      await queryClient.cancelQueries({ queryKey: keys.boards });
      const previous = queryClient.getQueryData<Board[]>(keys.boards);
      queryClient.setQueryData<Board[]>(
        keys.boards,
        (boards) => {
          return boards?.map((
            board,
          ) => {
            return (board.id === boardId ? arrange(board, column_order, column_colors) : board);
          });
        },
      );
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(keys.boards, context.previous);
      }
      showError(error);
    },
    onSuccess: (board) => {
      return queryClient.setQueryData<Board[]>(
        keys.boards,
        (boards) => {
          return boards?.map((b) => {
            return (b.id === board.id ? board : b);
          });
        },
      );
    },
  });
}

/** Use the tracker's columns, or keep (go back to) the default three. */
export function useColumnChoice() {
  const queryClient = useQueryClient();
  return useMutation<Board, ApiError, { boardId: string; tracker: boolean }>({
    mutationFn: (
      { boardId, tracker },
    ) => {
      return (tracker
        ? boardApi.adoptTrackerColumns(boardId)
        : boardApi.keepDefaultColumns(boardId));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.boards });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workItems });
    },
    onError: showError,
  });
}

// while a tracker project syncs in the background, check on it until it's done
export const useTrackers = () => {
  return useQuery({
    queryKey: queryKeys.connections,
    queryFn: boardApi.getTrackers,
    gcTime: BOARD_CACHE_MS,
    refetchInterval: (query) => {
      return (query.state.data?.some((tracker) => {
          return tracker.targets.some((target) => {
            return isRunning(target.sync_status);
          });
        })
        ? JOB_POLL_MS
        : false);
    },
  });
};

/** The sync state of a tracker board's project; undefined for boards made here. */
export const syncTargetOf = (trackers: Tracker[] | undefined, board: Board | undefined) => {
  return board?.target_key
    ? trackers?.find((tracker) => {
      return tracker.provider === board.source;
    })?.targets.find((target) => {
      return target.key === board.target_key;
    })
    : undefined;
};

/**
 * Keeps a tracker board up to date with its tracker: it syncs when the board is opened, and on
 * `sync()` (the refresh button). Whatever is cached stays on screen meanwhile; once a sync has
 * brought something new, the board refetches in place.
 */
export function useBoardSync(board: Board | undefined, target: SyncTarget | undefined) {
  const queryClient = useQueryClient();
  const sync = useMutation({
    mutationFn: boardApi.syncBoard,
    onSuccess: (synced) => {
      if (!board) {
        return;
      }
      queryClient.setQueryData<Tracker[]>(
        queryKeys.connections,
        (trackers) => {
          return trackers?.map((tracker) => {
            return tracker.provider === board.source
              ? {
                ...tracker,
                targets: tracker.targets.map((
                  each,
                ) => {
                  return (each.key === synced.key ? { ...each, ...synced } : each);
                }),
              }
              : tracker;
          });
        },
      );
    },
    onError: showError,
  });
  const { mutate } = sync;

  // once per board opened (StrictMode runs effects twice)
  const opened = useRef<string | null>(null);
  const boardId = board?.target_key ? board.id : null;
  useEffect(() => {
    if (!boardId || opened.current === boardId) {
      return;
    }
    opened.current = boardId;
    mutate({ boardId, force: false });
  }, [boardId, mutate]);

  // a finished sync, whether it came back with the request or was polled for, refreshes what the board shows
  const syncedAt = target?.last_synced_at ?? null;
  const seen = useRef({ boardId, syncedAt });
  useEffect(() => {
    const previous = seen.current;
    seen.current = { boardId, syncedAt };
    if (!boardId || previous.boardId !== boardId || previous.syncedAt === syncedAt) {
      return;
    }
    void queryClient.invalidateQueries({ queryKey: keys.items(boardId) });
    void queryClient.invalidateQueries({ queryKey: keys.sprints(boardId) });
    void queryClient.invalidateQueries({ queryKey: keys.boards });
  }, [boardId, syncedAt, queryClient]);

  return {
    sync: () => {
      if (boardId) {
        mutate({ boardId, force: true });
      }
    },
    syncing: sync.isPending || isRunning(target?.sync_status),
  };
}

/** Who an item can be assigned to: workspace members, or the tracker project's assignable users. */
export function usePeople(provider: string | null, targetKey: string | null) {
  const workspaceId = useCurrentWorkspace()?.id ?? '';
  return useQuery({
    queryKey: provider ? keys.assignees(provider, targetKey) : keys.members(workspaceId),
    queryFn: () => {
      return (provider && targetKey
        ? boardApi.getTrackerAssignees(provider, targetKey)
        : boardApi.getMembers(workspaceId));
    },
    enabled: provider ? Boolean(targetKey) : Boolean(workspaceId),
  });
}

function useItemMutation<TArg, TResult>(
  mutationFn: (arg: TArg) => Promise<TResult>,
  success?: string,
) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workItems });
      if (success) {
        toast.success(success);
      }
    },
    onError: showError,
  });
}

export const useCreateWorkItem = () => {
  return useItemMutation(boardApi.createWorkItem);
};
export const useUpdateWorkItem = () => {
  return useItemMutation(boardApi.updateWorkItem);
};
export const useDeleteWorkItem = () => {
  return useItemMutation(boardApi.deleteWorkItem, 'Item deleted.');
};

type Move = {
  boardId: string;
  id: string;
  move: MoveWorkItem;
  rank: number;
  /** fields changed with the move (a swimlane drop reassigns), saved first; `patch` shows them at once */
  changes?: WorkItemChanges;
  patch?: Partial<WorkItem>;
};

/** Everything cached under a board's items (column pages and backlog sections) is an `ItemPage`. */
type CachedItems = ItemPage | undefined;

// the board's cache also holds the swimlanes list under the same key, which has no cards to change
const isItemPage = (data: unknown): data is ItemPage => {
  return typeof data === 'object' && data !== null && Array.isArray((data as ItemPage).items);
};
const mapCached = (data: CachedItems, change: (item: WorkItem) => WorkItem): CachedItems => {
  return isItemPage(data) ? { ...data, items: data.items.map(change) } : data;
};

/** Moves a card right away (see `moveItem`) and puts it back if the server, or the tracker, refuses. */
export function useMoveWorkItem() {
  const queryClient = useQueryClient();
  return useMutation<WorkItem, ApiError, Move, { snapshots: [readonly unknown[], CachedItems][] }>({
    mutationFn: async ({ id, move, changes }) => {
      if (changes) {
        await boardApi.updateWorkItem({ id, ...changes });
      }
      return boardApi.moveWorkItem({ id, ...move });
    },
    onMutate: async ({ boardId, id, move, rank, patch }) => {
      await queryClient.cancelQueries({ queryKey: keys.items(boardId) });
      const snapshots = queryClient.getQueriesData<CachedItems>({ queryKey: keys.items(boardId) });
      queryClient.setQueriesData<CachedItems>(
        { queryKey: keys.items(boardId) },
        (data) => {
          return mapCached(
            data,
            (
              item,
            ) => {
              return (item.id === id
                ? { ...item, ...patch, column_id: move.column_id, rank }
                : item);
            },
          );
        },
      );
      return { snapshots };
    },
    onError: (error, { changes }, context) => {
      // a reassignment may have saved before the move failed, so the refetch (onSettled) shows what stuck
      if (!changes) {
        for (const [key, data] of context?.snapshots ?? []) {
          queryClient.setQueryData(key, data);
        }
      }
      showError(error);
    },
    onSettled: () => {
      return void queryClient.invalidateQueries({ queryKey: queryKeys.workItems });
    },
  });
}

export const usePriorities = (boardId: string, enabled = true) => {
  return useQuery({
    queryKey: keys.priorities(boardId),
    queryFn: () => {
      return boardApi.getPriorities(boardId);
    },
    staleTime: 5 * 60_000,
    enabled: enabled && Boolean(boardId),
  });
};

export const useComments = (itemId: string) => {
  return useQuery({
    queryKey: keys.comments(itemId),
    queryFn: () => {
      return boardApi.getComments(itemId);
    },
  });
};

function useCommentMutation<TArg extends { itemId: string }, TResult>(
  mutationFn: (arg: TArg) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: (_, { itemId }) => {
      return void queryClient.invalidateQueries({ queryKey: keys.comments(itemId) });
    },
    onError: showError,
  });
}

export const useAddComment = () => {
  return useCommentMutation<{ itemId: string; body: string }, Comment>(boardApi.addComment);
};
export const useUpdateComment = () => {
  return useCommentMutation<{ itemId: string; id: string; body: string }, Comment>(
    boardApi.updateComment,
  );
};
export const useDeleteComment = () => {
  return useCommentMutation<{ itemId: string; id: string }, null>(boardApi.deleteComment);
};

/**
 * Whether a card being dragged is over this column (or swimlane cell): over its empty space or over
 * one of its cards, which are drop targets of their own. Dragging a column header doesn't count.
 */
export function useCardOver(containerId: string) {
  const { active, over } = useDndContext();
  if (!active || !over || active.data.current?.type === 'column') {
    return false;
  }
  return over.id === containerId || over.data.current?.sortable?.containerId === containerId;
}

/** The types a tracker item can change to, read when its details open; native items can take any. */
export const useAllowedTypes = (item: WorkItem, enabled: boolean) => {
  return useQuery({
    queryKey: [...queryKeys.workItems, item.id, 'types'],
    queryFn: () => {
      return boardApi.getAllowedTypes(item.id);
    },
    enabled: enabled && item.source !== NATIVE_SOURCE,
    staleTime: 60_000,
  });
};

// an item's moves change with its status, so they're kept briefly
const MOVES_STALE_MS = 30_000;
const movesKey = (item: WorkItem) => {
  return [...queryKeys.workItems, item.id, 'moves', item.status_id ?? item.column_id] as const;
};

/** Reads an item's moves ahead of a drag (on hover), so the hints are ready when it starts. */
export function usePrefetchMoves() {
  const queryClient = useQueryClient();
  return (item: WorkItem) => {
    if (!item.editable) {
      return;
    }
    void queryClient.prefetchQuery({
      queryKey: movesKey(item),
      queryFn: () => {
        return boardApi.getMoves(item.id);
      },
      staleTime: MOVES_STALE_MS,
    });
  };
}

/**
 * How each column receives the card being dragged: where it may land (named like Jira's "In Review →
 * In Progress") or that it can't. Hints show at once from the board's rules or stored workflow, and
 * follow the tracker's live answer as soon as it's read.
 */
export function useDropHints(
  board: Board | undefined,
  card: WorkItem | null | undefined,
  columns: Column[],
) {
  const live = useQuery({
    queryKey: card ? movesKey(card) : ['none'],
    queryFn: () => {
      return boardApi.getMoves(card?.id ?? '');
    },
    enabled: Boolean(board && card?.editable),
    staleTime: MOVES_STALE_MS,
  });
  const moves = board && card ? movesFrom(board, card, live.data) : null;
  return (
    column: Column,
  ): DropHint | undefined => {
    return (card ? dropHint(moves, card, column, columns) : undefined);
  };
}

/** An item's moves, read when asked (its "Move to" menu opening). */
export const useItemMoves = (item: WorkItem, enabled: boolean) => {
  return useQuery({
    queryKey: movesKey(item),
    queryFn: () => {
      return boardApi.getMoves(item.id);
    },
    enabled: enabled && item.editable,
    staleTime: MOVES_STALE_MS,
  });
};

/** Saving a native board's columns and workflow: the board and its cards refetch (cards may have moved column). */
export function useSetNativeColumns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: boardApi.setNativeColumns,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.boards });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workItems });
      toast.success('Columns and workflow saved.');
    },
    onError: showError,
  });
}
