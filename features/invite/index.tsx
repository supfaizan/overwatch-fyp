'use client';

import { UsersThree } from '@phosphor-icons/react/ssr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { ApiError } from '@/shared/api/envelope';
import { queryKeys } from '@/shared/api/query-keys';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import Skeleton from '@/shared/components/skeleton';
import Spinner from '@/shared/components/spinner';
import { handle } from '@/shared/session/lib';
import { signOut } from '@/shared/session/sign-out';
import { useSession } from '@/shared/session/store';
import { useSwitchWorkspace } from '@/shared/workspaces/hooks';
import { ROLE, type Workspace } from '@/shared/workspaces/types';
import { acceptInvite, INVITE_KIND, previewInvite, publicPreview, type InvitePreview } from './api';
import { forgetInviteToken, takeInviteToken } from './token';

const keys = {
  preview: (token: string) => ['invite', token] as const,
  publicPreview: (token: string) => ['invite', 'public', token] as const,
};
const INVITE_ERROR = { wrongAccount: 'invite_wrong_account' } as const;

type Intro = { title: string; description: ReactNode };
type InviteProps = {
  /** Signing in as the invited address (fixed), then coming back here. */
  renderSignIn: (props: Intro & { email: string }) => ReactNode;
  /** Creating an account for the invited address straight from the link. */
  renderSignUp: (props: Intro & { token: string; email: string }) => ReactNode;
};

function invitedAs(preview: InvitePreview): string {
  return `@${preview.invited_by} invited you as ${preview.role === ROLE.admin ? 'an admin' : 'a member'}.`;
}

/** Join a workspace from an invite link: signed in, accept it; signed out, sign in or create an account first. */
export default function Invite({ renderSignIn, renderSignUp }: InviteProps) {
  const status = useSession((state) => state.status);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => setToken(takeInviteToken()), []);

  if (token === undefined || status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6 text-muted" />
      </div>
    );
  }
  if (token === null) {
    return (
      <Shell>
        <Banner type="error">This invite link is incomplete. Open it again from the email or message it came in.</Banner>
      </Shell>
    );
  }
  return status === 'authenticated' ? (
    <Shell>
      <AcceptInvite token={token} />
    </Shell>
  ) : (
    <GuestInvite token={token} renderSignIn={renderSignIn} renderSignUp={renderSignUp} />
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md py-16">
      <Card className="flex flex-col gap-5 p-6">{children}</Card>
    </main>
  );
}

function Heading({ preview }: { preview: InvitePreview }) {
  return (
    <div className="flex items-start gap-3">
      <UsersThree weight="fill" className="size-8 shrink-0 text-accent-orange" />
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-bold">Join {preview.workspace_name}</h1>
        <p className="text-sm text-muted">
          {invitedAs(preview)} You&apos;ll see its repositories and integrations alongside your own workspace.
        </p>
      </div>
    </div>
  );
}

function GuestInvite({ token, renderSignIn, renderSignUp }: InviteProps & { token: string }) {
  // a used or expired link stays that way, so a failed preview isn't retried
  const preview = useQuery({ queryKey: keys.publicPreview(token), queryFn: () => publicPreview(token), retry: false });

  if (preview.isPending) {
    return (
      <Shell>
        <Skeleton className="h-24 w-full" />
      </Shell>
    );
  }
  if (preview.isError) {
    return (
      <Shell>
        <Banner type="error">{preview.error.message}</Banner>
        <Button asChild className="self-end">
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </Shell>
    );
  }

  const { data } = preview;
  if (data.kind === INVITE_KIND.email && data.email) {
    const title = `Join ${data.workspace_name} on Overwatch`;
    return data.account_exists
      ? renderSignIn({ email: data.email, title: `Sign in to join ${data.workspace_name}`, description: invitedAs(data) })
      : renderSignUp({ token, email: data.email, title, description: `${invitedAs(data)} Create your account to join.` });
  }
  return (
    <Shell>
      <Heading preview={data} />
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button asChild>
          <Link href="/sign-up?from=/invite">Create an account</Link>
        </Button>
        <Button asChild variant="primary">
          <Link href="/sign-in?from=/invite">Sign in to join</Link>
        </Button>
      </div>
    </Shell>
  );
}

function AcceptInvite({ token }: { token: string }) {
  const user = useSession((state) => state.user);
  const queryClient = useQueryClient();
  const switchTo = useSwitchWorkspace();
  const preview = useQuery<InvitePreview, ApiError>({ queryKey: keys.preview(token), queryFn: () => previewInvite(token), retry: false });
  const accept = useMutation<Workspace, ApiError>({
    mutationFn: () => acceptInvite(token),
    onSuccess: async (workspace) => {
      forgetInviteToken();
      // the new workspace must be in the list before switching, or the gate would pick another one
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      toast.success(`You joined ${workspace.name}.`);
      switchTo(workspace.id);
    },
    onError: (error) => toast.error(error.message),
  });

  if (preview.isPending) return <Skeleton className="h-24 w-full" />;
  if (preview.isError) {
    const wrongAccount = preview.error.errorCode === INVITE_ERROR.wrongAccount;
    const invited = typeof preview.error.meta.invited === 'string' ? ` (${preview.error.meta.invited})` : '';
    return (
      <>
        <Banner type="error">
          {wrongAccount ? `This invite is for another account${invited}.` : preview.error.message}{' '}
          {user && <>You&apos;re signed in as {handle(user)}.</>}
        </Banner>
        <div className="flex justify-end gap-2">
          {/* the token stays in this tab, so the invite opens again once signed out */}
          {wrongAccount && <Button onClick={() => void signOut()}>Sign out and continue</Button>}
          <Button asChild variant={wrongAccount ? 'secondary' : 'primary'}>
            <Link href="/dashboard">Go to your dashboard</Link>
          </Button>
        </div>
      </>
    );
  }
  return (
    <>
      <Heading preview={preview.data} />
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button asChild>
          <Link href="/dashboard">Not now</Link>
        </Button>
        <Button variant="primary" loading={accept.isPending} onClick={() => accept.mutate()}>
          Join workspace
        </Button>
      </div>
    </>
  );
}
