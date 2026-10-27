'use client';

import Button from '@/shared/components/button';
import { Dialog, DialogClose, DialogContent } from '@/shared/components/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import { useChangeStatus, useDecisions } from '@/shared/decisions/hooks';
import { type Decision, DECISION_STATUS } from '@/shared/decisions/types';
import { useState } from 'react';

/** Mark an accepted decision as replaced by another one, which then stands instead. */
export default function SupersedeDialog(
  { decision, note, onOpenChange }: {
    decision: Decision;
    /** why, from the note field beside the actions */
    note: string;
    onOpenChange: (open: boolean) => void;
  },
) {
  const decisions = useDecisions();
  const change = useChangeStatus();
  const [replacement, setReplacement] = useState('');
  const candidates = (decisions.data ?? []).filter((other) => {
    return other.id !== decision.id && other.status !== DECISION_STATUS.superseded;
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        title="Replace decision"
        description="The decision you pick stands instead; this one stays in the history."
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              loading={change.isPending}
              disabled={!replacement}
              onClick={() => {
                change.mutate(
                  {
                    id: decision.id,
                    status: DECISION_STATUS.superseded,
                    superseded_by: replacement,
                    ...(note && { note }),
                  },
                  {
                    onSuccess: () => {
                      return onOpenChange(false);
                    },
                  },
                );
              }}
            >
              Replace
            </Button>
          </>
        }
      >
        <Select value={replacement} onValueChange={setReplacement}>
          <SelectTrigger
            aria-label="Replaced by"
            placeholder="Choose the decision that replaces it"
          />
          <SelectContent>
            {candidates.map((other) => {
              return (
                <SelectItem key={other.id} value={other.id}>
                  {other.title}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </DialogContent>
    </Dialog>
  );
}
