'use client';

import Button from '@/shared/components/button';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import Tooltip from '@/shared/components/tooltip';
import { LinkBreak } from '@phosphor-icons/react/ssr';
import { useDisconnectRepo } from '../hooks';

export default function DisconnectRepo({ repoFullName }: { repoFullName: string }) {
  const disconnect = useDisconnectRepo();
  return (
    <ConfirmDialog
      trigger={
        <Tooltip content="Disconnect">
          <Button
            size="sm"
            variant="tertiary"
            iconOnly
            aria-label={`Disconnect ${repoFullName}`}
            className="hover:text-danger"
          >
            <LinkBreak />
          </Button>
        </Tooltip>
      }
      title={`Disconnect ${repoFullName}?`}
      description="Overwatch stops tracking it and deletes its copy of the code and its graph."
      confirmLabel="Disconnect repository"
      pending={disconnect.isPending}
      onConfirm={(close) => {
        return disconnect.mutate(repoFullName, { onSuccess: close });
      }}
    />
  );
}
