import { api } from '@/shared/api/client';
import { displayName } from '@/shared/session/lib';
import {
  type AllowedMoves,
  type Board,
  BOARD_KIND,
  type Column,
  type ColumnColor,
  type Comment,
  type CreateWorkItem,
  type MoveWorkItem,
  type Person,
  type Sprint,
  type SprintFields,
  type SyncTarget,
  type Tracker,
  type WorkItem,
  type WorkItemChanges,
} from './types';

/** Cards a column shows first, then how many more load each time it's scrolled to the bottom. */
const FIRST_BATCH = 7;
const NEXT_BATCH = 5;

/** Where the nth batch (1-based) of a column starts, and its size. */
const batch = (
  n: number,
) => {
  return (n === 1
    ? { offset: 0, size: FIRST_BATCH }
    : { offset: FIRST_BATCH + (n - 2) * NEXT_BATCH, size: NEXT_BATCH });
};
/** A kanban board's Done column shows what got done this recently, as Jira's does. */
const DONE_WITHIN_DAYS = 14;
const BACKLOG_LIMIT = 500;

export const getBoards = () => {
  return api.get<Board[]>('/boards');
};

/** One item on a board by its key (a linked ticket that isn't loaded); `q` matches substrings, so the exact key is picked here. */
export const getWorkItemByKey = async (boardId: string, key: string) => {
  const items = await api.get<WorkItem[]>('/work-items', {
    params: { board_id: boardId, q: key, page_size: 100 },
  });
  return items.find((item) => {
    return item.key === key;
  }) ?? null;
};

/**
 * One batch (1-based) of a board column, top first. A scrum board shows one sprint (`current` by default);
 * a kanban board shows only recent done work.
 */
/** A run of cards and how many match in all, loaded or not. */
export type ItemPage = { items: WorkItem[]; total: number };

export const getColumnPage = async (
  board: Board,
  column: Column,
  sprint: string,
  page: number,
  lane?: LaneFilter,
) => {
  const { data, meta } = await api.getWithMeta<WorkItem[]>('/work-items', {
    params: {
      board_id: board.id,
      column_id: column.id,
      offset: batch(page).offset,
      page_size: batch(page).size,
      ...viewParams(board, sprint),
      ...(lane && { [lane.by === 'assignee' ? 'assignee_id' : 'priority']: lane.key }),
    },
  });
  return { items: data, total: typeof meta.total === 'number' ? meta.total : data.length };
};

/** What a board view shows: one sprint on a scrum board, recent done work on a kanban one; no epics. */
const viewParams = (board: Board, sprint: string) => {
  return {
    hide_epics: true,
    ...(board.kind === BOARD_KIND.scrum ? { sprint } : { done_within_days: DONE_WITHIN_DAYS }),
  };
};

/** One swimlane: an assignee id or priority name, or "none". */
export type LaneFilter = { by: 'assignee' | 'priority'; key: string };

export const getLanes = (board: Board, by: LaneFilter['by'], sprint: string) => {
  return api.get<{ key: string; label: string | null; total: number }[]>('/work-items/lanes', {
    params: { board_id: board.id, by, ...viewParams(board, sprint) },
  });
};

/** One section of the backlog view: an open sprint's items, or (null) the backlog's unfinished ones; at most `BACKLOG_LIMIT`. */
export const getPlanned = async (boardId: string, sprintId: string | null) => {
  const { data, meta } = await api.getWithMeta<WorkItem[]>('/work-items', {
    params: {
      board_id: boardId,
      sprint: sprintId ?? 'backlog',
      page_size: BACKLOG_LIMIT,
      hide_epics: true,
      ...(sprintId ? {} : { open_only: true }),
    },
  });
  return { items: data, total: typeof meta.total === 'number' ? meta.total : data.length };
};

