'use client';

import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as checksApi from './api';

const checksKey = [...queryKeys.decisions, 'checks'] as const;

const showError = (error: ApiError) => {
  return toast.error(error.message);
};

export const useCheckSettings = () => {
  return useQuery({ queryKey: checksKey, queryFn: checksApi.getCheckSettings });
};

export const useSetChecksEnabled = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checksApi.setChecksEnabled,
    onSuccess: (settings) => {
      queryClient.setQueryData(checksKey, settings);
    },
    onError: showError,
  });
};

/** Check now: decisions and the last-run line refresh, with what it found. */
export const useRunCheck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checksApi.runCheck,
    onSuccess: ({ checked, conflicts, capped }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.decisions });
      if (capped) {
        toast.warning("Today's checks ran out; the rest are read tomorrow.");
      } else if (!checked) {
        toast.success('Nothing changed since the last check.');
      } else {
        toast.success(
          conflicts
            ? `Found ${conflicts} ${
              conflicts === 1 ? 'contradiction' : 'contradictions'
            } to review.`
            : `Read ${checked} changed ${
              checked === 1 ? 'source' : 'sources'
            }; nothing contradicts.`,
        );
      }
    },
    onError: showError,
  });
};
