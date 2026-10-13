'use client';

import { useState, type FormEvent } from 'react';
import Button from '@/shared/components/button';
import { Dialog, DialogClose, DialogContent } from '@/shared/components/dialog';
import { Input } from '@/shared/components/input';
import { useCreateWorkspace } from '@/shared/workspaces/hooks';

/** Name a new workspace; creating it switches to it. */
export default function CreateWorkspaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState('');
  const create = useCreateWorkspace();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(name.trim(), {
      onSuccess: () => {
        onOpenChange(false);
        setName('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Create a workspace"
        description="A workspace holds your team's repositories and integrations. You can invite people once it exists."
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button variant="primary" type="submit" form="create-workspace" loading={create.isPending} disabled={!name.trim()}>
              Create workspace
            </Button>
          </>
        }
      >
        <form id="create-workspace" onSubmit={submit}>
          <Input aria-label="Workspace name" placeholder="Acme Inc" maxLength={60} value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </form>
      </DialogContent>
    </Dialog>
  );
}
