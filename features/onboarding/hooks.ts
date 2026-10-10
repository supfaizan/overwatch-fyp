'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import * as onboardingApi from './api';
import { isRunning } from './steps';

const keys = {
  status: ['onboarding', 'status'] as const,
  jiraProjects: ['jira', 'projects'] as const,
};

const POLL_MS = 3_000;
const showError = (error: ApiError) => toast.error(error.message);

export function useOnboardingStatus() {
  return useQuery({
    queryKey: keys.status,
    queryFn: onboardingApi.getStatus,
    // poll only while something is indexing or syncing in the background
    refetchInterval: ({ state }) =>
      state.data && (state.data.github.repos.some(isRunning) || isRunning(state.data.jira.project)) ? POLL_MS : false,
  });
}

export function useJiraProjects(enabled: boolean) {
  return useQuery({ queryKey: keys.jiraProjects, queryFn: onboardingApi.getJiraProjects, enabled });
}

/** A mutation that refreshes onboarding state when it succeeds. */
function useOnboardingMutation<TArg, TResult>(mutationFn: (arg: TArg) => Promise<TResult>, onSuccess?: (result: TResult, arg: TArg) => void) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: (result, arg) => {
      void queryClient.invalidateQueries({ queryKey: keys.status });
      void queryClient.invalidateQueries({ queryKey: ['github'] });
      void queryClient.invalidateQueries({ queryKey: ['jira'] });
      onSuccess?.(result, arg);
    },
    onError: showError,
  });
}

export const useReindexRepo = () => useOnboardingMutation(onboardingApi.reindexRepo);

export const useDisconnectRepo = () =>
  useOnboardingMutation(onboardingApi.disconnectRepo, (_, repoFullName) => toast.success(`Disconnected ${repoFullName}.`));

export const useConnectJiraProject = (onConnected: () => void) =>
  useOnboardingMutation(onboardingApi.connectJiraProject, (project) => {
    toast.success(`Connected ${project.project_key}. Tickets are syncing.`);
    onConnected();
  });

export const useDisconnectJira = () =>
  useOnboardingMutation(onboardingApi.disconnectJira, () => toast.success('Jira disconnected. Imported tickets are kept.'));

export function useStartJiraAuthorization() {
  return useMutation<{ authorization_url: string }, ApiError>({
    mutationFn: onboardingApi.startJiraAuthorization,
    onSuccess: ({ authorization_url }) => window.location.assign(authorization_url),
    onError: showError,
  });
}
