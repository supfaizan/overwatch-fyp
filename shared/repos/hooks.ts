'use client';

import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { JOB_POLL_MS } from '@/shared/lib/job-status';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as reposApi from './api';
import { isRunning } from './lib';
import type { ConnectedRepo } from './types';

export const repoKeys = {
  connected: [...queryKeys.github, 'repos', 'connected'] as const,
  available: [...queryKeys.github, 'repos'] as const,
  installations: [...queryKeys.github, 'installations'] as const,
};

/** The user's connected repos; polls while any is indexing. */
export function useConnectedRepos() {
  return useQuery({
    queryKey: repoKeys.connected,
    queryFn: reposApi.getConnectedRepos,
    refetchInterval: ({ state }) => {
      return (state.data?.some(isRunning) ? JOB_POLL_MS : false);
    },
  });
}

// both change on GitHub, often in another tab, so they refresh when the user comes back
export function useInstallations(enabled = true) {
  return useQuery({
    queryKey: repoKeys.installations,
    queryFn: reposApi.getInstallations,
    enabled,
    refetchOnWindowFocus: true,
  });
}

export function useAvailableRepos(enabled = true) {
  return useQuery({
    queryKey: repoKeys.available,
    queryFn: reposApi.getAvailableRepos,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useConnectRepo(onConnected: (repo: ConnectedRepo) => void) {
  const queryClient = useQueryClient();
  return useMutation<ConnectedRepo, ApiError, string>({
    mutationFn: reposApi.connectRepo,
    onSuccess: (repo) => {
      // in the cache before navigating, or the dashboard wouldn't know the repo yet and open another one
      queryClient.setQueryData<ConnectedRepo[]>(
        repoKeys.connected,
        (repos) => {
          return repos && !repos.some((known) => {
              return known.repo_full_name === repo.repo_full_name;
            })
            ? [...repos, repo]
            : repos;
        },
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.github });
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus });
      toast.success(`Connected ${repo.repo_full_name}. Indexing has started.`);
      onConnected(repo);
    },
    onError: (error) => {
      return toast.error(error.message);
    },
  });
}
