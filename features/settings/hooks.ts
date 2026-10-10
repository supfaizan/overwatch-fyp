'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import * as settingsApi from './api';

// same key as onboarding, so a change here refreshes it too
const keys = {
  status: ['onboarding', 'status'] as const,
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
