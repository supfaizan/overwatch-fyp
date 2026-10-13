'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import * as boardApi from './api';
import { arrange, cellId, mergePages } from './lib';
import type { ItemPage } from './api';
import type { Board, Column, ColumnColor, Comment, MoveWorkItem, Sprint, SprintFields, WorkItem, WorkItemChanges } from './types';

const root = ['board'] as const;
const keys = {
  boards: [...root, 'boards'] as const,
  // under the shared root, so anything invalidating work items refreshes every board's
  items: (boardId: string) => [...queryKeys.workItems, boardId] as const,
  planned: (boardId: string, sprintId: string | null) => [...queryKeys.workItems, boardId, 'planned', sprintId ?? 'backlog'] as const,
  sprints: (boardId: string) => [...root, 'sprints', boardId] as const,
  priorities: (boardId: string) => [...root, 'priorities', boardId] as const,
  comments: (itemId: string) => [...root, 'comments', itemId] as const,
  assignees: (provider: string, targetKey: string | null) => [...queryKeys.connections, provider, targetKey, 'assignees'] as const,
  members: (workspaceId: string) => [...root, 'members', workspaceId] as const,
};

const showError = (error: ApiError) => toast.error(error.message);

export const useBoards = () => useQuery({ queryKey: keys.boards, queryFn: boardApi.getBoards });

/** One column's (or swimlane cell's) loaded cards: how many there are in all, and whether more are coming. */
type PagedState = { total: number; hasMore: boolean; loadingMore: boolean };

/**
 * Pages loaded per column (or cell), starting again from one page whenever `scope` changes; `more` asks
 * for the next page from the latest counts, so loading several at once keeps every one.
 */
function usePageCounts(scope: string) {
  const [pages, setPages] = useState<{ scope: string; counts: Record<string, number> }>({ scope, counts: {} });
  const counts = pages.scope === scope ? pages.counts : {};
  const more = (id: string) =>
    setPages((previous) => {
      const latest = previous.scope === scope ? previous.counts : {};
      return { scope, counts: { ...latest, [id]: (latest[id] ?? 1) + 1 } };
    });
  return { counts, more };
}

/**
 * The loaded cards of a board's columns, a page at a time per column: each page is its own query,
 * so the board still sees every loaded card in one place (for drops and swimlanes), and scrolling a
 * column only asks for its next page.
 */
export function useBoardItems(board: Board | undefined, columns: Column[], sprint: string) {
  // a different board, kind or sprint starts again from the first page
  const { counts, more } = usePageCounts(`${board?.id}|${board?.kind}|${sprint}`);
  const requests = board ? columns.flatMap((column) => Array.from({ length: counts[column.id] ?? 1 }, (_, index) => ({ column, page: index + 1 }))) : [];
  const results = useQueries({
    queries: requests.map(({ column, page }) => ({
      queryKey: [...keys.items(board?.id ?? ''), board?.kind, sprint, column.id, page],
      queryFn: () => boardApi.getColumnPage(board as Board, column, sprint, page),
    })),
  });

  const perColumn: Record<string, PagedState> = {};
  for (const column of columns) {
    const own = results.filter((_, index) => requests[index].column.id === column.id);
    const loaded = own.reduce((sum, result) => sum + (result.data?.items.length ?? 0), 0);
    const total = own[0]?.data?.total ?? 0;
    perColumn[column.id] = { total, hasMore: loaded < total, loadingMore: own.length > 1 && Boolean(own.at(-1)?.isPending) };
  }
  const firstPages = results.filter((_, index) => requests[index].page === 1);

  return {
    items: mergePages(results.map((result) => result.data?.items ?? [])),
    columns: perColumn,
    isPending: !board || firstPages.some((result) => result.isPending),
    error: results.find((result) => result.isError)?.error ?? null,
    refetch: () => results.forEach((result) => void result.refetch()),
    loadMore: (columnId: string) => {
      if (perColumn[columnId]?.hasMore && !perColumn[columnId].loadingMore) more(columnId);
    },
  };
}

export const useSprints = (boardId: string | undefined) =>
  useQuery({ queryKey: keys.sprints(boardId ?? ''), queryFn: () => boardApi.getSprints(boardId ?? ''), enabled: Boolean(boardId) });

/** The backlog view's sections: each open sprint's items, then the backlog's (null). */
export const usePlanned = (boardId: string, sprintIds: (string | null)[]) =>
  useQueries({
    queries: sprintIds.map((sprintId) => ({ queryKey: keys.planned(boardId, sprintId), queryFn: () => boardApi.getPlanned(boardId, sprintId) })),
  });

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

