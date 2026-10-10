'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import * as reposApi from './api';
import { isRunning } from './lib';
import type { ConnectedRepo } from './types';

export const repoKeys = {
  connected: ['github', 'repos', 'connected'] as const,
  available: ['github', 'repos'] as const,
  installations: ['github', 'installations'] as const,
};

const POLL_MS = 4_000;

/** The user's connected repos; polls while any is indexing. */
export function useConnectedRepos() {
  return useQuery({
    queryKey: repoKeys.connected,
    queryFn: reposApi.getConnectedRepos,
    refetchInterval: ({ state }) => (state.data?.some(isRunning) ? POLL_MS : false),
  });
}

// both change on GitHub, often in another tab, so they refresh when the user comes back
export function useInstallations(enabled = true) {
  return useQuery({ queryKey: repoKeys.installations, queryFn: reposApi.getInstallations, enabled, refetchOnWindowFocus: true });
}

export function useAvailableRepos(enabled = true) {
  return useQuery({ queryKey: repoKeys.available, queryFn: reposApi.getAvailableRepos, enabled, staleTime: 60_000, refetchOnWindowFocus: true });
}

export function useConnectRepo(onConnected: (repo: ConnectedRepo) => void) {
  const queryClient = useQueryClient();
  return useMutation<ConnectedRepo, ApiError, string>({
    mutationFn: reposApi.connectRepo,
    onSuccess: (repo) => {
      // in the cache before navigating, or the dashboard wouldn't know the repo yet and open another one
      queryClient.setQueryData<ConnectedRepo[]>(repoKeys.connected, (repos) =>
        repos && !repos.some((known) => known.repo_full_name === repo.repo_full_name) ? [...repos, repo] : repos,
      );
      void queryClient.invalidateQueries({ queryKey: ['github'] });
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      toast.success(`Connected ${repo.repo_full_name}. Indexing has started.`);
      onConnected(repo);
    },
    onError: (error) => toast.error(error.message),
  });
}
