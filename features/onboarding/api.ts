import { api } from '@/shared/api/client';
import { PROVIDER } from '@/shared/connections/constants';
import type { ConnectedRepo } from '@/shared/repos/types';
import type { JiraProject, OnboardingStatus } from './types';

export const getStatus = () => api.get<OnboardingStatus>('/onboarding/status');

export const reindexRepo = (repoFullName: string) =>
  api.post<ConnectedRepo>(`/github/repos/${repoFullName}/index`);
export const disconnectRepo = (repoFullName: string) =>
  api.delete<null>(`/github/repos/${repoFullName}`);

export const startJiraAuthorization = () =>
  api.post<{ authorization_url: string }>(`/connections/${PROVIDER.jira}/authorize`, {
    return_to: 'onboarding',
  });
export const getJiraProjects = () =>
  api.get<JiraProject[]>(`/connections/${PROVIDER.jira}/targets/available`);
export const connectJiraProject = (project: JiraProject) =>
  api.post<{ key: string }>(`/connections/${PROVIDER.jira}/targets`, {
    key: project.key,
    name: project.name,
  });
export const disconnectJira = () => api.delete<null>(`/connections/${PROVIDER.jira}`);
