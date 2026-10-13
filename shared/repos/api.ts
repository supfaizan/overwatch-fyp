import { api } from '@/shared/api/client';
import type { AvailableRepo, ConnectedRepo, Installations } from './types';

// the one place repo connections are read and made, so moving them under a workspace later is one file
export const getConnectedRepos = () => api.get<ConnectedRepo[]>('/github/repos/connected');
export const getAvailableRepos = () => api.get<AvailableRepo[]>('/github/repos');
export const getInstallations = () => api.get<Installations>('/github/installations');
export const connectRepo = (repoFullName: string) => api.post<ConnectedRepo>('/github/repos/connect', { repo_full_name: repoFullName });
