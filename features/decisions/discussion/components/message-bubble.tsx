'use client';

import Avatar from '@/shared/components/avatar';
import Button from '@/shared/components/button';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import Markdown from '@/shared/components/markdown';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { PencilSimple, Trash } from '@phosphor-icons/react/ssr';
import { type ReactNode, useState } from 'react';
import { reactionSummary } from '../emoji';
import { useDeleteMessage, useEditMessage, useSetReaction } from '../hooks';
import type { DiscussionMessage } from '../types';
import { AttachmentList } from './attachments';
import { MAX_MESSAGE } from './composer';
import EmojiPicker from './emoji-picker';

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const fullFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' });

type BubbleFrameProps = {
  mine: boolean;
  /** Follows its author's last message closely: no avatar or name, and less space above. */
  continued: boolean;
  name: string;
  avatarUrl: string | null;
  at: string;
  /** Hover actions (react, edit, delete), shown above the bubble's corner. */
  actions?: ReactNode;
  /** Keep the actions showing, e.g. while a picker they opened is open. */
  actionsShown?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** A message's layout: someone else's on the left with their avatar and name, one's own on the right. */
export function BubbleFrame(
  { mine, continued, name, avatarUrl, at, actions, actionsShown, footer, children, className }:
    BubbleFrameProps,
) {
  return (
    <div
      className={cn(
        'group flex gap-2',
        mine ? 'flex-row-reverse' : 'flex-row',
        continued ? 'mt-0.5' : 'mt-3',
      )}
    >
      {!mine && (
        <div className="w-8 shrink-0">
          {!continued && <Avatar src={avatarUrl} name={name} />}
        </div>
      )}
      <div className={cn('flex max-w-[85%] min-w-0 flex-col gap-1', mine && 'items-end')}>
        {!continued && (
          <div className="flex items-baseline gap-2 px-1 text-xs">
            {!mine && <span className="font-medium">{name}</span>}
            <Tooltip content={fullFormat.format(new Date(at))}>
              <time dateTime={at} className="text-muted">{timeFormat.format(new Date(at))}</time>
            </Tooltip>
          </div>
        )}
        <div className="relative">
          <div
            className={cn(
              'rounded-lg px-3 py-2 text-sm break-words',
              mine ? 'bg-fill-active' : 'border border-border bg-surface',
              className,
            )}
          >
            {children}
          </div>
          {actions && (
            <div
              className={cn(
                'absolute -top-4 gap-0.5 rounded-md border border-border bg-surface p-0.5 shadow-chrome shadow-border group-focus-within:flex group-hover:flex',
                actionsShown ? 'flex' : 'hidden',
                mine ? 'left-0 -translate-x-1/4' : 'right-0 translate-x-1/4',
              )}
            >
              {actions}
            </div>
          )}
        </div>
        {footer}
      </div>
    </div>
  );
}

type MessageBubbleProps = {
  message: DiscussionMessage;
  continued: boolean;
  mine: boolean;
  name: string;
  avatarUrl: string | null;
  canEdit: boolean;
  canDelete: boolean;
  /** The viewer, to mark their own reactions. */
  userId: string | undefined;
  /** A member's name, for who reacted. */
  nameOf: (userId: string) => string;
};

/** A sent message: Markdown, "(edited)" once changed, and edit/delete on hover for whoever may. */
export default function MessageBubble(
  { message, continued, mine, name, avatarUrl, canEdit, canDelete, userId, nameOf }:
    MessageBubbleProps,
) {
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const edit = useEditMessage(message.decision_id);
  const remove = useDeleteMessage(message.decision_id);
  const react = useSetReaction(message.decision_id);
  const toggle = (emoji: string, on: boolean) => {
    react.mutate({ id: message.id, emoji, on });
  };

  const actions = !editing && (
    <>
      <EmojiPicker
        label="Add reaction"
        onOpenChange={setPicking}
        onPick={(emoji) => {
          return toggle(emoji, true);
        }}
      />
      {canEdit && (
        <Tooltip content="Edit">
          <Button
            size="sm"
            variant="tertiary"
            iconOnly
            aria-label="Edit message"
            onClick={() => {
              return setEditing(true);
            }}
          >
            <PencilSimple aria-hidden />
          </Button>
        </Tooltip>
      )}
      {canDelete && (
        <ConfirmDialog
          trigger={
            <Button size="sm" variant="tertiary" iconOnly aria-label="Delete message">
              <Trash aria-hidden />
            </Button>
          }
          title="Delete this message?"
          description="It's removed for everyone in the discussion. This can't be undone."
          confirmLabel="Delete"
          pending={remove.isPending}
          onConfirm={(close) => {
            remove.mutate(message.id, { onSuccess: close });
          }}
        />
      )}
    </>
  );

  return (
    <BubbleFrame
      mine={mine}
      continued={continued}
      name={name}
      avatarUrl={avatarUrl}
      at={message.created_at}
      actions={actions || undefined}
      actionsShown={picking}
      footer={(message.edited || message.reactions.length > 0) && !editing && (
        <div className={cn('flex flex-wrap items-center gap-1 px-1', mine && 'justify-end')}>
          {message.reactions.map((reaction) => {
            const reacted = Boolean(userId) && reaction.user_ids.includes(userId ?? '');
            return (
              <Tooltip
                key={reaction.emoji}
                content={`${reactionSummary(reaction.user_ids, nameOf, userId)} reacted`}
              >
                <button
                  type="button"
                  aria-pressed={reacted}
                  aria-label={`${reaction.emoji} ${reaction.user_ids.length}`}
                  disabled={react.isPending}
                  className={cn(
                    'flex h-6 items-center gap-1 rounded-full border px-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                    reacted
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-surface hover:border-border-strong',
                  )}
                  onClick={() => {
                    return toggle(reaction.emoji, !reacted);
                  }}
                >
                  <span className="text-sm leading-none">{reaction.emoji}</span>
                  {reaction.user_ids.length}
                </button>
              </Tooltip>
            );
          })}
          {message.edited && <span className="text-xs text-muted">(edited)</span>}
        </div>
      )}
    >
      {editing
        ? (
          <EditForm
            initial={message.body}
            saving={edit.isPending}
            onCancel={() => {
              return setEditing(false);
            }}
            onSave={(body) => {
              if (body === message.body) {
                setEditing(false);
                return;
              }
              edit.mutate({ id: message.id, body }, {
                onSuccess: () => {
                  return setEditing(false);
                },
              });
            }}
          />
        )
        : (
          <div className="flex flex-col gap-2">
            {message.body && <Markdown>{message.body}</Markdown>}
            {message.attachments.length > 0 && <AttachmentList attachments={message.attachments} />}
          </div>
        )}
    </BubbleFrame>
  );
}

/** Editing in place: Enter saves, Shift+Enter starts a new line, Esc cancels. */
function EditForm(
  { initial, saving, onSave, onCancel }: {
    initial: string;
    saving: boolean;
    onSave: (body: string) => void;
    onCancel: () => void;
  },
) {
  const [draft, setDraft] = useState(initial);
  const save = () => {
    const body = draft.trim();
    if (body) {
      onSave(body);
    }
  };
  return (
    <div className="flex w-72 max-w-full flex-col gap-2">
      <textarea
        aria-label="Edit message"
        autoFocus
        maxLength={MAX_MESSAGE}
        className="field-sizing-content max-h-60 min-h-9 w-full resize-none rounded-md border border-border-strong bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary"
        value={draft}
        onChange={(event) => {
          return setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onCancel();
          } else if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            save();
          }
        }}
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          variant="primary"
          loading={saving}
          disabled={!draft.trim()}
          onClick={save}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
