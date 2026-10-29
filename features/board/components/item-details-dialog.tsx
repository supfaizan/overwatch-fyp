'use client';

import Avatar from '@/shared/components/avatar';
import Button from '@/shared/components/button';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import { DatePicker } from '@/shared/components/date-picker';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import { Input, TextArea } from '@/shared/components/input';
import Markdown from '@/shared/components/markdown';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import RelatedDecisions from '@/shared/decisions/related-decisions';
import { EVIDENCE_KIND } from '@/shared/decisions/types';
import { cn } from '@/shared/lib/cn';
import { useWorkItemTypes } from '@/shared/work-item-types/hooks';
import { typeOf } from '@/shared/work-item-types/type-icon';
import TypeSelect from '@/shared/work-item-types/type-select';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE } from '@/shared/workspaces/types';
import { ArrowSquareOut, PencilSimple, Trash } from '@phosphor-icons/react/ssr';
import dynamic from 'next/dynamic';
import { type ReactNode, useState } from 'react';
import {
  useAddComment,
  useAllowedTypes,
  useComments,
  useDeleteComment,
  useDeleteWorkItem,
  useMoveWorkItem,
  usePeople,
  usePriorities,
  useSetItemSprint,
  useUpdateComment,
  useUpdateWorkItem,
} from '../hooks';
import {
  type Board,
  BOARD_KIND,
  type Comment,
  type LinkedItem,
  NATIVE_SOURCE,
  type Sprint,
  STATUS_CATEGORY,
  type WorkItem,
  type WorkItemChanges,
} from '../types';
import ColumnsWorkflowDialog from './columns-workflow-dialog';
import PriorityIcon from './priority-icon';
import StatusMenu from './status-menu';

// heavy, and only needed once someone edits
const RichTextEditor = dynamic(() => {
  return import('@/shared/components/rich-text-editor');
}, {
  ssr: false,
  loading: () => {
    return <Skeleton className="h-32 w-full" />;
  },
});

/** How the backend shows media embedded in a Jira description; they can't be written back from here. */
const JIRA_ATTACHMENT = '_[attachment in Jira]_';
const NONE = 'none';
const BACKLOG = 'backlog';
const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

type ItemDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WorkItem;
  board: Board;
  sprints: Sprint[];
  trackerName: string | null;
};

