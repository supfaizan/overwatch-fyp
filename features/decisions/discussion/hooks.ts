'use client';

import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import { realtimeSignal, useRealtimeTopic } from '@/shared/realtime/hooks';
import type { EndReason } from '@/shared/realtime/protocol';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as discussionApi from './api';
import { loadShortcodes, shortcodeList } from './emoji';
import { fileProblem, MAX_FILES } from './files';
import {
  applyChange,
  type CachedDiscussion,
  type DiscussionChange,
  readEvent,
  removeMessage,
  upsertMessage,
} from './lib';
import type { DiscussionAttachment, DiscussionMessage, PendingMessage } from './types';

/** The backend's error when a message was deleted meanwhile. */
const COMMENT_NOT_FOUND = 'comment_not_found';

/** Under the decisions root, so refreshing decisions refreshes their discussions too. */
export const discussionKey = (decisionId: string) => {
  return [...queryKeys.decisions, 'discussion', decisionId] as const;
};

/** The discussion, newest page first; `fetchNextPage` loads older messages. */
export function useDiscussion(decisionId: string) {
  return useInfiniteQuery({
    queryKey: discussionKey(decisionId),
    queryFn: ({ pageParam }) => {
      return discussionApi.getMessages(decisionId, pageParam);
    },
    initialPageParam: null as string | null,
    // the next page is the one before this page's oldest message
    getNextPageParam: (page) => {
      return page.hasMore ? page.messages[0]?.id : undefined;
    },
    // coming back to the tab shows what was said meanwhile
    refetchOnWindowFocus: true,
  });
}