export const useCreateSprint = () => useSprintMutation((body: SprintFields & { boardId: string }) => boardApi.createSprint(body), 'Sprint created.');
export const useStartSprint = () => useSprintMutation(boardApi.startSprint, 'Sprint started.');
export const useCompleteSprint = () => useSprintMutation(boardApi.completeSprint, 'Sprint completed.');

type SprintMove = { boardId: string; item: WorkItem; to: string | null; before_id: string | null; after_id: string | null; rank: number };

/** Moves a card between sprints and the backlog right away, and puts it back if the server, or the tracker, refuses. */
export function useSetItemSprint() {
  const queryClient = useQueryClient();
  return useMutation<WorkItem, ApiError, SprintMove, { snapshots: [readonly unknown[], ItemPage | undefined][] }>({
    mutationFn: ({ item, to, before_id, after_id }) => boardApi.setItemSprint({ id: item.id, sprint_id: to, before_id, after_id }),
    onMutate: async ({ boardId, item, to, rank }) => {
      const from = keys.planned(boardId, item.sprint_id);
      const into = keys.planned(boardId, to);
      await Promise.all([queryClient.cancelQueries({ queryKey: from }), queryClient.cancelQueries({ queryKey: into })]);
      const snapshots: [readonly unknown[], ItemPage | undefined][] = [
        [from, queryClient.getQueryData<ItemPage>(from)],
        [into, queryClient.getQueryData<ItemPage>(into)],
      ];
      const moved = { ...item, sprint_id: to, rank };
      const without = (page: ItemPage) => page.items.filter((candidate) => candidate.id !== item.id);
      queryClient.setQueryData<ItemPage>(from, (page) => page && { items: without(page), total: page.total - 1 });
      queryClient.setQueryData<ItemPage>(into, (page) => page && { items: [...without(page), moved], total: page.total + 1 });
      return { snapshots };
    },
    onError: (error, _, context) => {
      for (const [key, data] of context?.snapshots ?? []) queryClient.setQueryData(key, data);
      showError(error);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.workItems }),
  });
}

type ColumnSettings = { boardId: string; column_order?: string[]; column_colors?: Record<string, ColumnColor | null> };

/**
 * A board grouped into swimlanes: its lanes, then each lane's cards per column, a batch at a time per
 * cell, so every person's (or priority's) column starts with its own first batch and scrolls for more.
 */
export function useSwimlaneItems(board: Board | undefined, columns: Column[], by: 'assignee' | 'priority' | null, sprint: string) {
  const enabled = Boolean(board && by && columns.length);
  const lanes = useQuery({
    queryKey: [...keys.items(board?.id ?? ''), board?.kind, sprint, 'lanes', by],
    queryFn: () => boardApi.getLanes(board as Board, by ?? 'assignee', sprint),
    enabled,
  });
  const { counts, more } = usePageCounts(`${board?.id}|${board?.kind}|${sprint}|${by}`);
  const requests = enabled
    ? (lanes.data ?? []).flatMap((lane) =>
        columns.flatMap((column) => {
          const cell = cellId(lane.key, column.id);
          return Array.from({ length: counts[cell] ?? 1 }, (_, index) => ({ cell, lane: lane.key, column, page: index + 1 }));
        }),
      )
    : [];
  const results = useQueries({
    queries: requests.map(({ lane, column, page }) => ({
      queryKey: [...keys.items(board?.id ?? ''), board?.kind, sprint, 'lane', by, lane, column.id, page],
      queryFn: () => boardApi.getColumnPage(board as Board, column, sprint, page, { by: by ?? 'assignee', key: lane }),
    })),
  });

  // each cell's first page carries its total; its last page, if past the first, is the one loading
  const loaded: Record<string, number> = {};
  const cells: Record<string, PagedState> = {};
  requests.forEach(({ cell, page }, index) => {
    const result = results[index];
    loaded[cell] = (loaded[cell] ?? 0) + (result.data?.items.length ?? 0);
    if (page === 1) cells[cell] = { total: result.data?.total ?? 0, hasMore: false, loadingMore: false };
    else if (page === counts[cell]) cells[cell].loadingMore = result.isPending;
  });
  for (const [cell, state] of Object.entries(cells)) state.hasMore = loaded[cell] < state.total;

  return {
    lanes: lanes.data ?? [],
    items: mergePages(results.map((result) => result.data?.items ?? [])),
    cells,
    isPending: enabled && (lanes.isPending || results.some((result, index) => requests[index].page === 1 && result.isPending)),
    error: lanes.error ?? results.find((result) => result.isError)?.error ?? null,
    refetch: () => {
      void lanes.refetch();
      results.forEach((result) => void result.refetch());
    },
    loadMore: (cell: string) => {
      if (cells[cell]?.hasMore && !cells[cell].loadingMore) more(cell);
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
      queryClient.setQueryData<Board[]>(keys.boards, (boards) =>
        boards?.map((board) => (board.id === boardId ? arrange(board, column_order, column_colors) : board)),
      );
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) queryClient.setQueryData(keys.boards, context.previous);
      showError(error);
    },
    onSuccess: (board) => queryClient.setQueryData<Board[]>(keys.boards, (boards) => boards?.map((b) => (b.id === board.id ? board : b))),
  });
}

