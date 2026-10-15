'use client';

import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { useSession } from '@/shared/session/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as workspacesApi from './api';
import { saveLastWorkspace } from './lib';
import { useWorkspace } from './store';

export function useWorkspaces() {
  return useQuery({ queryKey: queryKeys.workspaces, queryFn: workspacesApi.getWorkspaces });
}

/** The workspace every request is scoped to, once WorkspaceGate has picked it. */
export function useCurrentWorkspace() {
  const id = useWorkspace((state) => state.id);
  return useWorkspaces().data?.find((workspace) => workspace.id === id);
}

/** Point every request at another workspace and refetch everything for it, from the dashboard. */
export function useSwitchWorkspace() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const userId = useSession((state) => state.user?.id ?? '');

  return (id: string) => {
    useWorkspace.getState().setId(id);
    saveLastWorkspace(userId, id);
    // reset after the switch: in-flight requests for the old workspace are cancelled, refetches carry the new header
    void queryClient.resetQueries({
      predicate: (query) => query.queryKey[0] !== queryKeys.workspaces[0],
    });
    router.push('/dashboard');
  };
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const switchTo = useSwitchWorkspace();
  return useMutation<Awaited<ReturnType<typeof workspacesApi.createWorkspace>>, ApiError, string>({
    mutationFn: workspacesApi.createWorkspace,
    onSuccess: async (workspace) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      toast.success(`Created ${workspace.name}.`);
      switchTo(workspace.id);
    },
    onError: (error) => toast.error(error.message),
  });
}