/** Puts a message the backend answered with into the cached discussion, or refetches it when none is cached. */
function useMergeMessage(decisionId: string) {
  const queryClient = useQueryClient();
  return (message: DiscussionMessage) => {
    const key = discussionKey(decisionId);
    if (queryClient.getQueryData(key)) {
      queryClient.setQueryData<CachedDiscussion>(key, (data) => {
        return upsertMessage(data, message);
      });
    } else {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

const newClientId = () => {
  return crypto.randomUUID().replaceAll('-', '');
};

/**
 * Sending messages: each shows at once as pending, becomes the sent message when the backend
 * answers, and stays as failed (to retry or discard) when it doesn't. A retry reuses the message's
 * client id, so the backend never posts it twice.
 */
export function useSendMessage(decisionId: string) {
  const merge = useMergeMessage(decisionId);
  const [pending, setPending] = useState<PendingMessage[]>([]);

  const post = (item: PendingMessage) => {
    setPending((list) => {
      return [
        ...list.filter((other) => {
          return other.clientId !== item.clientId;
        }),
        { ...item, status: 'sending' },
      ];
    });
    discussionApi.sendMessage({
      decisionId,
      clientId: item.clientId,
      body: item.body,
      attachmentIds: item.attachments.map((attachment) => {
        return attachment.id;
      }),
    }).then(
      (message) => {
        merge(message);
        setPending((list) => {
          return list.filter((other) => {
            return other.clientId !== item.clientId;
          });
        });
      },
      (error: ApiError) => {
        toast.error(error.message);
        setPending((list) => {
          return list.map((other) => {
            return other.clientId === item.clientId ? { ...other, status: 'failed' } : other;
          });
        });
      },
    );
  };

  return {
    pending,
    send: (body: string, attachments: DiscussionAttachment[] = []) => {
      post({
        clientId: newClientId(),
        body,
        attachments,
        status: 'sending',
        createdAt: new Date().toISOString(),
      });
    },
    retry: (item: PendingMessage) => {
      post(item);
    },
    discard: (clientId: string) => {
      setPending((list) => {
        return list.filter((item) => {
          return item.clientId !== clientId;
        });
      });
    },
  };
}

/** A message that's gone (deleted elsewhere) leaves the thread, with the reason. */
function useOnGone(decisionId: string) {
  const queryClient = useQueryClient();
  return (error: ApiError, id: string) => {
    toast.error(error.message);
    if (error.errorCode === COMMENT_NOT_FOUND) {
      queryClient.setQueryData<CachedDiscussion>(discussionKey(decisionId), (data) => {
        return removeMessage(data, id);
      });
    }
  };
}

export function useEditMessage(decisionId: string) {
  const merge = useMergeMessage(decisionId);
  const onGone = useOnGone(decisionId);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => {
      return discussionApi.editMessage({ decisionId, id, body });
    },
    onSuccess: merge,
    onError: (error: ApiError, { id }) => {
      return onGone(error, id);
    },
  });
}

export function useDeleteMessage(decisionId: string) {
  const queryClient = useQueryClient();
  const onGone = useOnGone(decisionId);
  return useMutation({
    mutationFn: (id: string) => {
      return discussionApi.deleteMessage({ decisionId, id });
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<CachedDiscussion>(discussionKey(decisionId), (data) => {
        return removeMessage(data, id);
      });
    },
    onError: onGone,
  });
}

/** Reacting to a message, or taking a reaction back. */
export function useSetReaction(decisionId: string) {
  const merge = useMergeMessage(decisionId);
  const onGone = useOnGone(decisionId);
  return useMutation({
    mutationFn: (change: { id: string; emoji: string; on: boolean }) => {
      return discussionApi.setReaction({ decisionId, ...change });
    },
    onSuccess: merge,
    onError: (error: ApiError, { id }) => {
      return onGone(error, id);
    },
  });
}

/** Slack's emoji names, loaded once when first needed (a ":" typed in the composer). */
export function useShortcodes(enabled: boolean) {
  return useQuery({
    queryKey: ['emoji', 'shortcodes'],
    queryFn: async () => {
      return shortcodeList(await loadShortcodes());
    },
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** Someone typing is shown this long after their last "typing" unless they stop or send first. */
const TYPING_SHOWN_MS = 6_000;

type Typist = { id: string; name: string; until: number };

/**
 * Keeps the discussion live: messages others send, edit or delete arrive as they happen, and
 * who's typing is tracked. After a (re)connect the discussion refetches, in case anything was
 * missed meanwhile; events that land during a refetch are applied again once it's done, so the
 * refetch can't undo them. `ended` says why the discussion can't be followed any more.
 */
export function useLiveDiscussion(decisionId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const key = discussionKey(decisionId);
  const [typists, setTypists] = useState<Typist[]>([]);
  const [ended, setEnded] = useState<EndReason | null>(null);
  // changes that arrived while the discussion was being fetched, to apply again after
  const duringFetch = useRef<DiscussionChange[]>([]);

  const apply = (change: DiscussionChange) => {
    queryClient.setQueryData<CachedDiscussion>(key, (data) => {
      return applyChange(data, change);
    });
  };

  useRealtimeTopic(topicOf(decisionId), {
    onEvent: (event) => {
      const change = readEvent(event.event, event.data);
      if (!change) {
        return;
      }
      if (change.kind === 'typing') {
        if (change.user.id !== userId) {
          setTypists((list) => {
            const others = list.filter((typist) => {
              return typist.id !== change.user.id;
            });
            return change.typing
              ? [...others, { ...change.user, until: Date.now() + TYPING_SHOWN_MS }]
              : others;
          });
        }
        return;
      }
      if (change.kind === 'upsert') {
        // a message sent means its author stopped typing
        setTypists((list) => {
          return list.filter((typist) => {
            return typist.id !== change.message.author.id;
          });
        });
      }
      apply(change);
      if (queryClient.isFetching({ queryKey: key }) > 0) {
        duringFetch.current.push(change);
      }
    },
    onResync: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onEnd: setEnded,
  });

  // once a fetch lands, what arrived during it goes back on top
  const { dataUpdatedAt } = useDiscussion(decisionId);
  useEffect(() => {
    if (duringFetch.current.length > 0 && queryClient.isFetching({ queryKey: key }) === 0) {
      duringFetch.current.splice(0).forEach(apply);
    }
    // only a newly fetched discussion re-applies them
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdatedAt]);

  // drop typists who went quiet without a "stopped" (closed the tab, lost the connection)
  useEffect(() => {
    if (typists.length === 0) {
      return;
    }
    const timer = setInterval(() => {
      setTypists((list) => {
        const now = Date.now();
        return list.filter((typist) => {
          return typist.until > now;
        });
      });
    }, 1_000);
    return () => {
      clearInterval(timer);
    };
  }, [typists.length]);

  return { typists, ended };
}

/** The realtime topic of a decision's discussion. */
const topicOf = (decisionId: string) => {
  return `decision:${decisionId}`;
};

/** A "stop" is sent this long after the last keystroke. */
const TYPING_IDLE_MS = 4_000;
/** While typing, "start" is sent again at most this often, keeping others' indicator up. */
const TYPING_REPEAT_MS = 3_000;

/** Tells the others when this member is typing in the discussion's composer. */
export function useTypingSignal(decisionId: string) {
  const lastStart = useRef(0);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topic = topicOf(decisionId);

  const stop = () => {
    if (idle.current) {
      clearTimeout(idle.current);
      idle.current = null;
    }
    if (lastStart.current) {
      lastStart.current = 0;
      realtimeSignal(topic, 'typing', 'stop');
    }
  };

  useEffect(() => {
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  return {
    /** Call on every change to the draft. */
    typed: (draft: string) => {
      if (!draft.trim()) {
        stop();
        return;
      }
      if (Date.now() - lastStart.current > TYPING_REPEAT_MS) {
        lastStart.current = Date.now();
        realtimeSignal(topic, 'typing', 'start');
      }
      if (idle.current) {
        clearTimeout(idle.current);
      }
      idle.current = setTimeout(stop, TYPING_IDLE_MS);
    },
    /** Call on send or blur. */
    stop,
  };
}

/** A file in the composer: uploading, ready to send, or failed. */
export type DraftFile = {
  key: string;
  file: File;
  progress: number;
  status: 'uploading' | 'ready' | 'failed';
  attachment: DiscussionAttachment | null;
  error: string | null;
};

/**
 * Files added to the composer: each uploads at once (with its progress), so sending only waits for
 * the ones still going. A failed one can be retried or removed; files that can't be shared are
 * refused before uploading, with the reason.
 */
export function useDraftFiles(decisionId: string) {
  const [files, setFiles] = useState<DraftFile[]>([]);
  const change = (key: string, update: Partial<DraftFile>) => {
    setFiles((list) => {
      return list.map((draft) => {
        return draft.key === key ? { ...draft, ...update } : draft;
      });
    });
  };

  const upload = (draft: DraftFile) => {
    change(draft.key, { status: 'uploading', progress: 0, error: null });
    discussionApi.uploadAttachment(decisionId, draft.file, (progress) => {
      change(draft.key, { progress });
    }).then(
      (attachment) => {
        change(draft.key, { status: 'ready', progress: 1, attachment });
      },
      (error: Error) => {
        change(draft.key, { status: 'failed', error: error.message });
      },
    );
  };

  return {
    files,
    add: (picked: File[]) => {
      const room = MAX_FILES - files.length;
      if (picked.length > room) {
        toast.error(`A message can carry up to ${MAX_FILES} files.`);
      }
      const accepted = picked.slice(0, Math.max(room, 0)).filter((file) => {
        const problem = fileProblem(file.name, file.size);
        if (problem) {
          toast.error(problem);
        }
        return !problem;
      }).map((file): DraftFile => {
        return {
          key: newClientId(),
          file,
          progress: 0,
          status: 'uploading',
          attachment: null,
          error: null,
        };
      });
      setFiles((list) => {
        return [...list, ...accepted];
      });
      accepted.forEach(upload);
    },
    retry: upload,
    remove: (key: string) => {
      setFiles((list) => {
        return list.filter((draft) => {
          return draft.key !== key;
        });
      });
    },
    clear: () => {
      setFiles([]);
    },
  };
}