/** Use the tracker's columns, or keep (go back to) the default three. */
export function useColumnChoice() {
  const queryClient = useQueryClient();
  return useMutation<Board, ApiError, { boardId: string; tracker: boolean }>({
    mutationFn: ({ boardId, tracker }) => (tracker ? boardApi.adoptTrackerColumns(boardId) : boardApi.keepDefaultColumns(boardId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.boards });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workItems });
    },
    onError: showError,
  });
}

export const useTrackers = () => useQuery({ queryKey: queryKeys.connections, queryFn: boardApi.getTrackers });

/** Who an item can be assigned to: workspace members, or the tracker project's assignable users. */
export function usePeople(provider: string | null, targetKey: string | null) {
  const workspaceId = useCurrentWorkspace()?.id ?? '';
  return useQuery({
    queryKey: provider ? keys.assignees(provider, targetKey) : keys.members(workspaceId),
    queryFn: () => (provider && targetKey ? boardApi.getTrackerAssignees(provider, targetKey) : boardApi.getMembers(workspaceId)),
    enabled: provider ? Boolean(targetKey) : Boolean(workspaceId),
  });
}

function useItemMutation<TArg, TResult>(mutationFn: (arg: TArg) => Promise<TResult>, success?: string) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workItems });
      if (success) toast.success(success);
    },
    onError: showError,
  });
}

export const useCreateWorkItem = () => useItemMutation(boardApi.createWorkItem);
export const useUpdateWorkItem = () => useItemMutation(boardApi.updateWorkItem);
export const useDeleteWorkItem = () => useItemMutation(boardApi.deleteWorkItem, 'Item deleted.');

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

const mapCached = (data: CachedItems, change: (item: WorkItem) => WorkItem): CachedItems => data && { ...data, items: data.items.map(change) };

/** Moves a card right away (see `moveItem`) and puts it back if the server, or the tracker, refuses. */
export function useMoveWorkItem() {
  const queryClient = useQueryClient();
  return useMutation<WorkItem, ApiError, Move, { snapshots: [readonly unknown[], CachedItems][] }>({
    mutationFn: async ({ id, move, changes }) => {
      if (changes) await boardApi.updateWorkItem({ id, ...changes });
      return boardApi.moveWorkItem({ id, ...move });
    },
    onMutate: async ({ boardId, id, move, rank, patch }) => {
      await queryClient.cancelQueries({ queryKey: keys.items(boardId) });
      const snapshots = queryClient.getQueriesData<CachedItems>({ queryKey: keys.items(boardId) });
      queryClient.setQueriesData<CachedItems>({ queryKey: keys.items(boardId) }, (data) =>
        mapCached(data, (item) => (item.id === id ? { ...item, ...patch, column_id: move.column_id, rank } : item)),
      );
      return { snapshots };
    },
    onError: (error, { changes }, context) => {
      // a reassignment may have saved before the move failed, so the refetch (onSettled) shows what stuck
      if (!changes) for (const [key, data] of context?.snapshots ?? []) queryClient.setQueryData(key, data);
      showError(error);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.workItems }),
  });
}

export const usePriorities = (boardId: string, enabled = true) =>
  useQuery({ queryKey: keys.priorities(boardId), queryFn: () => boardApi.getPriorities(boardId), staleTime: 5 * 60_000, enabled: enabled && Boolean(boardId) });

export const useComments = (itemId: string) => useQuery({ queryKey: keys.comments(itemId), queryFn: () => boardApi.getComments(itemId) });

function useCommentMutation<TArg extends { itemId: string }, TResult>(mutationFn: (arg: TArg) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: (_, { itemId }) => void queryClient.invalidateQueries({ queryKey: keys.comments(itemId) }),
    onError: showError,
  });
}

export const useAddComment = () => useCommentMutation<{ itemId: string; body: string }, Comment>(boardApi.addComment);
export const useUpdateComment = () => useCommentMutation<{ itemId: string; id: string; body: string }, Comment>(boardApi.updateComment);
export const useDeleteComment = () => useCommentMutation<{ itemId: string; id: string }, null>(boardApi.deleteComment);
