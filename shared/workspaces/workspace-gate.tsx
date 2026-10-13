'use client';

import { useEffect, type ReactNode } from 'react';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Spinner from '@/shared/components/spinner';
import { useSession } from '@/shared/session/store';
import { useWorkspaces } from './hooks';
import { pickWorkspace, readLastWorkspace, saveLastWorkspace } from './lib';
import { useWorkspace } from './store';

/** Renders its children once a workspace is picked, so every request below it is scoped to one. */
export default function WorkspaceGate({ children }: { children: ReactNode }) {
  const userId = useSession((state) => state.user?.id ?? '');
  const workspaces = useWorkspaces();
  const id = useWorkspace((state) => state.id);
  const current = workspaces.data?.find((workspace) => workspace.id === id);

  useEffect(() => {
    // picked once, or again when the current one is gone (left, or deleted by someone else)
    if (!workspaces.data || current) return;
    const requested = new URLSearchParams(window.location.search).get('w');
    const picked = pickWorkspace(workspaces.data, requested, readLastWorkspace(userId));
    useWorkspace.getState().setId(picked?.id ?? null);
    if (picked) saveLastWorkspace(userId, picked.id);
  }, [workspaces.data, current, userId]);

  if (workspaces.isError) {
    return (
      <div className="mx-auto max-w-md pt-16">
        <Banner type="error" action={<Button size="sm" onClick={() => workspaces.refetch()}>Retry</Button>}>
          {workspaces.error.message}
        </Banner>
      </div>
    );
  }
  if (!current) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6 text-muted" />
      </div>
    );
  }
  return children;
}
