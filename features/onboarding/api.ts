import { api } from '@/shared/api/client';
import type { AvailableRepo, ConnectedRepo, Installations, JiraProject, OnboardingStatus } from './types';

export const getStatus = () => api.get<OnboardingStatus>('/onboarding/status');

export const getInstallations = () => api.get<Installations>('/github/installations');
export const getAvailableRepos = () => api.get<AvailableRepo[]>('/github/repos');
export const connectRepo = (repoFullName: string) => api.post<ConnectedRepo>('/github/repos/connect', { repo_full_name: repoFullName });
export const reindexRepo = (repoFullName: string) => api.post<ConnectedRepo>(`/github/repos/${repoFullName}/index`);
export const disconnectRepo = (repoFullName: string) => api.delete<null>(`/github/repos/${repoFullName}`);

export const startJiraAuthorization = () => api.post<{ authorization_url: string }>('/jira/login');
export const getJiraProjects = () => api.get<JiraProject[]>('/jira/projects');
export const connectJiraProject = (projectKey: string) => api.post<{ project_key: string }>('/jira/projects/connect', { project_key: projectKey });
export const disconnectJira = () => api.delete<null>('/jira/connection');
