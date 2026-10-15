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
import { ChatCircleDots, ClockCounterClockwise, Plus, Trash, X } from '@phosphor-icons/react/ssr';
import { useEffect, useRef, useState } from 'react';
import { useViewStore } from '../store';
import ChatComposer from './components/chat-composer';
import ChatMessage from './components/chat-message';
import { useAsk, useConversation, useConversations, useDeleteConversation } from './hooks';

const CONVERSATION_NOT_FOUND = 'conversation_not_found';
/** The backend's limit on open folders sent with a question. */
const MAX_OPEN_FOLDERS = 10;
/** The conversation last used per repo, so reopening the chat returns to it; memory only, gone on reload. */
const lastConversation = new Map<string, string>();

/** Questions about one repository, answered from its graph; a reference in a message selects that node. */
export default function ChatPanel({ repo, onClose }: { repo: string; onClose: () => void }) {
  const [conversationId, setConversation] = useState<string | null>(() => {
    return lastConversation.get(repo) ?? null;
  });
  const setConversationId = (id: string | null) => {
    if (id) {
      lastConversation.set(repo, id);
    } else {
      lastConversation.delete(repo);
    }
    setConversation(id);
  };
  const conversations = useConversations(repo);
  const conversation = useConversation(conversationId);
  const ask = useAsk();
  const remove = useDeleteConversation(repo);
  const selected = useViewStore((state) => {
    return state.selected;
  });
  const end = useRef<HTMLDivElement>(null);

  const messages = conversation.data?.messages ?? [];
  const asking = ask.isPending ? ask.variables : undefined;

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, asking]);

  const startNew = () => {
    setConversationId(null);
    ask.reset();
  };

  const send = async (question: string, mentionedNodeIds: string[]) => {
    try {
      const result = await ask.mutateAsync({
        repo_full_name: repo,
        question,
        conversation_id: conversationId ?? undefined,
        focused_node_id: selected ?? undefined,
        mentioned_node_ids: mentionedNodeIds,
        // what's open on the canvas is what the user is looking at
        open_folder_ids: useViewStore.getState().expanded.toReversed().slice(0, MAX_OPEN_FOLDERS),
      });
      setConversationId(result.conversation.id);
    } catch (error) {
      // expired or deleted elsewhere: the next question starts a new one
      if (error instanceof ApiError && error.errorCode === CONVERSATION_NOT_FOUND) {
        setConversationId(null);
      }
      throw error;
    }
  };

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
                        return setConversationId(item.id);
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

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
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
                return <ChatMessage key={message.id} message={message} repo={repo} />;
              })}
              {asking && (
                <>
                  <li className="flex justify-end">
                    <p className="max-w-5/6 rounded-lg bg-fill-active px-3 py-2 text-sm break-words whitespace-pre-wrap">
                      {asking.question}
                    </p>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
                    <Spinner className="size-4" /> Reading the graph…
                  </li>
                </>
              )}
            </ol>
          )}
        <div ref={end} />
      </div>

      <footer className="flex flex-col gap-2 border-t border-border p-3">
        {ask.isError && (
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
        <ChatComposer repo={repo} pending={ask.isPending} onSend={send} />
      </footer>
    </aside>
  );
}
