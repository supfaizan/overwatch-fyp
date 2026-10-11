'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import * as boardApi from './api';
import type { MoveWorkItem, WorkItem } from './types';

const keys = {
  assignees: (provider: string, targetKey: string | null) => [...queryKeys.connections, provider, targetKey, 'assignees'] as const,
  members: (workspaceId: string) => ['board', 'members', workspaceId] as const,
};

const showError = (error: ApiError) => toast.error(error.message);

export const useWorkItems = () => useQuery({ queryKey: queryKeys.workItems, queryFn: boardApi.getWorkItems });

export const useTrackers = () => useQuery({ queryKey: queryKeys.connections, queryFn: boardApi.getTrackers });

/** Who an item can be assigned to: workspace members, or the tracker project's assignable users. */
export function usePeople(provider: string | null, targetKey: string | null) {
  const workspaceId = useCurrentWorkspace()?.id ?? '';
  return useQuery({
    queryKey: provider ? keys.assignees(provider, targetKey) : keys.members(workspaceId),
    queryFn: () => (provider && targetKey ? boardApi.getTrackerAssignees(provider, targetKey) : boardApi.getMembers(workspaceId)),
    enabled: provider ? Boolean(targetKey) : Boolean(workspaceId),
  });
}

function useItemMutation<TArg, TResult>(mutationFn: (arg: TArg) => Promise<TResult>, success?: string) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workItems });
      if (success) toast.success(success);
    },
    onError: showError,
  });
}

export const useCreateWorkItem = () => useItemMutation(boardApi.createWorkItem);
export const useUpdateWorkItem = () => useItemMutation(boardApi.updateWorkItem);
export const useDeleteWorkItem = () => useItemMutation(boardApi.deleteWorkItem, 'Item deleted.');

type Move = { id: string; move: MoveWorkItem; rank: number };

/** Moves a card right away (see `moveItem`) and puts it back if the server, or the tracker, refuses. */
export function useMoveWorkItem() {
  const queryClient = useQueryClient();
  return useMutation<WorkItem, ApiError, Move, { previous?: WorkItem[] }>({
    mutationFn: ({ id, move }) => boardApi.moveWorkItem({ id, ...move }),
    onMutate: async ({ id, move, rank }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workItems });
      const previous = queryClient.getQueryData<WorkItem[]>(queryKeys.workItems);
      queryClient.setQueryData<WorkItem[]>(queryKeys.workItems, (items) =>
        items?.map((item) => (item.id === id ? { ...item, status_category: move.status_category, rank } : item)),
      );
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.workItems, context.previous);
      showError(error);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.workItems }),
  });
}
