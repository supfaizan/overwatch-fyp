'use client';

import type { ApiError } from '@/shared/api/envelope';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as chatApi from './api';
import type { AskBody, AskResult, Conversation } from './types';

/** Characters typed after `@` before the graph is searched (the backend's minimum). */
export const MIN_MENTION_TERM = 2;

const keys = {
  conversations: (repo: string) => ['chat', 'conversations', repo] as const,
  conversation: (id: string) => ['chat', 'conversation', id] as const,
  mentions: (repo: string, term: string) => ['chat', 'mentions', repo, term] as const,
};

export const useConversations = (repo: string) =>
  useQuery({ queryKey: keys.conversations(repo), queryFn: () => chatApi.getConversations(repo) });

export const useConversation = (id: string | null) =>
  useQuery({
    queryKey: keys.conversation(id ?? ''),
    queryFn: () => chatApi.getConversation(id ?? ''),
    enabled: Boolean(id),
  });

/** Errors stay with the caller, which keeps the draft and shows them inline. */
export function useAsk() {
  const queryClient = useQueryClient();
  return useMutation<AskResult, ApiError, AskBody>({
    mutationFn: chatApi.ask,
    onSuccess: ({ conversation, question, answer }) => {
      // the answer is already here, so the thread is updated in place rather than refetched
      queryClient.setQueryData<Conversation>(keys.conversation(conversation.id), (current) => ({
        ...conversation,
        messages: [...(current?.messages ?? []), question, answer],
      }));
      void queryClient.invalidateQueries({
        queryKey: keys.conversations(conversation.repo_full_name),
      });
    },
  });
}

export function useDeleteConversation(repo: string) {
  const queryClient = useQueryClient();
  return useMutation<null, ApiError, string>({
    mutationFn: chatApi.deleteConversation,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: keys.conversation(id) });
      void queryClient.invalidateQueries({ queryKey: keys.conversations(repo) });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** Files and symbols to offer after `@`. */
export const useMentionCandidates = (repo: string, term: string | null) =>
  useQuery({
    queryKey: keys.mentions(repo, term ?? ''),
    queryFn: () => chatApi.searchNodes(repo, term ?? ''),
    enabled: term !== null && term.length >= MIN_MENTION_TERM,
    // keep the last list while the next keystroke's results load
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
