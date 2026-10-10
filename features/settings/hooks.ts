'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import * as settingsApi from './api';

// same keys as onboarding and the dashboard, so a change here refreshes them too
const keys = {
  status: ['onboarding', 'status'] as const,
  connectedRepos: ['github', 'repos', 'connected'] as const,
  installations: ['github', 'installations'] as const,
};

const POLL_MS = 3_000;
const isRunning = (status: string | undefined) => status === 'pending' || status === 'in_progress';
const showError = (error: ApiError) => toast.error(error.message);

export function useConnectionStatus() {
  return useQuery({
    queryKey: keys.status,
    queryFn: settingsApi.getConnectionStatus,
    refetchInterval: ({ state }) => (isRunning(state.data?.jira.project?.sync_status) ? POLL_MS : false),
  });
}

export function useConnectedRepos() {
  return useQuery({
    queryKey: keys.connectedRepos,
    queryFn: settingsApi.getConnectedRepos,
    refetchInterval: ({ state }) => (state.data?.some((repo) => isRunning(repo.parse_status)) ? POLL_MS : false),
  });
}

export function useInstallations() {
  return useQuery({ queryKey: keys.installations, queryFn: settingsApi.getInstallations });
}

function useSettingsMutation<TArg, TResult>(mutationFn: (arg: TArg) => Promise<TResult>, success: (arg: TArg) => string) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: (_, arg) => {
      for (const queryKey of [['onboarding'], ['github'], ['jira']]) void queryClient.invalidateQueries({ queryKey });
      toast.success(success(arg));
    },
    onError: showError,
  });
}

export const useReindexRepo = () => useSettingsMutation(settingsApi.reindexRepo, (repo) => `Re-indexing ${repo}.`);
export const useDisconnectRepo = () => useSettingsMutation(settingsApi.disconnectRepo, (repo) => `Disconnected ${repo}.`);
export const useDisconnectJira = () => useSettingsMutation(settingsApi.disconnectJira, () => 'Jira disconnected. Imported tickets are kept.');

export function useStartJiraAuthorization() {
  return useMutation<{ authorization_url: string }, ApiError>({
    mutationFn: settingsApi.startJiraAuthorization,
    onSuccess: ({ authorization_url }) => window.location.assign(authorization_url),
    onError: showError,
  });
}
