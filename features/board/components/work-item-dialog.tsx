'use client';

import { useState, type FormEvent } from 'react';
import Button from '@/shared/components/button';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import { Dialog, DialogClose, DialogContent } from '@/shared/components/dialog';
import { Input, TextArea } from '@/shared/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { CONNECTION_STATUS } from '@/shared/connections/constants';
import { ROLE } from '@/shared/workspaces/types';
import { useCreateWorkItem, useDeleteWorkItem, usePeople, useUpdateWorkItem } from '../hooks';
import { COLUMNS } from '../lib';
import { NATIVE_SOURCE, STATUS_CATEGORY, type StatusCategory, type Tracker, type WorkItem, type WorkItemFields } from '../types';

const UNASSIGNED = 'unassigned';

type WorkItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The item to edit; omitted to create one. */
  item?: WorkItem;
  trackers: Tracker[];
};

/** Where a new item can go: Overwatch itself, or a synced project of a tracker we can write to. */
function destinations(trackers: Tracker[]) {
  return trackers
    .filter((tracker) => tracker.status === CONNECTION_STATUS.active && tracker.can_write)
    .flatMap((tracker) =>
      tracker.targets.map((target) => ({ value: `${tracker.provider}:${target.key}`, label: `${tracker.name} · ${target.name ?? target.key}` })),
    );
}

/** Create a board item, or edit one; edits to a tracker's item are saved in the tracker. */
export default function WorkItemDialog({ open, onOpenChange, item, trackers }: WorkItemDialogProps) {
  const targets = destinations(trackers);
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [assignee, setAssignee] = useState(item?.assignee?.id ?? UNASSIGNED);
  const [category, setCategory] = useState<StatusCategory>(item?.status_category ?? STATUS_CATEGORY.todo);
  const [destination, setDestination] = useState(targets[0]?.value ?? NATIVE_SOURCE);

  const [provider, targetKey] = item
    ? item.source === NATIVE_SOURCE ? [null, null] : [item.source, item.target_key]
    : destination === NATIVE_SOURCE ? [null, null] : destination.split(':');
  const people = usePeople(provider, targetKey);
  const create = useCreateWorkItem();
  const update = useUpdateWorkItem();
  const remove = useDeleteWorkItem();
  const close = () => onOpenChange(false);

  const fields: WorkItemFields = {
    title: title.trim(),
    description: description.trim() || null,
    assignee_id: assignee === UNASSIGNED ? null : assignee,
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!item) {
      create.mutate({ ...fields, status_category: category, provider, target_key: targetKey }, { onSuccess: close });
      return;
    }
    // only what changed, so an untouched Jira description keeps its formatting
    const changed: Partial<WorkItemFields> = {};
    if (fields.title !== item.title) changed.title = fields.title;
    if (fields.description !== (item.description || null)) changed.description = fields.description;
    if (fields.assignee_id !== (item.assignee?.id ?? null)) changed.assignee_id = fields.assignee_id;
    if (Object.keys(changed).length === 0) return close();
    update.mutate({ id: item.id, ...changed }, { onSuccess: close });
  };

  const readOnly = item ? !item.editable : false;
  // a tracker item is deleted in the tracker too, so only admins can (the API enforces it)
  const isAdmin = hasRole(useCurrentWorkspace()?.role, ROLE.admin);
  const trackerName = provider && (trackers.find((t) => t.provider === provider)?.name ?? provider);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={item ? item.key : 'New item'}
        description={
          readOnly
            ? `Read-only: reconnect ${trackerName} in Settings → Integrations to edit it here.`
            : trackerName
              ? `Saved to ${trackerName} as well.`
              : undefined
        }
        footer={
          <>
            {item && !readOnly && (item.source === NATIVE_SOURCE || isAdmin) && (
              <ConfirmDialog
                trigger={<Button variant="tertiary" className="mr-auto text-danger">Delete</Button>}
                title={`Delete ${item.key}?`}
                description={trackerName ? `This also deletes ${item.key} in ${trackerName}. It can't be undone.` : "This can't be undone."}
                confirmLabel="Delete"
                pending={remove.isPending}
                onConfirm={(done) => remove.mutate(item.id, { onSuccess: () => { done(); close(); } })}
              />
            )}
            <DialogClose asChild>
              <Button>{readOnly ? 'Close' : 'Cancel'}</Button>
            </DialogClose>
            {!readOnly && (
              <Button variant="primary" type="submit" form="work-item" loading={create.isPending || update.isPending} disabled={!fields.title}>
                {item ? 'Save' : 'Create'}
              </Button>
            )}
          </>
        }
      >
        <form id="work-item" onSubmit={submit} className="flex flex-col gap-3">
          <fieldset disabled={readOnly} className="contents">
            <Input aria-label="Title" placeholder="What needs doing?" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            <TextArea aria-label="Description" placeholder="Details (optional)" rows={5} maxLength={20_000} value={description} onChange={(e) => setDescription(e.target.value)} />
            {!item && (
              <div className="grid grid-cols-2 gap-3">
                <Select value={destination} onValueChange={(value) => { setDestination(value); setAssignee(UNASSIGNED); }}>
                  <SelectTrigger aria-label="Create in" />
                  <SelectContent>
                    {targets.map((target) => (
                      <SelectItem key={target.value} value={target.value}>{target.label}</SelectItem>
                    ))}
                    <SelectItem value={NATIVE_SOURCE}>Overwatch only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={category} onValueChange={(value) => setCategory(value as StatusCategory)}>
                  <SelectTrigger aria-label="Column" />
                  <SelectContent>
                    {COLUMNS.map((column) => (
                      <SelectItem key={column.id} value={column.id}>{column.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Select value={assignee} onValueChange={setAssignee} disabled={readOnly}>
              <SelectTrigger aria-label="Assignee" placeholder={people.isPending ? 'Loading people…' : 'Assignee'} />
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {people.data?.map((person) => (
                  <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                ))}
                {/* keep the current assignee selectable while the list loads */}
                {item?.assignee?.id && !people.data?.some((p) => p.id === item.assignee?.id) && (
                  <SelectItem value={item.assignee.id}>{item.assignee.name ?? item.assignee.id}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
