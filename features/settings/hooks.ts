'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import { workspaceKeys } from '@/shared/workspaces/hooks';
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

const workspaceKey = (id: string, part: 'members' | 'invites') => [...workspaceKeys.all, id, part] as const;

export const useMembers = (id: string) => useQuery({ queryKey: workspaceKey(id, 'members'), queryFn: () => settingsApi.getMembers(id) });
export const useInvites = (id: string, enabled: boolean) =>
  useQuery({ queryKey: workspaceKey(id, 'invites'), queryFn: () => settingsApi.getInvites(id), enabled });

/** A workspace change: refreshes the workspace list and its members and invites. */
function useWorkspaceMutation<TArg, TResult>(mutationFn: (arg: TArg) => Promise<TResult>, success?: (result: TResult, arg: TArg) => string) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: (result, arg) => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      if (success) toast.success(success(result, arg));
    },
    onError: showError,
  });
}

export const useRenameWorkspace = () => useWorkspaceMutation(settingsApi.renameWorkspace, (workspace) => `Renamed to ${workspace.name}.`);
export const useDeleteWorkspace = () => useWorkspaceMutation(settingsApi.deleteWorkspace);
export const useUpdateMember = () => useWorkspaceMutation(settingsApi.updateMember, () => 'Role updated.');
export const useRemoveMember = () => useWorkspaceMutation(settingsApi.removeMember);
export const useCreateInvite = () => useWorkspaceMutation(settingsApi.createInvite);
export const useRevokeInvite = () => useWorkspaceMutation(settingsApi.revokeInvite, () => 'Invite revoked.');
