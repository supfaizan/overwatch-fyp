'use client';

import Avatar from '@/shared/components/avatar';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Markdown from '@/shared/components/markdown';
import Skeleton from '@/shared/components/skeleton';
import type { RealtimeStatus } from '@/shared/realtime/client';
import { useRealtimeStatus } from '@/shared/realtime/hooks';
import { END_REASON } from '@/shared/realtime/protocol';
import { displayName } from '@/shared/session/lib';
import { useSession } from '@/shared/session/store';
import { useCurrentWorkspace, useWorkspaceMembers } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE } from '@/shared/workspaces/types';
import { ArrowClockwise, ArrowDown } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useDiscussion, useLiveDiscussion, useSendMessage, useTypingSignal } from '../hooks';
import { allMessages, canDelete, canEdit, threadRows, typingLabel } from '../lib';
import type { DiscussionMessage } from '../types';
import { AttachmentList } from './attachments';
import Composer from './composer';
import MessageBubble, { BubbleFrame } from './message-bubble';

/** Shown in the header while live updates aren't flowing; nothing while they are. */
const CONNECTION_LABELS: Record<RealtimeStatus, string | null> = {
  idle: null,
  connecting: null,
  open: null,
  reconnecting: 'Reconnecting…',
  offline: 'Offline',
};

/** Who's typing, with their avatars, just above the composer; keeps its height so nothing jumps. */
function TypingLine(
  { people }: { people: { id: string; name: string; avatarUrl: string | null }[] },
) {
  return (
    <div aria-live="polite" className="flex h-6 items-center gap-2 px-4 text-xs text-muted">
      {people.length > 0 && (
        <>
          <span className="flex -space-x-1.5">
            {people.slice(0, 3).map((person) => {
              return (
                <Avatar
                  key={person.id}
                  src={person.avatarUrl}
                  name={person.name}
                  size="sm"
                  className="size-4 text-[8px] ring-2 ring-surface"
                />
              );
            })}
          </span>
          {typingLabel(people.map((person) => {
            return person.name;
          }))}
        </>
      )}
    </div>
  );
}

/** How close to the bottom (px) still counts as reading the latest messages. */
const NEAR_BOTTOM = 80;

