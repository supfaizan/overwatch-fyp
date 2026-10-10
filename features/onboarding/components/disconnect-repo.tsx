'use client';

import { useState } from 'react';
import Button from '@/shared/components/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/shared/components/dialog';
import { useDisconnectRepo } from '../hooks';

export default function DisconnectRepo({ repoFullName }: { repoFullName: string }) {
  const [open, setOpen] = useState(false);
  const disconnect = useDisconnectRepo();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="tertiary">
          Disconnect
        </Button>
      </DialogTrigger>
      <DialogContent
        title={`Disconnect ${repoFullName}?`}
        description="Overwatch stops tracking it and deletes its copy of the code and its graph."
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              bg="var(--color-danger)"
              border="#9e2804"
              edge="#9e2804"
              loading={disconnect.isPending}
              onClick={() => disconnect.mutate(repoFullName, { onSuccess: () => setOpen(false) })}
            >
              Disconnect repository
            </Button>
          </>
        }
      />
    </Dialog>
  );
}
