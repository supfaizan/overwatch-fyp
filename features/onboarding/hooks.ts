'use client';

import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { PROVIDER } from '@/shared/connections/constants';
import { JOB_POLL_MS } from '@/shared/lib/job-status';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as onboardingApi from './api';
import { isRunning } from './steps';

const keys = {
  jiraProjects: [...queryKeys.connections, PROVIDER.jira, 'projects'] as const,
};
const showError = (error: ApiError) => {
  return toast.error(error.message);
};

export function useOnboardingStatus() {
  return useQuery({
    queryKey: queryKeys.onboardingStatus,
    queryFn: onboardingApi.getStatus,
    // poll only while something is indexing or syncing in the background
    refetchInterval: ({ state }) => {
      return state.data
          && (state.data.github.repos.some(isRunning) || isRunning(state.data.jira.project))
        ? JOB_POLL_MS
        : false;
    },
  });
}

export function useJiraProjects(enabled: boolean) {
  return useQuery({ queryKey: keys.jiraProjects, queryFn: onboardingApi.getJiraProjects, enabled });
}

/** A mutation that refreshes onboarding state when it succeeds. */
function useOnboardingMutation<TArg, TResult>(
  mutationFn: (arg: TArg) => Promise<TResult>,
  onSuccess?: (result: TResult, arg: TArg) => void,
) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: (result, arg) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus });
      void queryClient.invalidateQueries({ queryKey: queryKeys.github });
      void queryClient.invalidateQueries({ queryKey: queryKeys.connections });
      onSuccess?.(result, arg);
    },
    onError: showError,
  });
}

export const useReindexRepo = () => {
  return useOnboardingMutation(onboardingApi.reindexRepo);
};

export const useDisconnectRepo = () => {
  return useOnboardingMutation(
    onboardingApi.disconnectRepo,
    (_, repoFullName) => {
      return toast.success(`Disconnected ${repoFullName}.`);
    },
  );
};

export const useConnectJiraProject = (onConnected: () => void) => {
  return useOnboardingMutation(onboardingApi.connectJiraProject, (project) => {
    toast.success(`Connected ${project.key}. Tickets are syncing.`);
    onConnected();
  });
};

export const useDisconnectJira = () => {
  return useOnboardingMutation(
    onboardingApi.disconnectJira,
    () => {
      return toast.success('Jira disconnected. Imported tickets are kept.');
    },
  );
};

export function useStartJiraAuthorization() {
  return useMutation<{ authorization_url: string }, ApiError>({
    mutationFn: onboardingApi.startJiraAuthorization,
    onSuccess: ({ authorization_url }) => {
      return window.location.assign(authorization_url);
    },
    onError: showError,
  });
}
