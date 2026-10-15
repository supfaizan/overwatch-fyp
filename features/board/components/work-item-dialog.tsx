'use client';

import Button from '@/shared/components/button';
import { Dialog, DialogClose, DialogContent } from '@/shared/components/dialog';
import { Input, TextArea } from '@/shared/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import { useWorkItemTypes } from '@/shared/work-item-types/hooks';
import { typeOf } from '@/shared/work-item-types/type-icon';
import TypeSelect from '@/shared/work-item-types/type-select';
import { type FormEvent, useState } from 'react';
import { useCreateWorkItem, usePeople } from '../hooks';
import { type Board, NATIVE_SOURCE } from '../types';

const UNASSIGNED = 'unassigned';

type WorkItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The board it's created on. */
  board: Board;
  /** The tracker's display name; null on the Overwatch board. */
  trackerName: string | null;
  /** The sprint a new item goes into; null for the backlog (or a board without sprints). */
  sprintId?: string | null;
};

/** Create a board item; on a tracker's board it's created in the tracker too. Editing is the ticket view's. */
export default function WorkItemDialog(
  { open, onOpenChange, board, trackerName, sprintId = null }: WorkItemDialogProps,
) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState(UNASSIGNED);
  const [columnId, setColumnId] = useState(board.columns[0]?.id ?? '');
  const types = useWorkItemTypes();
  const [typeId, setTypeId] = useState<string | undefined>(undefined);
  const chosenType = typeId ?? typeOf(types.data, null)?.id;
  const people = usePeople(board.source === NATIVE_SOURCE ? null : board.source, board.target_key);
  const create = useCreateWorkItem();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        assignee_id: assignee === UNASSIGNED ? null : assignee,
        board_id: board.id,
        column_id: columnId,
        sprint_id: sprintId,
        type_id: chosenType ?? null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="New item"
        description={trackerName ? `Saved to ${trackerName} as well.` : undefined}
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              type="submit"
              form="work-item"
              loading={create.isPending}
              disabled={!title.trim()}
            >
              Create
            </Button>
          </>
        }
      >
        <form id="work-item" onSubmit={submit} className="flex flex-col gap-3">
          <Input
            aria-label="Title"
            placeholder="What needs doing?"
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <TextArea
            aria-label="Description"
            placeholder="Details (optional, Markdown works)"
            rows={5}
            maxLength={20_000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <TypeSelect value={chosenType} onChange={setTypeId} />
            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger aria-label="Column" />
              <SelectContent>
                {board.columns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>{column.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger
                aria-label="Assignee"
                placeholder={people.isPending ? 'Loading people…' : 'Assignee'}
              />
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {people.data?.map((person) => (
                  <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
