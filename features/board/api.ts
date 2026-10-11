import { api } from '@/shared/api/client';
import { COLUMNS } from './lib';
import type { CreateWorkItem, MoveWorkItem, Person, Tracker, WorkItem, WorkItemFields } from './types';

/** Each column shows at most this many items, its latest. */
export const COLUMN_LIMIT = 500;

/** The latest items of every column, fetched per column so a long one can't crowd out the others. */
export const getWorkItems = async () => {
  const columns = await Promise.all(
    COLUMNS.map(({ id }) =>
      api.get<WorkItem[]>('/work-items', { params: { status_category: id, newest_first: true, page_size: COLUMN_LIMIT } }),
    ),
  );
  return columns.flat();
};
export const createWorkItem = (body: CreateWorkItem) => api.post<WorkItem>('/work-items', body);
export const updateWorkItem = ({ id, ...body }: Partial<WorkItemFields> & { id: string }) => api.patch<WorkItem>(`/work-items/${id}`, body);
export const moveWorkItem = ({ id, ...body }: MoveWorkItem & { id: string }) => api.post<WorkItem>(`/work-items/${id}/move`, body);
export const deleteWorkItem = (id: string) => api.delete<null>(`/work-items/${id}`);

export const getTrackers = () => api.get<Tracker[]>('/connections');

export const getTrackerAssignees = (provider: string, targetKey: string) =>
  api.get<Person[]>(`/connections/${provider}/targets/${targetKey}/assignees`);

export const getMembers = async (workspaceId: string): Promise<Person[]> => {
  const members = await api.get<{ user_id: string; github_login: string; name: string | null; avatar_url: string | null }[]>(
    `/workspaces/${workspaceId}/members`,
  );
  return members.map((m) => ({ id: m.user_id, name: m.name ?? m.github_login, avatar_url: m.avatar_url }));
};
