'use client';

import type { ApiError } from '@/shared/api/envelope';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import Checkbox from '@/shared/components/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import { PRODUCT_NAME } from '@/shared/lib/env';
import { useCurrentWorkspace, useWorkspaces } from '@/shared/workspaces/hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { approveConnection, denyConnection, getPendingConnection } from './api';

const goTo = ({ redirect_to }: { redirect_to: string }) => {
  return window.location.assign(redirect_to);
};
const showError = (error: ApiError) => {
  return toast.error(error.message);
};

/** The consent page an AI tool sends its user to: which tool is asking, and the one workspace it may use. */
export default function ConnectTool({ requestId }: { requestId: string | null }) {
  const pending = useQuery({
    queryKey: ['connect', requestId],
    queryFn: () => {
      return getPendingConnection(requestId ?? '');
    },
    enabled: requestId !== null,
    retry: false,
  });
  const workspaces = useWorkspaces();
  const current = useCurrentWorkspace();
  const [chosen, setChosen] = useState<string | null>(null);
  const [askFirst, setAskFirst] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const approve = useMutation({
    mutationFn: approveConnection,
    onSuccess: goTo,
    onError: showError,
  });
  const deny = useMutation({ mutationFn: denyConnection, onSuccess: goTo, onError: showError });
  const workspaceId = chosen ?? current?.id;

  if (requestId === null || pending.isError) {
    return (
      <Shell>
        <Banner type="error">
          {pending.error?.message
            ?? 'This link is incomplete. Go back to your AI tool and connect again.'}
        </Banner>
      </Shell>
    );
  }
  if (pending.isPending || !workspaces.data) {
    return (
      <Shell>
        <Skeleton className="h-48 w-full" />
      </Shell>
    );
  }
  const { client_name, redirect_host, on_this_device } = pending.data;
  const answered = approve.isSuccess || deny.isSuccess;

  return (
    <Shell>
      <div>
        <h1 className="text-lg font-bold">Connect {client_name} to {PRODUCT_NAME}?</h1>
        <p className="text-sm text-muted">
          {on_this_device
            ? `You'll go back to an app on this device (${redirect_host}).`
            : `You'll go back to ${redirect_host}.`}{' '}
          Only continue if you started this from that tool.
        </p>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Workspace</span>
        <Select value={workspaceId} onValueChange={setChosen}>
          <SelectTrigger aria-label="Workspace" />
          <SelectContent>
            {workspaces.data.map((workspace) => {
              return (
                <SelectItem key={workspace.id} value={workspace.id}>{workspace.name}</SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted">
          It works in this workspace only. Connect again to use another.
        </span>
      </div>
      <ul className="list-disc pl-5 text-sm text-muted">
        <li>Reads this workspace's decisions, tickets and docs pages.</li>
        {!readOnly && (
          <li>Records decisions and open questions as proposals for your team to review.</li>
        )}
        <li>Can't accept, change or delete anything.</li>
      </ul>
      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          className="mt-0.5"
          checked={askFirst}
          disabled={readOnly}
          onCheckedChange={(on) => {
            return setAskFirst(on === true);
          }}
        />
        Ask me before recording
      </label>
      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          className="mt-0.5"
          checked={readOnly}
          onCheckedChange={(on) => {
            return setReadOnly(on === true);
          }}
        />
        Read only
      </label>
      <div className="flex justify-end gap-2">
        <Button
          loading={deny.isPending}
          disabled={approve.isPending || answered}
          onClick={() => {
            return deny.mutate(pending.data.id);
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={approve.isPending}
          disabled={!workspaceId || deny.isPending || answered}
          onClick={() => {
            if (workspaceId) {
              approve.mutate({ requestId: pending.data.id, workspaceId, readOnly, askFirst });
            }
          }}
        >
          Connect
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md py-16">
      <Card className="flex flex-col gap-5 p-6">{children}</Card>
    </main>
  );
}
