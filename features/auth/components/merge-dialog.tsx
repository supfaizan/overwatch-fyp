'use client';

import { toApiError } from '@/shared/api/envelope';
import Avatar from '@/shared/components/avatar';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import GithubMark from '@/shared/components/github-mark';
import { displayName, handle } from '@/shared/session/lib';
import { publishUser } from '@/shared/session/refresh';
import { CheckCircle, EnvelopeSimple } from '@phosphor-icons/react/ssr';
import { useQueryClient } from '@tanstack/react-query';
import { RadioGroup } from 'radix-ui';
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
        description="Pick the profile to keep. Everything moves into one account."
        className="max-w-xl"
        footer={
          <>
            <Button variant="tertiary" className="mr-auto" onClick={dismiss}>
              Keep them separate
            </Button>
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
          <RadioGroup.Root
            aria-label="Profile to keep"
            value={keep}
            onValueChange={(value) => {
              // Radix hands back a string; only the two cards' values are ever picked
              if (value === 'current' || value === 'other') {
                setKeep(value);
              }
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <ProfileCard value="current" label="Signed in" profile={preview.current} />
            <ProfileCard value="other" label="Other account" profile={preview.other} />
          </RadioGroup.Root>
          <div className="flex flex-col gap-1 text-sm text-muted">
            <p>
              {brings.length > 0 ? `Moves here: ${brings.join(', ')}` : 'Nothing else moves'}
              {preview.personal_workspace_name
                ? `, keeping its personal workspace as “${preview.personal_workspace_name}”.`
                : '.'}
            </p>
            <p>
              The other account is signed out and removed
              {preview.proof === 'email_otp'
                ? '; email sign-in keeps its existing password.'
                : '; both sign-ins open this one.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** One account, as a radio: picking it keeps its name, username and picture. */
function ProfileCard(
  { value, label, profile }: { value: KeepProfile; label: string; profile: MergeProfile },
) {
  const name = displayName(profile);
  return (
    <RadioGroup.Item
      value={value}
      className="group relative flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
    >
      <span className="text-xs font-medium text-muted uppercase">{label}</span>
      <RadioGroup.Indicator className="absolute top-2.5 right-2.5 text-primary">
        <CheckCircle weight="fill" className="size-5" aria-hidden />
      </RadioGroup.Indicator>
      <span className="flex items-center gap-2">
        <Avatar src={profile.avatar_url} name={name} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted">{handle(profile)}</span>
        </span>
      </span>
      <span className="flex flex-col gap-1 text-xs text-muted">
        {profile.github_login && (
          <span className="flex items-center gap-1.5">
            <GithubMark /> @{profile.github_login}
          </span>
        )}
        {profile.email && (
          <span className="flex min-w-0 items-center gap-1.5">
            <EnvelopeSimple className="shrink-0" />{' '}
            <span className="truncate">{profile.email}</span>
          </span>
        )}
      </span>
    </RadioGroup.Item>
  );
}
