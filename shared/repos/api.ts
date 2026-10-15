import { api } from '@/shared/api/client';
import type { AvailableRepo, ConnectedRepo, Installations } from './types';

// the one place repo connections are read and made, so moving them under a workspace later is one file
export const getConnectedRepos = () => api.get<ConnectedRepo[]>('/github/repos/connected');
export const getAvailableRepos = () => api.get<AvailableRepo[]>('/github/repos');
export const getInstallations = () => api.get<Installations>('/github/installations');
export const connectRepo = (repoFullName: string) =>
  api.post<ConnectedRepo>('/github/repos/connect', { repo_full_name: repoFullName });

/** Where a "connect GitHub" round trip comes back to; the backend only redirects to these. */
export type GithubLinkReturn = 'onboarding' | 'settings';

/** Leave for GitHub to connect it to the signed-in account; it returns with `?github=linked|denied|in_use|error`. */
export async function linkGithub(returnTo: GithubLinkReturn): Promise<void> {
  const { authorization_url } = await api.post<{ authorization_url: string }>('/auth/github/link', {
    return_to: returnTo,
  });
  window.location.assign(authorization_url);
}
