import { api } from '@/shared/api/client';
import type { ConnectedRepo, GraphView, ViewOptions, ViewQuery } from './types';

export const getConnectedRepos = () => api.get<ConnectedRepo[]>('/github/repos/connected');

// a POST because the body carries the open containers; it reads and changes nothing
export const getGraphView = (repoFullName: string, query: ViewQuery) =>
  api.post<GraphView>('/graph/view', query, { params: { repo_full_name: repoFullName } });

export const getViewOptions = () => api.get<ViewOptions>('/graph/view/options');
