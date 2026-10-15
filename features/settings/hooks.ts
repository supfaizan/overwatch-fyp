'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { isRunning, JOB_POLL_MS } from '@/shared/lib/job-status';
import * as settingsApi from './api';

const keys = {
  available: (provider: string) => [...queryKeys.connections, provider, 'available'] as const,
  workspace: (id: string, part: 'members' | 'invites') => [...queryKeys.workspaces, id, part] as const,
};
const showError = (error: ApiError) => toast.error(error.message);

export const useConnectionStatus = () => useQuery({ queryKey: queryKeys.onboardingStatus, queryFn: settingsApi.getConnectionStatus });

export function useConnections() {
  return useQuery({
    queryKey: queryKeys.connections,
    queryFn: settingsApi.getConnections,
    refetchInterval: ({ state }) =>
      state.data?.some((c) => c.targets.some((t) => isRunning(t.sync_status))) ? JOB_POLL_MS : false,
  });
}

function useSettingsMutation<TArg, TResult>(mutationFn: (arg: TArg) => Promise<TResult>, success: (arg: TArg) => string) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: (_, arg) => {
      for (const queryKey of [queryKeys.onboardingStatus, queryKeys.github, queryKeys.connections, queryKeys.workItems]) void queryClient.invalidateQueries({ queryKey });
      toast.success(success(arg));
    },
    onError: showError,
  });
}

export const useReindexRepo = () => useSettingsMutation(settingsApi.reindexRepo, (repo) => `Re-indexing ${repo}.`);
export const useDisconnectRepo = () => useSettingsMutation(settingsApi.disconnectRepo, (repo) => `Disconnected ${repo}.`);
export const useAvailableTargets = (provider: string) =>
  useQuery({ queryKey: keys.available(provider), queryFn: () => settingsApi.getAvailableTargets(provider) });
export const useAddTarget = () => useSettingsMutation(settingsApi.addTarget, ({ target }) => `Syncing ${target.key}.`);
export const useDisconnect = (name: string) =>
  useSettingsMutation(settingsApi.disconnect, () => `${name} disconnected. Imported tickets are kept.`);
export const useSyncNow = (name: string) => useSettingsMutation(settingsApi.syncNow, () => `Syncing ${name}.`);

export function useStartAuthorization() {
  return useMutation<{ authorization_url: string }, ApiError, string>({
    mutationFn: settingsApi.startAuthorization,
    onSuccess: ({ authorization_url }) => window.location.assign(authorization_url),
    onError: showError,
  });
}

export const useMembers = (id: string) => useQuery({ queryKey: keys.workspace(id, 'members'), queryFn: () => settingsApi.getMembers(id) });
export const useInvites = (id: string, enabled: boolean) =>
  useQuery({ queryKey: keys.workspace(id, 'invites'), queryFn: () => settingsApi.getInvites(id), enabled });

/** A workspace change: refreshes the workspace list and its members and invites. */
function useWorkspaceMutation<TArg, TResult>(mutationFn: (arg: TArg) => Promise<TResult>, success?: (result: TResult, arg: TArg) => string) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: (result, arg) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
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
export const useResendInvite = () => useWorkspaceMutation(settingsApi.resendInvite, (invite) => `Invite sent again to ${invite.email}.`);