export const getSprints = (boardId: string) => {
  return api.get<Sprint[]>(`/boards/${boardId}/sprints`);
};
export const createSprint = ({ boardId, ...body }: SprintFields & { boardId: string }) => {
  return api.post<Sprint>(`/boards/${boardId}/sprints`, body);
};
export const startSprint = (id: string) => {
  return api.post<Sprint>(`/sprints/${id}/start`, {});
};
export const completeSprint = ({ id, moveOpenTo }: { id: string; moveOpenTo: string | null }) => {
  return api.post<Sprint>(`/sprints/${id}/complete`, { move_open_to: moveOpenTo });
};
export const setItemSprint = (
  { id, ...body }: {
    id: string;
    sprint_id: string | null;
    before_id: string | null;
    after_id: string | null;
  },
) => {
  return api.post<WorkItem>(`/work-items/${id}/sprint`, body);
};

export const updateColumnSettings = (
  { boardId, ...body }: {
    boardId: string;
    column_order?: string[];
    column_colors?: Record<string, ColumnColor | null>;
  },
) => {
  return api.patch<Board>(`/boards/${boardId}/columns/settings`, body);
};

export const adoptTrackerColumns = (boardId: string) => {
  return api.post<Board>(`/boards/${boardId}/columns/tracker`);
};
export const keepDefaultColumns = (boardId: string) => {
  return api.post<Board>(`/boards/${boardId}/columns/default`);
};
export const createWorkItem = (body: CreateWorkItem) => {
  return api.post<WorkItem>('/work-items', body);
};
export const updateWorkItem = ({ id, ...body }: WorkItemChanges & { id: string }) => {
  return api.patch<WorkItem>(`/work-items/${id}`, body);
};

export const getPriorities = (boardId: string) => {
  return api.get<string[]>(`/boards/${boardId}/priorities`);
};

export const getComments = (itemId: string) => {
  return api.get<Comment[]>(`/work-items/${itemId}/comments`);
};
export const addComment = ({ itemId, body }: { itemId: string; body: string }) => {
  return api.post<Comment>(`/work-items/${itemId}/comments`, { body });
};
export const updateComment = (
  { itemId, id, body }: { itemId: string; id: string; body: string },
) => {
  return api.patch<Comment>(`/work-items/${itemId}/comments/${id}`, { body });
};
export const deleteComment = ({ itemId, id }: { itemId: string; id: string }) => {
  return api.delete<null>(`/work-items/${itemId}/comments/${id}`);
};
export const moveWorkItem = ({ id, ...body }: MoveWorkItem & { id: string }) => {
  return api.post<WorkItem>(`/work-items/${id}/move`, body);
};
export const deleteWorkItem = (id: string) => {
  return api.delete<null>(`/work-items/${id}`);
};

export const getTrackers = () => {
  return api.get<Tracker[]>('/connections');
};
/** Brings a tracker board up to date; `force` skips the "synced moments ago" check (the refresh button). */
export const syncBoard = ({ boardId, force }: { boardId: string; force: boolean }) => {
  return api.post<SyncTarget>(`/boards/${boardId}/sync`, undefined, { params: { force } });
};

export const getTrackerAssignees = (provider: string, targetKey: string) => {
  return api.get<Person[]>(`/connections/${provider}/targets/${targetKey}/assignees`);
};

export const getMembers = async (workspaceId: string): Promise<Person[]> => {
  const members = await api.get<
    {
      user_id: string;
      username: string | null;
      github_login: string | null;
      name: string | null;
      avatar_url: string | null;
    }[]
  >(
    `/workspaces/${workspaceId}/members`,
  );
  return members.map((m) => {
    return { id: m.user_id, name: displayName(m), avatar_url: m.avatar_url };
  });
};

/** The types an item can be changed to; null when any (a tracker item only to those its tracker allows in place). */
export const getAllowedTypes = (itemId: string) => {
  return api.get<{ type_ids: string[] | null }>(`/work-items/${itemId}/types`);
};
/** Where an item can move from where it is; on a tracker board, Jira's answer for it now. */
export const getMoves = (itemId: string) => {
  return api.get<AllowedMoves>(`/work-items/${itemId}/moves`);
};
/** A native board's columns and workflow, all at once; `reassign` says where removed columns' items go. */
export const setNativeColumns = ({ boardId, ...body }: {
  boardId: string;
  columns: {
    id: string;
    name: string;
    status_category: string;
    color: string | null;
    next: string[] | null;
  }[];
  reassign: Record<string, string>;
}) => {
  return api.request<Board>({ method: 'PUT', url: `/boards/${boardId}/columns`, data: body });
};
