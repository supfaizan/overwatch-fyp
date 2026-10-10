'use client';

import Button from '@/shared/components/button';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import { useDisconnectRepo } from '../hooks';

export default function DisconnectRepo({ repoFullName }: { repoFullName: string }) {
  const disconnect = useDisconnectRepo();
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="tertiary">
          Disconnect
        </Button>
      }
      title={`Disconnect ${repoFullName}?`}
      description="Overwatch stops tracking it and deletes its copy of the code and its graph."
      confirmLabel="Disconnect repository"
      pending={disconnect.isPending}
      onConfirm={(close) => disconnect.mutate(repoFullName, { onSuccess: close })}
    />
  );
}
