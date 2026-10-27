'use client';

import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { isRunning, JOB_POLL_MS } from '@/shared/lib/job-status';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as settingsApi from './api';

const keys = {
  available: (provider: string) => {
    return [...queryKeys.connections, provider, 'available'] as const;
  },
  workspace: (id: string, part: 'invites') => {
    return [...queryKeys.workspaces, id, part] as const;
  },
  usage: (days: number) => {
    return ['usage', days] as const;
  },
};
const showError = (error: ApiError) => {
  return toast.error(error.message);
};

export const useConnectionStatus = () => {
  return useQuery({
    queryKey: queryKeys.onboardingStatus,
    queryFn: settingsApi.getConnectionStatus,
  });
};

export function useConnections() {
  return useQuery({
    queryKey: queryKeys.connections,
    queryFn: settingsApi.getConnections,
    refetchInterval: ({ state }) => {
      return state.data?.some((c) => {
          return c.targets.some((t) => {
            return isRunning(t.sync_status);
          });
        })
        ? JOB_POLL_MS
        : false;
    },
  });
}

function useSettingsMutation<TArg, TResult>(
  mutationFn: (arg: TArg) => Promise<TResult>,
  success: (arg: TArg) => string,
) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: (_, arg) => {
      for (
        const queryKey of [
          queryKeys.onboardingStatus,
          queryKeys.github,
          queryKeys.connections,
          queryKeys.workItems,
        ]
      ) {
        void queryClient.invalidateQueries({ queryKey });
      }
      toast.success(success(arg));
    },
    onError: showError,
  });
}

export const useReindexRepo = () => {
  return useSettingsMutation(settingsApi.reindexRepo, (repo) => {
    return `Re-indexing ${repo}.`;
  });
};
export const useDisconnectRepo = () => {
  return useSettingsMutation(settingsApi.disconnectRepo, (repo) => {
    return `Disconnected ${repo}.`;
  });
};
export const useAvailableTargets = (provider: string) => {
  return useQuery({
    queryKey: keys.available(provider),
    queryFn: () => {
      return settingsApi.getAvailableTargets(provider);
    },
  });
};
export const useAddTarget = () => {
  return useSettingsMutation(settingsApi.addTarget, ({ target }) => {
    return `Syncing ${target.key}.`;
  });
};
export const useDisconnect = (name: string) => {
  return useSettingsMutation(
    settingsApi.disconnect,
    () => {
      return `${name} disconnected. Imported tickets are kept.`;
    },
  );
};
export const useSyncNow = (name: string) => {
  return useSettingsMutation(settingsApi.syncNow, () => {
    return `Syncing ${name}.`;
  });
};

export function useStartAuthorization() {
  return useMutation<{ authorization_url: string }, ApiError, string>({
    mutationFn: settingsApi.startAuthorization,
    onSuccess: ({ authorization_url }) => {
      return window.location.assign(authorization_url);
    },
    onError: showError,
  });
}

export const useUsage = (days: number) => {
  return useQuery({
    queryKey: keys.usage(days),
    queryFn: () => {
      return settingsApi.getUsage(days);
    },
  });
};
export const useInvites = (id: string, enabled: boolean) => {
  return useQuery({
    queryKey: keys.workspace(id, 'invites'),
    queryFn: () => {
      return settingsApi.getInvites(id);
    },
    enabled,
  });
};

/** A workspace change: refreshes the workspace list and its members and invites. */
function useWorkspaceMutation<TArg, TResult>(
  mutationFn: (arg: TArg) => Promise<TResult>,
  success?: (result: TResult, arg: TArg) => string,
) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: (result, arg) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      if (success) {
        toast.success(success(result, arg));
      }
    },
    onError: showError,
  });
}

export const useRenameWorkspace = () => {
  return useWorkspaceMutation(settingsApi.renameWorkspace, (workspace) => {
    return `Renamed to ${workspace.name}.`;
  });
};
export const useDeleteWorkspace = () => {
  return useWorkspaceMutation(settingsApi.deleteWorkspace);
};
export const useUpdateMember = () => {
  return useWorkspaceMutation(settingsApi.updateMember, () => {
    return 'Role updated.';
  });
};
export const useRemoveMember = () => {
  return useWorkspaceMutation(settingsApi.removeMember);
};
export const useCreateInvite = () => {
  return useWorkspaceMutation(settingsApi.createInvite);
};
export const useRevokeInvite = () => {
  return useWorkspaceMutation(settingsApi.revokeInvite, () => {
    return 'Invite revoked.';
  });
};
export const useResendInvite = () => {
  return useWorkspaceMutation(
    settingsApi.resendInvite,
    (invite) => {
      return `Invite sent again to ${invite.email}.`;
    },
  );
};