/** A ticket, Jira-style: what it is on the left, its details on the right; each field saves on its own. */
export default function ItemDetailsDialog(
  { open, onOpenChange, item: initial, board, sprints, trackerName }: ItemDetailsDialogProps,
) {
  // what the server last said; each change answers with the item as it now is
  const [item, setItem] = useState(initial);
  const update = useUpdateWorkItem();
  const remove = useDeleteWorkItem();
  const setSprint = useSetItemSprint();
  const move = useMoveWorkItem();
  const [viewingWorkflow, setViewingWorkflow] = useState(false);
  const isAdmin = hasRole(useCurrentWorkspace()?.role, ROLE.admin);
  const readOnly = !item.editable;
  const tracker = item.source !== NATIVE_SOURCE;

  const save = (changes: WorkItemChanges) => {
    return update.mutate({ id: item.id, ...changes }, { onSuccess: setItem });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // one height whatever it shows; each side scrolls inside it. A viewport height, as the overlay is a grid
        className="flex h-[90dvh] max-w-6xl flex-col"
        title={
          <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted">
            {item.parent?.key && <span>{item.parent.key} /</span>}
            <span>{item.key}</span>
            {item.issue_type && <Tag>{item.issue_type}</Tag>}
          </span>
        }
        description={readOnly
          ? `Read-only: reconnect ${trackerName} in Settings → Integrations to edit it here.`
          : undefined}
        // Esc inside the description editor cancels the edit rather than closing the ticket
        onEscapeKeyDown={(event) => {
          if (event.target instanceof Element && event.target.closest('[contenteditable="true"]')) {
            event.preventDefault();
          }
        }}
      >
        <div className="grid h-full gap-6 overflow-y-auto md:grid-cols-3 md:grid-rows-1 md:overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-col gap-6 md:col-span-2 md:overflow-y-auto md:pr-2">
            <TitleField
              value={item.title}
              disabled={readOnly}
              onSave={(title) => {
                return save({ title });
              }}
            />
            <DescriptionField
              item={item}
              disabled={readOnly}
              saving={update.isPending}
              onSave={(description) => {
                return save({ description });
              }}
            />
            {item.subtasks.length > 0 && <Linked title="Subtasks" items={item.subtasks} />}
            {item.links.length > 0 && <Linked title="Linked work items" items={item.links} />}
            <Comments itemId={item.id} disabled={readOnly} />
          </div>

          {/* bottom padding: the scroll area would clip the buttons' drop shadow */}
          <aside className="flex min-h-0 flex-col gap-4 pb-1.5 md:overflow-y-auto">
            <StatusMenu
              item={item}
              board={board}
              trackerName={trackerName}
              pending={move.isPending}
              onMove={(option) => {
                // the dialog shows the item the server answers with (a tracker's status name, too)
                return move.mutate(
                  {
                    boardId: board.id,
                    id: item.id,
                    move: {
                      column_id: option.columnId,
                      before_id: null,
                      after_id: null,
                      ...(option.statusId ? { status_id: option.statusId } : {}),
                    },
                    rank: Date.now() / 1000,
                  },
                  { onSuccess: setItem },
                );
              }}
              onViewWorkflow={isAdmin && !tracker
                ? () => {
                  return setViewingWorkflow(true);
                }
                : undefined}
            />
            {viewingWorkflow && (
              <ColumnsWorkflowDialog
                board={board}
                initialTab="workflow"
                onClose={() => {
                  return setViewingWorkflow(false);
                }}
              />
            )}

            <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold">Details</h3>
              <Detail label="Type">
                <TypeField
                  item={item}
                  disabled={readOnly}
                  onSave={(type_id) => {
                    return save({ type_id });
                  }}
                />
              </Detail>
              <Detail label="Assignee">
                <AssigneeField
                  item={item}
                  board={board}
                  disabled={readOnly}
                  onSave={(assignee_id) => {
                    return save({ assignee_id });
                  }}
                />
              </Detail>
              {board.kind === BOARD_KIND.scrum && (
                <Detail label="Sprint">
                  <Select
                    value={item.sprint_id ?? BACKLOG}
                    disabled={readOnly}
                    onValueChange={(value) => {
                      return setSprint.mutate(
                        {
                          boardId: board.id,
                          item,
                          to: value === BACKLOG ? null : value,
                          before_id: null,
                          after_id: null,
                          rank: Date.now() / 1000,
                        },
                        { onSuccess: setItem },
                      );
                    }}
                  >
                    <SelectTrigger aria-label="Sprint" size="sm" />
                    <SelectContent>
                      {sprints.map((sprint) => {
                        return (
                          <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
                        );
                      })}
                      <SelectItem value={BACKLOG}>Backlog</SelectItem>
                    </SelectContent>
                  </Select>
                </Detail>
              )}
              <Detail label="Priority">
                <PriorityField
                  boardId={board.id}
                  value={item.priority}
                  disabled={readOnly}
                  onSave={(priority) => {
                    return save({ priority });
                  }}
                />
              </Detail>
              <Detail label="Labels">
                <LabelsField
                  value={item.labels}
                  disabled={readOnly}
                  onSave={(labels) => {
                    return save({ labels });
                  }}
                />
              </Detail>
              <Detail label="Story points">
                <Input
                  key={item.story_points ?? ''}
                  size="sm"
                  type="number"
                  min={0}
                  step="0.5"
                  aria-label="Story points"
                  defaultValue={item.story_points ?? ''}
                  disabled={readOnly}
                  onBlur={(e) => {
                    const value = e.target.value === '' ? null : Number(e.target.value);
                    if (value !== item.story_points) {
                      save({ story_points: value });
                    }
                  }}
                />
              </Detail>
              <Detail label="Due date">
                <DatePicker
                  size="sm"
                  aria-label="Due date"
                  placeholder="None"
                  value={item.due_date}
                  disabled={readOnly}
                  onChange={(value) => {
                    if (value !== item.due_date) {
                      save({ due_date: value });
                    }
                  }}
                />
              </Detail>
              {item.parent?.key && (
                <Detail label="Parent">
                  <Tooltip content={`${item.parent.key} ${item.parent.title ?? ''}`.trim()}>
                    <Tag className="max-w-full">
                      <span className="shrink-0">{item.parent.key}</span>
                      {item.parent.title && (
                        <span className="min-w-0 truncate font-normal">{item.parent.title}</span>
                      )}
                    </Tag>
                  </Tooltip>
                </Detail>
              )}
              {item.reporter?.name && (
                <Detail label="Reporter">
                  <span className="flex items-center gap-2 text-sm">
                    <Avatar name={item.reporter.name} size="sm" /> {item.reporter.name}
                  </span>
                </Detail>
              )}
            </section>

            <dl className="grid grid-cols-2 gap-1 px-1 text-xs text-muted">
              <dt>Created</dt>
              <dd>{dateTime.format(new Date(item.created_at))}</dd>
              <dt>Updated</dt>
              <dd>{dateTime.format(new Date(item.updated_at))}</dd>
            </dl>

            <RelatedDecisions
              source={{
                kind: EVIDENCE_KIND.workItem,
                refId: item.id,
                title: `${item.key} ${item.title}`,
              }}
              readQuote={() => {
                return window.getSelection()?.toString() ?? '';
              }}
            />
            <div className="flex flex-wrap gap-2">
              {tracker && item.external_url && (
                <Button size="sm" asChild>
                  <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                    <ArrowSquareOut /> Open in {trackerName}
                  </a>
                </Button>
              )}
              {!readOnly && (!tracker || isAdmin) && (
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="tertiary" className="text-danger">
                      <Trash /> Delete
                    </Button>
                  }
                  title={`Delete ${item.key}?`}
                  description={tracker
                    ? `This also deletes ${item.key} in ${trackerName}. It can't be undone.`
                    : "This can't be undone."}
                  confirmLabel="Delete"
                  pending={remove.isPending}
                  onConfirm={(done) => {
                    return remove.mutate(item.id, {
                      onSuccess: () => {
                        done();
                        onOpenChange(false);
                      },
                    });
                  }}
                />
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-5 items-center gap-2">
      <span className="col-span-2 text-xs text-muted">{label}</span>
      <div className="col-span-3 min-w-0">{children}</div>
    </div>
  );
}

function TitleField(
  { value, disabled, onSave }: {
    value: string;
    disabled: boolean;
    onSave: (title: string) => void;
  },
) {
  const [draft, setDraft] = useState(value);
  const commit = () => {
    const title = draft.trim();
    if (title && title !== value) {
      onSave(title);
    } else {
      setDraft(value);
    }
  };
  return (
    <input
      aria-label="Title"
      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-xl font-semibold outline-none hover:border-border focus:border-primary disabled:hover:border-transparent"
      value={draft}
      maxLength={255}
      disabled={disabled}
      onChange={(e) => {
        return setDraft(e.target.value);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        return e.key === 'Enter' && e.currentTarget.blur();
      }}
    />
  );
}

function DescriptionField(
  { item, disabled, saving, onSave }: {
    item: WorkItem;
    disabled: boolean;
    saving: boolean;
    onSave: (description: string | null) => void;
  },
) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.description ?? '');
  const shown = item.description_md ?? item.description;
  const startEdit = () => {
    // the Markdown, so editing starts from the formatting as shown
    setDraft(shown ?? '');
    setEditing(true);
  };
  const saveDraft = () => {
    onSave(draft.trim() || null);
    setEditing(false);
  };

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">Description</h3>
        {!disabled && !editing && (
          <Button size="sm" variant="tertiary" onClick={startEdit}>
            <PencilSimple /> Edit
          </Button>
        )}
      </header>
      {editing
        ? (
          <>
            <RichTextEditor
              aria-label="Description"
              className="max-h-[45dvh] shrink-0"
              value={draft}
              onChange={setDraft}
              onSubmit={saveDraft}
              onCancel={() => {
                return setEditing(false);
              }}
              placeholder="Describe the work… Markdown shortcuts work."
              autoFocus
            />
            {draft.includes(JIRA_ATTACHMENT) && (
              <p className="text-xs text-warning-strong">
                Saving removes the attachments embedded in this description; they stay attached to
                the ticket in Jira.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                onClick={() => {
                  return setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" variant="primary" loading={saving} onClick={saveDraft}>Save</Button>
            </div>
          </>
        )
        : shown
        ? (
          // long descriptions scroll here, leaving room for the comments; a click on the text edits it
          <div
            className={cn(
              'max-h-[45dvh] shrink-0 overflow-y-auto rounded-md',
              !disabled && 'cursor-text hover:bg-fill-hover',
            )}
            onClick={(event) => {
              const selecting = Boolean(window.getSelection()?.toString());
              const onLink = event.target instanceof Element && event.target.closest('a');
              if (!disabled && !selecting && !onLink) {
                startEdit();
              }
            }}
          >
            <Markdown>{shown}</Markdown>
          </div>
        )
        : disabled
        ? <p className="text-sm text-muted">No description.</p>
        : (
          <button
            type="button"
            className="rounded-md px-2 py-3 text-left text-sm text-muted hover:bg-fill-hover hover:text-foreground"
            onClick={startEdit}
          >
            Add a description…
          </button>
        )}
    </section>
  );
}

function Linked({ title, items }: { title: string; items: LinkedItem[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="flex flex-col gap-1">
        {items.map((linked) => {
          return (
            <li
              key={`${linked.type}-${linked.key}`}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              {linked.type && (
                <span className="w-28 shrink-0 text-xs text-muted">{linked.type}</span>
              )}
              <span
                className={cn(
                  'w-20 shrink-0 font-medium',
                  linked.status_category === STATUS_CATEGORY.done && 'line-through',
                )}
              >
                {linked.key}
              </span>
              <span className="min-w-0 flex-1 truncate">{linked.title}</span>
              {linked.status && <Tag>{linked.status}</Tag>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AssigneeField(
  { item, board, disabled, onSave }: {
    item: WorkItem;
    board: Board;
    disabled: boolean;
    onSave: (id: string | null) => void;
  },
) {
  const people = usePeople(board.source === NATIVE_SOURCE ? null : board.source, board.target_key);
  return (
    <Select
      value={item.assignee?.id ?? NONE}
      disabled={disabled}
      onValueChange={(value) => {
        return onSave(value === NONE ? null : value);
      }}
    >
      <SelectTrigger
        aria-label="Assignee"
        size="sm"
        placeholder={people.isPending ? 'Loading people…' : 'Unassigned'}
      />
      <SelectContent>
        <SelectItem value={NONE}>Unassigned</SelectItem>
        {people.data?.map((person) => {
          return <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>;
        })}
        {/* keep the current assignee selectable while the list loads */}
        {item.assignee?.id && !people.data?.some((p) => {
          return p.id === item.assignee?.id;
        }) && (
          <SelectItem value={item.assignee.id}>{item.assignee.name ?? item.assignee.id}</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

/** The item's type; a tracker item only to the types its tracker can change it to in place. */
function TypeField(
  { item, disabled, onSave }: {
    item: WorkItem;
    disabled: boolean;
    onSave: (typeId: string) => void;
  },
) {
  const types = useWorkItemTypes();
  const allowed = useAllowedTypes(item, !disabled);
  const current = typeOf(types.data, item.type_id)?.id;
  return (
    <TypeSelect
      size="sm"
      value={current}
      allowed={allowed.data?.type_ids ?? null}
      disabled={disabled}
      onChange={(typeId) => {
        return typeId !== current && onSave(typeId);
      }}
    />
  );
}

function PriorityField(
  { boardId, value, disabled, onSave }: {
    boardId: string;
    value: string | null;
    disabled: boolean;
    onSave: (priority: string | null) => void;
  },
) {
  const priorities = usePriorities(boardId);
  return (
    <Select
      value={value ?? NONE}
      disabled={disabled}
      onValueChange={(next) => {
        return onSave(next === NONE ? null : next);
      }}
    >
      <SelectTrigger aria-label="Priority" size="sm" />
      <SelectContent>
        <SelectItem value={NONE}>None</SelectItem>
        {[
          ...(priorities.data ?? []),
          ...(value && !priorities.data?.includes(value) ? [value] : []),
        ].map((priority) => {
          return (
            <SelectItem key={priority} value={priority}>
              {/* the trigger repeats an item's content, so the selected priority shows its arrow too */}
              <span className="flex items-center gap-2">
                <PriorityIcon priority={priority} /> {priority}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/** Labels as words separated by commas or spaces, as Jira takes them (no spaces inside one). */
function LabelsField(
  { value, disabled, onSave }: {
    value: string[];
    disabled: boolean;
    onSave: (labels: string[]) => void;
  },
) {
  return (
    <Input
      key={value.join(',')}
      size="sm"
      aria-label="Labels"
      placeholder="Add labels"
      defaultValue={value.join(', ')}
      disabled={disabled}
      onBlur={(e) => {
        const labels = [...new Set(e.target.value.split(/[\s,]+/).filter(Boolean))];
        if (labels.join(',') !== value.join(',')) {
          onSave(labels);
        }
      }}
    />
  );
}

function Comments({ itemId, disabled }: { itemId: string; disabled: boolean }) {
  const comments = useComments(itemId);
  const add = useAddComment();
  const [draft, setDraft] = useState('');

  return (
    <section className="flex flex-col gap-3 pb-20">
      <h3 className="text-sm font-semibold">Comments</h3>
      {!disabled && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate({ itemId, body: draft.trim() }, {
              onSuccess: () => {
                return setDraft('');
              },
            });
          }}
        >
          <TextArea
            aria-label="Add a comment"
            placeholder="Add a comment… Markdown works."
            rows={3}
            maxLength={20_000}
            value={draft}
            onChange={(e) => {
              return setDraft(e.target.value);
            }}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="primary"
              type="submit"
              loading={add.isPending}
              disabled={!draft.trim()}
            >
              Comment
            </Button>
          </div>
        </form>
      )}
      {comments.isPending
        ? <Skeleton className="h-16 w-full" />
        : comments.isError
        ? <p className="text-sm text-danger">{comments.error.message}</p>
        : comments.data.length === 0
        ? <p className="text-sm text-muted">No comments yet.</p>
        : (
          <ol className="flex flex-col gap-4">
            {[...comments.data].reverse().map((comment) => {
              return <CommentRow key={comment.id} itemId={itemId} comment={comment} />;
            })}
          </ol>
        )}
    </section>
  );
}

function CommentRow({ itemId, comment }: { itemId: string; comment: Comment }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const update = useUpdateComment();
  const remove = useDeleteComment();
  const name = comment.author.name ?? 'Someone';

  return (
    <li className="flex gap-3">
      <Avatar name={name} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="font-medium text-foreground">{name}</span>
          {comment.created_at && <span>{dateTime.format(new Date(comment.created_at))}</span>}
          <span className="flex-1" />
          {comment.editable && !editing && (
            <Button
              size="sm"
              variant="tertiary"
              onClick={() => {
                setDraft(comment.body);
                setEditing(true);
              }}
            >
              Edit
            </Button>
          )}
          {comment.deletable && (
            <ConfirmDialog
              trigger={<Button size="sm" variant="tertiary" className="text-danger">Delete</Button>}
              title="Delete this comment?"
              description="This can't be undone."
              confirmLabel="Delete"
              pending={remove.isPending}
              onConfirm={(done) => {
                return remove.mutate({ itemId, id: comment.id }, { onSuccess: done });
              }}
            />
          )}
        </div>
        {editing
          ? (
            <div className="flex flex-col gap-2">
              <TextArea
                aria-label="Edit comment"
                rows={3}
                maxLength={20_000}
                value={draft}
                onChange={(e) => {
                  return setDraft(e.target.value);
                }}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    return setEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  loading={update.isPending}
                  disabled={!draft.trim()}
                  onClick={() => {
                    return update.mutate({ itemId, id: comment.id, body: draft.trim() }, {
                      onSuccess: () => {
                        return setEditing(false);
                      },
                    });
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          )
          : <Markdown>{comment.body}</Markdown>}
      </div>
    </li>
  );
}
