'use client';

import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { useSession } from '@/shared/session/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as decisionsApi from './api';
import { INBOX_TAB, inboxTab, localToday } from './lib';
import type { Decision, DecisionFilters } from './types';

const SOURCE_UNCHANGED = 'source_unchanged';

const keys = {
  list: (filters: DecisionFilters) => {
    return [...queryKeys.decisions, 'list', filters] as const;
  },
  one: (id: string) => {
    return [...queryKeys.decisions, 'one', id] as const;
  },
  checks: [...queryKeys.decisions, 'checks'] as const,
};

export const useDecisions = (filters: DecisionFilters = {}) => {
  return useQuery({
    queryKey: keys.list(filters),
    queryFn: () => {
      return decisionsApi.getDecisions(filters);
    },
  });
};

/** How many decisions are waiting on this person (the inbox's Needs you), for the sidebar. */
export const useNeedsYouCount = () => {
  const userId = useSession((state) => {
    return state.user?.id;
  });
  const decisions = useDecisions();
  const today = localToday();
  return decisions.data?.filter((decision) => {
    return inboxTab(decision, userId, today) === INBOX_TAB.needsYou;
  }).length ?? 0;
};

export const useDecision = (id: string) => {
  return useQuery({
    queryKey: keys.one(id),
    queryFn: () => {
      return decisionsApi.getDecision(id);
    },
  });
};

/** Any change to a decision: the changed one is shown at once and every list refetches. */
function useDecisionMutation<TArg>(
  mutationFn: (arg: TArg) => Promise<Decision>,
  success?: string,
) {
  const queryClient = useQueryClient();
  return useMutation<Decision, ApiError, TArg>({
    mutationFn,
    onSuccess: (decision) => {
      queryClient.setQueryData(keys.one(decision.id), decision);
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.decisions, 'list'] });
      if (success) {
        toast.success(success);
      }
    },
    onError: (error) => {
      return toast.error(error.message);
    },
  });
}

export const useCreateDecision = () => {
  return useDecisionMutation(decisionsApi.createDecision, 'Decision recorded.');
};
export const useUpdateDecision = () => {
  return useDecisionMutation(decisionsApi.updateDecision);
};
export const useChangeStatus = () => {
  return useDecisionMutation(decisionsApi.changeStatus);
};
export const useAddEvidence = () => {
  return useDecisionMutation(decisionsApi.addEvidence, 'Passage added.');
};
export const useRemoveEvidence = () => {
  return useDecisionMutation(decisionsApi.removeEvidence);
};

export const useSuggestDecisions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decisionsApi.suggestDecisions,
    onSuccess: (suggested) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.decisions });
      toast.success(
        suggested.length
          ? `${suggested.length} suggested ${
            suggested.length === 1 ? 'decision' : 'decisions'
          } to review.`
          : 'No new decisions found here.',
      );
    },
    onError: (error: ApiError) => {
      // nothing new to read is an answer, not a failure
      return error.errorCode === SOURCE_UNCHANGED
        ? toast(error.message)
        : toast.error(error.message);
    },
  });
};

export const useDismissSuggestion = () => {
  const queryClient = useQueryClient();
  return useMutation<null, ApiError, string>({
    mutationFn: decisionsApi.dismissSuggestion,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: keys.one(id) });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.decisions, 'list'] });
      toast.success("Dismissed; it won't be suggested again.");
    },
    onError: (error) => {
      return toast.error(error.message);
    },
  });
};

export const useCheckSettings = () => {
  return useQuery({ queryKey: keys.checks, queryFn: decisionsApi.getCheckSettings });
};

export const useChangeCheckSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decisionsApi.changeCheckSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(keys.checks, settings);
    },
    onError: (error: ApiError) => {
      return toast.error(error.message);
    },
  });
};

/** Check now: decisions and the last-check line refresh, with what it found. */
export const useRunCheck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decisionsApi.runCheck,
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
    onError: (error: ApiError) => {
      return toast.error(error.message);
    },
  });
};
