'use client';

import Button from '@/shared/components/button';
import { Dialog, DialogClose, DialogContent } from '@/shared/components/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import { useState } from 'react';
import { useCompleteSprint } from '../hooks';
import { BACKLOG_SECTION } from '../lib';
import type { Sprint } from '../types';

type CompleteSprintDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: Sprint;
  /** the board's other open sprints, where unfinished items can go instead of the backlog */
  others: Sprint[];
  unfinished: number;
};

/** Close the active sprint, choosing where its unfinished items go. */
export default function CompleteSprintDialog(
  { open, onOpenChange, sprint, others, unfinished }: CompleteSprintDialogProps,
) {
  const [destination, setDestination] = useState(others[0]?.id ?? BACKLOG_SECTION);
  const complete = useCompleteSprint();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Complete ${sprint.name}?`}
        description={unfinished
          ? `${unfinished} unfinished ${
            unfinished === 1 ? 'item moves' : 'items move'
          } on; finished work stays in this sprint.`
          : 'Everything in it is done.'}
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              loading={complete.isPending}
              onClick={() => {
                return complete.mutate(
                  {
                    id: sprint.id,
                    moveOpenTo: destination === BACKLOG_SECTION ? null : destination,
                  },
                  {
                    onSuccess: () => {
                      return onOpenChange(false);
                    },
                  },
                );
              }}
            >
              Complete sprint
            </Button>
          </>
        }
      >
        {unfinished > 0 && (
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger aria-label="Move unfinished items to" />
            <SelectContent>
              {others.map((other) => {
                return <SelectItem key={other.id} value={other.id}>{other.name}</SelectItem>;
              })}
              <SelectItem value={BACKLOG_SECTION}>Backlog</SelectItem>
            </SelectContent>
          </Select>
        )}
      </DialogContent>
    </Dialog>
  );
}
