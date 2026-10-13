'use client';

import { UsersThree } from '@phosphor-icons/react/ssr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import Skeleton from '@/shared/components/skeleton';
import { useSession } from '@/shared/session/store';
import { useSwitchWorkspace } from '@/shared/workspaces/hooks';
import { ROLE, type Workspace } from '@/shared/workspaces/types';
import { queryKeys } from '@/shared/api/query-keys';
import { acceptInvite, previewInvite } from './api';

/** Join a workspace from an invite link, then open it. */
const keys = { preview: (token: string) => ['invite', token] as const };

export default function AcceptInvite({ token }: { token: string }) {
  const login = useSession((state) => state.user?.github_login);
  const queryClient = useQueryClient();
  const switchTo = useSwitchWorkspace();
  // a used or expired link stays that way, so a failed preview isn't retried
  const preview = useQuery({ queryKey: keys.preview(token), queryFn: () => previewInvite(token), retry: false });
  const accept = useMutation<Workspace, ApiError>({
    mutationFn: () => acceptInvite(token),
    onSuccess: async (workspace) => {
      // the new workspace must be in the list before switching, or the gate would pick another one
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      toast.success(`You joined ${workspace.name}.`);
      switchTo(workspace.id);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Card className="flex flex-col gap-5 p-6">
      {preview.isPending && <Skeleton className="h-24 w-full" />}
      {preview.isError && (
        <>
          <Banner type="error">
            {preview.error.message} {login && <>You&apos;re signed in as @{login}.</>}
          </Banner>
          <Button asChild className="self-end">
            <Link href="/dashboard">Go to your dashboard</Link>
          </Button>
        </>
      )}
      {preview.data && (
        <>
          <div className="flex items-start gap-3">
            <UsersThree weight="fill" className="size-8 shrink-0 text-accent-orange" />
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-bold">Join {preview.data.workspace_name}</h1>
              <p className="text-sm text-muted">
                @{preview.data.invited_by} invited you as {preview.data.role === ROLE.admin ? 'an admin' : 'a member'}. You&apos;ll see its repositories
                and integrations alongside your own workspace.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button asChild>
              <Link href="/dashboard">Not now</Link>
            </Button>
            <Button variant="primary" loading={accept.isPending} onClick={() => accept.mutate()}>
              Join workspace
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
