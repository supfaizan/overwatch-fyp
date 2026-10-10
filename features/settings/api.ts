import { api } from '@/shared/api/client';
import type { ConnectedRepo, ConnectionStatus, Installations } from './types';

export const getConnectionStatus = () => api.get<ConnectionStatus>('/onboarding/status');
export const getConnectedRepos = () => api.get<ConnectedRepo[]>('/github/repos/connected');
export const getInstallations = () => api.get<Installations>('/github/installations');

export const reindexRepo = (repoFullName: string) => api.post<ConnectedRepo>(`/github/repos/${repoFullName}/index`);
export const disconnectRepo = (repoFullName: string) => api.delete<null>(`/github/repos/${repoFullName}`);

export const startJiraAuthorization = () => api.post<{ authorization_url: string }>('/jira/login');
export const disconnectJira = () => api.delete<null>('/jira/connection');