/** A decision's discussion: everyone in the workspace reads it and writes in it. */
export default function DiscussionPane({ decisionId }: { decisionId: string }) {
  const discussion = useDiscussion(decisionId);
  const { pending, send, retry, discard } = useSendMessage(decisionId);
  const userId = useSession((state) => {
    return state.user?.id;
  });
  const { typists, ended } = useLiveDiscussion(decisionId, userId);
  const typing = useTypingSignal(decisionId);
  const connection = useRealtimeStatus();
  const router = useRouter();
  const isAdmin = hasRole(useCurrentWorkspace()?.role, ROLE.admin);
  const members = useWorkspaceMembers();

  const messages = allMessages(discussion.data);
  // a sent message the thread already holds isn't also shown as sending
  const sentIds = new Set(messages.map((message) => {
    return message.client_id;
  }));
  const unsent = pending.filter((item) => {
    return !sentIds.has(item.clientId);
  });
  const me = members.data?.find((member) => {
    return member.user_id === userId;
  });
  const nameOf = (memberId: string) => {
    const member = members.data?.find((candidate) => {
      return candidate.user_id === memberId;
    });
    return member ? displayName(member) : 'Former member';
  };
  const person = (message: DiscussionMessage) => {
    const member = members.data?.find((candidate) => {
      return candidate.user_id === message.author.id;
    });
    return {
      name: member ? displayName(member) : `${message.author.name ?? 'Someone'} (former member)`,
      avatarUrl: member?.avatar_url ?? null,
    };
  };

  // scroll: follow new messages while reading the latest; otherwise count them on a pill
  const scroller = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  // set just before older messages load, so the view stays on what was being read
  const keepFromBottom = useRef<number | null>(null);
  const [unseen, setUnseen] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const newest = messages.at(-1);
  const oldestId = messages[0]?.id;
  const pendingCount = unsent.length;
  const lastPendingCount = useRef(0);

  const toBottom = () => {
    const element = scroller.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
    setUnseen(0);
  };

  useLayoutEffect(() => {
    const element = scroller.current;
    if (element && keepFromBottom.current !== null) {
      element.scrollTop = element.scrollHeight - keepFromBottom.current;
      keepFromBottom.current = null;
    }
  }, [oldestId]);

  useLayoutEffect(() => {
    const sending = pendingCount > lastPendingCount.current;
    lastPendingCount.current = pendingCount;
    if (!newest && !sending) {
      return;
    }
    const mine = newest?.author.id === userId;
    if (nearBottom.current || mine || sending) {
      toBottom();
    } else {
      setUnseen((count) => {
        return count + 1;
      });
    }
    if (newest && !mine) {
      setAnnouncement(`${person(newest).name}: ${newest.body.slice(0, 200)}`);
    }
    // only a new newest message or a new send moves the view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newest?.id, pendingCount]);

  // the decision was deleted while open (dismissed as not a decision): back to the list
  useEffect(() => {
    if (ended === END_REASON.gone) {
      toast.info('This decision was removed.');
      router.push('/decisions');
    }
  }, [ended, router]);

  const loadOlder = () => {
    const element = scroller.current;
    if (element) {
      keepFromBottom.current = element.scrollHeight - element.scrollTop;
    }
    void discussion.fetchNextPage();
  };

  return (
    <section
      aria-label="Discussion"
      className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-surface"
    >
      <header className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold">Discussion</h2>
          <p className="text-xs text-muted">Everyone in this workspace can read and reply.</p>
        </div>
        {CONNECTION_LABELS[connection] && (
          <span role="status" className="flex items-center gap-1 text-xs text-muted">
            <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-warning" />
            {CONNECTION_LABELS[connection]}
          </span>
        )}
      </header>
      {ended && ended !== END_REASON.gone && (
        <div className="px-4 pt-3">
          <Banner type="error">You no longer have access to this discussion.</Banner>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          role="log"
          aria-label="Messages"
          className="h-full overflow-y-auto px-4 pb-4"
          onScroll={(event) => {
            const element = event.currentTarget;
            nearBottom.current =
              element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_BOTTOM;
            if (nearBottom.current) {
              setUnseen(0);
            }
          }}
        >
          {discussion.isPending && (
            <div className="flex flex-col gap-3 pt-4">
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="ml-auto h-10 w-1/2" />
              <Skeleton className="h-12 w-3/5" />
            </div>
          )}
          {discussion.isError && (
            <div className="pt-4">
              <Banner type="error">{discussion.error.message}</Banner>
            </div>
          )}
          {discussion.hasNextPage && (
            <div className="flex justify-center pt-3">
              <Button
                size="sm"
                variant="tertiary"
                loading={discussion.isFetchingNextPage}
                onClick={loadOlder}
              >
                Load earlier messages
              </Button>
            </div>
          )}
          {discussion.isSuccess && messages.length === 0 && unsent.length === 0 && (
            <p className="pt-10 text-center text-sm text-muted">
              No messages yet. Questions and context here are visible to everyone in the workspace.
            </p>
          )}
          {threadRows(messages, new Date()).map((row) => {
            if (row.kind === 'day') {
              return (
                <div key={row.key} className="flex items-center gap-3 pt-4 text-xs text-muted">
                  <span className="h-px flex-1 bg-border" />
                  {row.label}
                  <span className="h-px flex-1 bg-border" />
                </div>
              );
            }
            const { message } = row;
            const { name, avatarUrl } = person(message);
            return (
              <MessageBubble
                key={row.key}
                message={message}
                continued={row.continued}
                mine={message.author.id === userId}
                name={name}
                avatarUrl={avatarUrl}
                canEdit={canEdit(message, userId)}
                canDelete={canDelete(message, userId, isAdmin)}
                userId={userId}
                nameOf={nameOf}
              />
            );
          })}
          {unsent.map((item) => {
            const failed = item.status === 'failed';
            return (
              <BubbleFrame
                key={item.clientId}
                mine
                continued={false}
                name={me ? displayName(me) : 'You'}
                avatarUrl={me?.avatar_url ?? null}
                at={item.createdAt}
                className={failed ? 'border border-danger/40' : 'opacity-60'}
                footer={failed
                  ? (
                    <span className="flex items-center gap-1 px-1 text-xs text-danger">
                      Not sent.
                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => {
                          return retry(item);
                        }}
                      >
                        <ArrowClockwise aria-hidden /> Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => {
                          return discard(item.clientId);
                        }}
                      >
                        Discard
                      </Button>
                    </span>
                  )
                  : <span className="px-1 text-xs text-muted">Sending…</span>}
              >
                <div className="flex flex-col gap-2">
                  {item.body && <Markdown>{item.body}</Markdown>}
                  {item.attachments.length > 0 && <AttachmentList attachments={item.attachments} />}
                </div>
              </BubbleFrame>
            );
          })}
        </div>
        {unseen > 0 && (
          <Button
            size="sm"
            variant="primary"
            className="absolute bottom-3 left-1/2 -translate-x-1/2"
            onClick={toBottom}
          >
            <ArrowDown aria-hidden /> {unseen} new {unseen === 1 ? 'message' : 'messages'}
          </Button>
        )}
      </div>
      {/* others' new messages read out; loading older ones isn't */}
      <p aria-live="polite" className="sr-only">{announcement}</p>
      <TypingLine
        people={typists.map((typist) => {
          const member = members.data?.find((candidate) => {
            return candidate.user_id === typist.id;
          });
          return {
            id: typist.id,
            name: member ? displayName(member) : typist.name,
            avatarUrl: member?.avatar_url ?? null,
          };
        })}
      />
      {!ended && (
        <Composer
          decisionId={decisionId}
          onSend={send}
          onType={typing.typed}
          onStopTyping={typing.stop}
        />
      )}
    </section>
  );
}
