'use client';

import { ApiError } from '@/shared/api/envelope';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';
import Spinner from '@/shared/components/spinner';
import { useSession } from '@/shared/session/store';
import { useWorkspace } from '@/shared/workspaces/store';
import { ChatCircleDots, ClockCounterClockwise, Plus, Trash, X } from '@phosphor-icons/react/ssr';
import { useEffect, useRef, useState } from 'react';
import { useWalkthrough } from '../hooks';
import { useViewStore } from '../store';
import AnswerDraft from './components/answer-draft';
import ChatComposer from './components/chat-composer';
import ChatMessage from './components/chat-message';
import ClarifyingQuestion from './components/clarifying-question';
import { useAskStream, useConversation, useConversations, useDeleteConversation } from './hooks';
import { conversationKey, useChatSession } from './store';

const CONVERSATION_NOT_FOUND = 'conversation_not_found';
/** How close to the bottom counts as reading along, so a streaming answer is followed. */
const FOLLOW_WITHIN_PX = 120;
/** The backend's limit on open folders sent with a question. */
const MAX_OPEN_FOLDERS = 10;

/** Questions about one repository, answered from its graph; a reference in a message selects that node. */
export default function ChatPanel({ repo, onClose }: { repo: string; onClose: () => void }) {
  const userId = useSession((state) => {
    return state.user?.id ?? '';
  });
  const workspaceId = useWorkspace((state) => {
    return state.id ?? '';
  });
  const key = conversationKey(userId, workspaceId, repo);
  const conversationId = useChatSession((state) => {
    return state.current[key] ?? null;
  });
  const setConversationId = (id: string | null) => {
    useChatSession.getState().setCurrent(key, id);
  };
  const conversations = useConversations(repo);
  const conversation = useConversation(conversationId);
  const ask = useAskStream();
  const { play } = useWalkthrough(repo);
  const remove = useDeleteConversation(repo);
  const selected = useViewStore((state) => {
    return state.selected;
  });
  const end = useRef<HTMLDivElement>(null);

  const messages = conversation.data?.messages ?? [];
  const asking = ask.draft;

  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, asking?.body, asking?.startedAt]);

  // follow the answer as it's written, unless the reader has scrolled up to something else
  const written = (asking?.thinking.length ?? 0) + (asking?.answer.length ?? 0);
  useEffect(() => {
    const box = scroller.current;
    if (box && box.scrollHeight - box.scrollTop - box.clientHeight < FOLLOW_WITHIN_PX) {
      end.current?.scrollIntoView({ block: 'end' });
    }
  }, [written]);

  // the conversation this chat was on has expired or was deleted elsewhere: start a new one
  const lost = conversation.error instanceof ApiError
    && conversation.error.errorCode === CONVERSATION_NOT_FOUND;
  useEffect(() => {
    if (lost) {
      useChatSession.getState().setCurrent(key, null);
    }
  }, [lost, key]);

  // another conversation's walkthrough, and the step it left selected, have nothing to do with this one
  const openConversation = (id: string | null) => {
    const { walk, endWalk, select } = useViewStore.getState();
    if (walk) {
      endWalk();
      select(null);
    }
    setConversationId(id);
  };
  const startNew = () => {
    openConversation(null);
    ask.reset();
  };

  const send = async (question: string, mentionedNodeIds: string[]) => {
    try {
      const result = await ask.ask({
        repo_full_name: repo,
        question,
        conversation_id: conversationId ?? undefined,
        focused_node_id: selected ?? undefined,
        mentioned_node_ids: mentionedNodeIds,
        // what's open on the canvas is what the user is looking at
        open_folder_ids: useViewStore.getState().expanded.toReversed().slice(0, MAX_OPEN_FOLDERS),
      });
      setConversationId(result.conversation.id);
      // an answer about a flow walks through it once by itself
      play(
        result.answer.id,
        result.answer.steps.map((step) => {
          return step.node_id;
        }),
      );
    } catch (error) {
      // expired or deleted elsewhere: the next question starts a new one
      if (error instanceof ApiError && error.errorCode === CONVERSATION_NOT_FOUND) {
        setConversationId(null);
      }
      throw error;
    }
  };

  // a follow-up or an option picked from a question back is asked like a typed question
  const askNext = (question: string) => {
    void send(question, []).catch(() => {
      // the error shows in the footer (`ask.error`), with the question kept
      return undefined;
    });
  };
  const latestAnswer = messages.findLast((message) => {
    return message.role === 'assistant';
  })?.id;
  // a question back stays open over the input until it's answered or skipped
  const [skipped, setSkipped] = useState<string | null>(null);
  const last = messages.at(-1);
  const questionBack = last?.role === 'assistant' && last.ask && last.id !== skipped && !asking
    ? { id: last.id, ask: last.ask }
    : null;

  return (
    <aside
      aria-label="Ask about this repository"
      className="flex h-full min-h-0 flex-col border-l border-border bg-background"
    >
      <header className="flex items-center gap-1 border-b border-border px-3 py-2">
        <h2 className="flex-1 truncate text-sm font-medium">
          {conversation.data?.title ?? 'Ask about this repository'}
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="tertiary" size="sm" iconOnly aria-label="Earlier conversations">
              <ClockCounterClockwise />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Earlier conversations</DropdownMenuLabel>
            {conversations.data?.length
              ? (
                conversations.data.map((item) => {
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onSelect={() => {
                        return openConversation(item.id);
                      }}
                    >
                      <span className="truncate">{item.title}</span>
                    </DropdownMenuItem>
                  );
                })
              )
              : (
                <p className="px-2 py-1.5 text-xs text-muted">
                  None yet. Conversations are kept for 30 days.
                </p>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
        {conversationId && (
          <ConfirmDialog
            trigger={
              <Button variant="tertiary" size="sm" iconOnly aria-label="Delete conversation">
                <Trash />
              </Button>
            }
            title="Delete this conversation?"
            description="This can't be undone."
            confirmLabel="Delete"
            pending={remove.isPending}
            onConfirm={(done) => {
              return remove.mutate(conversationId, {
                onSuccess: () => {
                  done();
                  startNew();
                },
              });
            }}
          />
        )}
        <Button
          variant="tertiary"
          size="sm"
          iconOnly
          aria-label="New conversation"
          onClick={startNew}
        >
          <Plus />
        </Button>
        <Button variant="tertiary" size="sm" iconOnly aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {conversation.isError
          ? (
            <Banner
              type="error"
              action={<Button size="sm" onClick={startNew}>New conversation</Button>}
            >
              {conversation.error.message}
            </Banner>
          )
          : conversation.isLoading
          ? <Spinner className="mx-auto size-5 text-muted" />
          : messages.length === 0 && !asking
          ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted">
              <ChatCircleDots className="size-6" aria-hidden />
              <p className="max-w-64">
                Ask how the code fits together, like “What does the api module depend on?”. Answers
                come from the indexed graph only.
              </p>
            </div>
          )
          : (
            <ol className="flex flex-col gap-3">
              {messages.map((message) => {
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    repo={repo}
                    onAsk={message.id === latestAnswer ? askNext : undefined}
                    pending={ask.pending}
                  />
                );
              })}
              {asking && (
                <>
                  <li className="flex justify-end">
                    <p className="max-w-5/6 rounded-lg bg-fill-active px-3 py-2 text-sm break-words whitespace-pre-wrap">
                      {asking.body.question}
                    </p>
                  </li>
                  <AnswerDraft draft={asking} />
                </>
              )}
            </ol>
          )}
        <div ref={end} />
      </div>

      <footer className="flex flex-col gap-2 border-t border-border p-3">
        {questionBack && (
          <ClarifyingQuestion
            ask={questionBack.ask}
            onPick={askNext}
            onDismiss={() => {
              return setSkipped(questionBack.id);
            }}
            disabled={ask.pending}
          />
        )}
        {ask.error && (
          <Banner type="error" className="text-xs">
            {ask.error.message}
          </Banner>
        )}
        {selected && (
          <p className="truncate text-xs text-muted">
            Includes the selected node{' '}
            <span className="font-mono">{selected.split(/[:/#]/).at(-1)}</span>
          </p>
        )}
        <ChatComposer repo={repo} pending={ask.pending} onSend={send} onStop={ask.stop} />
      </footer>
    </aside>
  );
}
