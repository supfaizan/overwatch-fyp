import { api } from '@/shared/api/client';
import type { Workspace } from './types';

export const getWorkspaces = () => {
  return api.get<Workspace[]>('/workspaces');
};
export const createWorkspace = (name: string) => {
  return api.post<Workspace>('/workspaces', { name });
};
