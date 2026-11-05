'use client';

import Button from '@/shared/components/button';
import { DatePicker } from '@/shared/components/date-picker';
import { Dialog, DialogClose, DialogContent } from '@/shared/components/dialog';
import { Input, TextArea } from '@/shared/components/input';
import { type FormEvent, useState } from 'react';
import { useCreateSprint } from '../hooks';

type SprintDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  trackerName: string | null;
};

/** Plan a new sprint; on a tracker board it's created there too. */
export default function SprintDialog(
  { open, onOpenChange, boardId, trackerName }: SprintDialogProps,
) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const create = useCreateSprint();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      {
        boardId,
        ...(name.trim() && { name: name.trim() }),
        ...(goal.trim() && { goal: goal.trim() }),
        ...(start && { start_at: new Date(start).toISOString() }),
        ...(end && { end_at: new Date(end).toISOString() }),
      },
      {
        onSuccess: () => {
          return onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="New sprint"
        description={trackerName ? `Created in ${trackerName} as well.` : undefined}
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              type="submit"
              form="sprint"
              loading={create.isPending}
              disabled={Boolean(start && end && end < start)}
            >
              Create
            </Button>
          </>
        }
      >
        <form id="sprint" onSubmit={submit} className="flex flex-col gap-3">
          <Input
            aria-label="Name"
            placeholder="Name (optional: numbered after the board)"
            maxLength={120}
            value={name}
            onChange={(e) => {
              return setName(e.target.value);
            }}
            autoFocus
          />
          <TextArea
            aria-label="Goal"
            placeholder="Goal (optional)"
            rows={3}
            maxLength={2000}
            value={goal}
            onChange={(e) => {
              return setGoal(e.target.value);
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted">
              Starts
              <DatePicker
                value={start || null}
                onChange={(value) => {
                  return setStart(value ?? '');
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Ends
              <DatePicker
                value={end || null}
                min={start || undefined}
                onChange={(value) => {
                  return setEnd(value ?? '');
                }}
              />
            </label>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
