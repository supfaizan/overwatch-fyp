import { api } from '@/shared/api/client';
import type { Workspace } from './types';

export const getWorkspaces = () => api.get<Workspace[]>('/workspaces');
export const createWorkspace = (name: string) => api.post<Workspace>('/workspaces', { name });
