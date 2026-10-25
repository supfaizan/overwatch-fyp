'use client';

import { ApiError } from '@/shared/api/envelope';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as chatApi from './api';
import type { AskBody, AskResult, Conversation } from './types';

/** Characters typed after `@` before the graph is searched (the backend's minimum). */
export const MIN_MENTION_TERM = 2;

const keys = {
  conversations: (repo: string) => {
    return ['chat', 'conversations', repo] as const;
  },
  conversation: (id: string) => {
    return ['chat', 'conversation', id] as const;
  },
  mentions: (repo: string, term: string) => {
    return ['chat', 'mentions', repo, term] as const;
  },
  source: (repo: string, path: string, commitSha: string) => {
    return ['chat', 'source', repo, path, commitSha] as const;
  },
};

export const useConversations = (repo: string) => {
  return useQuery({
    queryKey: keys.conversations(repo),
    queryFn: () => {
      return chatApi.getConversations(repo);
    },
  });
};

export const useConversation = (id: string | null) => {
  return useQuery({
    queryKey: keys.conversation(id ?? ''),
    queryFn: () => {
      return chatApi.getConversation(id ?? '');
    },
    enabled: Boolean(id),
  });
};

/** An answer being written: what was asked, the model's thinking so far and the draft answer. */
export type AskDraft = {
  body: AskBody;
  thinking: string;
  /** what it looked up on the way, in order */
  looking: string[];
  answer: string;
  /** when the model was first heard from, and when it started on the answer */
  startedAt: number | null;
  answeringAt: number | null;
};

/**
 * Ask with the answer streamed in. `draft` holds it while it's written; once the checked answer
 * arrives it replaces the draft in the conversation's cache. Errors stay with the caller, which
 * keeps the question and shows them inline; `stop` abandons the answer, saving nothing.
 */
export function useAskStream() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<AskDraft | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      return controller.current?.abort();
    };
  }, []);

  const ask = useCallback(
    async (body: AskBody): Promise<AskResult> => {
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      setError(null);
      setDraft({ body, thinking: '', looking: [], answer: '', startedAt: null, answeringAt: null });
      try {
        const result = await chatApi.askStream(body, {
          signal: current.signal,
          onEvent: (event) => {
            setDraft((previous) => {
              if (!previous) {
                return previous;
              }
              if (event.event === 'started') {
                return { ...previous, startedAt: Date.now() };
              }
              if (event.event === 'thinking') {
                return { ...previous, thinking: previous.thinking + event.data.text };
              }
              if (event.event === 'status') {
                return { ...previous, looking: [...previous.looking, event.data.text] };
              }
              if (event.event === 'answer') {
                return {
                  ...previous,
                  answer: previous.answer + event.data.text,
                  answeringAt: previous.answeringAt ?? Date.now(),
                };
              }
              return previous;
            });
          },
        });
        const { conversation, question, answer } = result;
        // the answer is already here, so the thread is updated in place rather than refetched
        queryClient.setQueryData<Conversation>(keys.conversation(conversation.id), (cached) => {
          return { ...conversation, messages: [...(cached?.messages ?? []), question, answer] };
        });
        void queryClient.invalidateQueries({
          queryKey: keys.conversations(conversation.repo_full_name),
        });
        return result;
      } catch (caught) {
        if (!current.signal.aborted) {
          setError(
            caught instanceof ApiError
              ? caught
              : new ApiError('Something went wrong', 0, 'unknown'),
          );
        }
        throw caught;
      } finally {
        if (controller.current === current) {
          controller.current = null;
          setDraft(null);
        }
      }
    },
    [queryClient],
  );

  const stop = useCallback(() => {
    controller.current?.abort();
  }, []);

  const reset = useCallback(() => {
    controller.current?.abort();
    setError(null);
  }, []);

  return { ask, stop, reset, draft, error, pending: draft !== null };
}

export function useDeleteConversation(repo: string) {
  const queryClient = useQueryClient();
  return useMutation<null, ApiError, string>({
    mutationFn: chatApi.deleteConversation,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: keys.conversation(id) });
      void queryClient.invalidateQueries({ queryKey: keys.conversations(repo) });
    },
    onError: (error) => {
      return toast.error(error.message);
    },
  });
}

/** Files and symbols to offer after `@`. */
export const useMentionCandidates = (repo: string, term: string | null) => {
  return useQuery({
    queryKey: keys.mentions(repo, term ?? ''),
    queryFn: () => {
      return chatApi.searchNodes(repo, term ?? '');
    },
    enabled: term !== null && term.length >= MIN_MENTION_TERM,
    // keep the last list while the next keystroke's results load
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
};

/** A cited file as of the commit it was cited at; a commit never changes, so it's fetched once. */
export const useSource = (repo: string, path: string, commitSha: string) => {
  return useQuery({
    queryKey: keys.source(repo, path, commitSha),
    queryFn: () => {
      return chatApi.getSource(repo, path, commitSha);
    },
    staleTime: Infinity,
    retry: false,
  });
};
