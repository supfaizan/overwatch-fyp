import { api } from '@/shared/api/client';
import type { GraphView, ViewOptions, ViewQuery } from './types';

// a POST because the body carries the open containers; it reads and changes nothing
export const getGraphView = (repoFullName: string, query: ViewQuery) => {
  return api.post<GraphView>('/graph/view', query, { params: { repo_full_name: repoFullName } });
};

export const getViewOptions = () => {
  return api.get<ViewOptions>('/graph/view/options');
};
