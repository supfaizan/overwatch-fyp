'use client';

import { useState, type ReactNode } from 'react';
import Button from '@/shared/components/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/shared/components/dialog';

/** A trigger button plus the dialog that confirms a disconnect before running it. */
export default function ConfirmDisconnect({ trigger, title, description, confirmLabel, pending, onConfirm }: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  /** Run the disconnect; call `close` once it succeeds. */
  onConfirm: (close: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={title}
        description={description}
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button variant="danger" loading={pending} onClick={() => onConfirm(() => setOpen(false))}>
              {confirmLabel}
            </Button>
          </>
        }
      />
    </Dialog>
  );
}
