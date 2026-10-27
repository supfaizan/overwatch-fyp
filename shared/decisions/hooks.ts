'use client';

import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { useSession } from '@/shared/session/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as decisionsApi from './api';
import { INBOX_TAB, inboxTab, localToday } from './lib';
import type { Decision, DecisionFilters } from './types';

const keys = {
  list: (filters: DecisionFilters) => {
    return [...queryKeys.decisions, 'list', filters] as const;
  },
  one: (id: string) => {
    return [...queryKeys.decisions, 'one', id] as const;
  },
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
