'use client';

import { useState, type ReactNode } from 'react';
import Button from './button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from './dialog';

type ConfirmDialogProps = {
  /** The element that opens the dialog, usually a `<Button>`. */
  trigger: ReactNode;
  title: string;
  /** What happens if the user confirms. */
  description: string;
  /** Names the action, e.g. "Disconnect", never just "OK". */
  confirmLabel: string;
  /** Shows a spinner on the confirm button while the action runs. */
  pending: boolean;
  /** Run the action; call `close` once it succeeds, so the dialog stays open on failure. */
  onConfirm: (close: () => void) => void;
};

/**
 * A trigger plus a dialog that confirms a destructive action before running it.
 * - Use it for actions that are hard to undo (disconnect, delete); skip it for reversible ones.
 * - Close only on success, so an error leaves the user where they were.
 */
export default function ConfirmDialog({ trigger, title, description, confirmLabel, pending, onConfirm }: ConfirmDialogProps) {
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
