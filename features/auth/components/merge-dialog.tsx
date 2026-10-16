'use client';

import { toApiError } from '@/shared/api/envelope';
import Avatar from '@/shared/components/avatar';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import GithubMark from '@/shared/components/github-mark';
import SegmentedButton from '@/shared/components/segmented-button';
import { cn } from '@/shared/lib/cn';
import { displayName, handle } from '@/shared/session/lib';
import { publishUser } from '@/shared/session/refresh';
import { EnvelopeSimple } from '@phosphor-icons/react/ssr';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  cancelMerge,
  confirmMerge,
  type KeepProfile,
  type MergePreview,
  type MergeProfile,
} from '../api';
import { AUTH_ERROR } from '../constants';

const KEEP_OPTIONS: { value: KeepProfile; label: string }[] = [
  { value: 'current', label: 'This account' },
  { value: 'other', label: 'The other account' },
];
const CONFLICTS: Record<MergePreview['conflicts'][number], string> = {
  github:
    'Both accounts sign in with a different GitHub account. Disconnect GitHub from one of them first.',
  email: 'Both accounts sign in with a different email. Remove the email from one of them first.',
};

function moved(moves: MergePreview['moves']): string[] {
  const counts: [number, string, string][] = [
    [moves.workspaces, 'workspace', 'workspaces'],
    [moves.repos, 'repository', 'repositories'],
    [moves.documents, 'document', 'documents'],
    [moves.work_items, 'work item', 'work items'],
    [moves.comments, 'comment', 'comments'],
    [moves.chats, 'chat', 'chats'],
  ];
  return counts.filter(([count]) => {
    return count > 0;
  }).map(([count, one, many]) => {
    return `${count} ${count === 1 ? one : many}`;
  });
}

/**
 * Confirm merging another account, proven a moment ago, into the signed-in one: everything it has moves here,
 * and it's signed out everywhere and removed.
 */
export default function MergeDialog(
  { preview, onClose, onMerged }: {
    preview: MergePreview | null;
    onClose: () => void;
    onMerged?: () => void;
  },
) {
  const queryClient = useQueryClient();
  const [keep, setKeep] = useState<KeepProfile>('current');
  const [pending, setPending] = useState(false);
  if (!preview) {
    return null;
  }
  const blocked = preview.conflicts.length > 0;
  const brings = moved(preview.moves);

  const merge = async () => {
    setPending(true);
    try {
      publishUser(await confirmMerge(keep));
      // workspaces, repos and the rest now include the other account's
      await queryClient.invalidateQueries();
      toast.success('Accounts merged.');
      onClose();
      onMerged?.();
    } catch (failure) {
      const apiError = toApiError(failure);
      toast.error(apiError.message);
      if (apiError.errorCode === AUTH_ERROR.mergeNotFound) {
        onClose();
      }
    } finally {
      setPending(false);
    }
  };

  const dismiss = () => {
    void cancelMerge().catch(() => {
      // it lapses on its own in a few minutes
      return undefined;
    });
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          dismiss();
        }
      }}
    >
      <DialogContent
        title="Merge accounts"
        description="You proved you own both accounts. Merging moves everything into the account you're signed in to."
        className="max-w-xl"
        footer={
          <>
            <Button onClick={dismiss}>Keep them separate</Button>
            <Button
              variant="primary"
              loading={pending}
              disabled={blocked}
              onClick={() => {
                return void merge();
              }}
            >
              Merge accounts
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {blocked && (
            <Banner type="warning">
              {preview.conflicts.map((conflict) => {
                return <p key={conflict}>{CONFLICTS[conflict]}</p>;
              })}
            </Banner>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileCard label="Signed in" profile={preview.current} kept={keep === 'current'} />
            <ProfileCard label="Other account" profile={preview.other} kept={keep === 'other'} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm">Keep name, username and picture from</span>
            <SegmentedButton
              aria-label="Profile to keep"
              options={KEEP_OPTIONS}
              value={keep}
              onValueChange={setKeep}
            />
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted">
            {brings.length > 0 && <p>Moves here: {brings.join(', ')}.</p>}
            {preview.personal_workspace_name && (
              <p>
                Its personal workspace stays as{' '}
                <span className="font-medium text-foreground">
                  {preview.personal_workspace_name}
                </span>.
              </p>
            )}
            <p>
              The other account is signed out everywhere and removed. Both sign-in methods then open
              this one.
            </p>
            {preview.proof === 'email_otp' && (
              <p>
                Sign in with email using the other account&apos;s existing password; the one you
                just chose isn&apos;t kept.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileCard(
  { label, profile, kept }: { label: string; profile: MergeProfile; kept: boolean },
) {
  const name = displayName(profile);
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3',
        kept ? 'border-primary' : 'border-border',
      )}
    >
      <span className="text-xs font-medium text-muted uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <Avatar src={profile.avatar_url} name={name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted">{handle(profile)}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-xs text-muted">
        {profile.github_login && (
          <span className="flex items-center gap-1.5">
            <GithubMark /> @{profile.github_login}
          </span>
        )}
        {profile.email && (
          <span className="flex items-center gap-1.5">
            <EnvelopeSimple /> {profile.email}
          </span>
        )}
      </div>
    </div>
  );
}
