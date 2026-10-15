'use client';

import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as typesApi from './api';

// types change rarely; every card reads them
const TYPES_STALE_MS = 5 * 60_000;

export const useWorkItemTypes = () =>
  useQuery({
    queryKey: queryKeys.workItemTypes,
    queryFn: typesApi.getTypes,
    staleTime: TYPES_STALE_MS,
  });

/** Adding, editing and removing types: lists refetch, and a removal also refetches the items that changed type. */
function useTypeMutation<TArg, TResult>(
  mutationFn: (arg: TArg) => Promise<TResult>,
  success: string,
) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TArg>({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workItemTypes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workItems });
      toast.success(success);
    },
    onError: (error) => toast.error(error.message),
  });
}

export const useCreateType = () => useTypeMutation(typesApi.createType, 'Type added.');
export const useUpdateType = () => useTypeMutation(typesApi.updateType, 'Type saved.');
export const useDeleteType = () => useTypeMutation(typesApi.deleteType, 'Type removed.');
