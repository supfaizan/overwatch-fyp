'use client';

import { ArrowSquareOut } from '@phosphor-icons/react/ssr';
import { ApiError, GITHUB_SIGN_IN_URL } from '@/shared/api/envelope';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import GithubMark from '@/shared/components/github-mark';
import RepoPicker from '@/shared/components/repo-picker';
import Skeleton from '@/shared/components/skeleton';
import { useAvailableRepos, useConnectRepo, useInstallations } from './hooks';

type AddRepoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with `owner/name` once a repo is connected, or when an already-connected one is picked. */
  onConnected: (repoFullName: string) => void;
};

/**
 * Connect one GitHub repository: search what the GitHub App can see and pick it. GitHub pages open in a new
 * tab, and the lists refresh when the user comes back.
 * - The caller decides what happens next, usually opening the repo on the dashboard.
 */
export default function AddRepoDialog({ open, onOpenChange, onConnected }: AddRepoDialogProps) {
  const installations = useInstallations(open);
  const hasInstallation = (installations.data?.installations.length ?? 0) > 0;
  const available = useAvailableRepos(open && hasInstallation);
  const connect = useConnectRepo((repo) => done(repo.repo_full_name));

  function done(repoFullName: string) {
    onOpenChange(false);
    onConnected(repoFullName);
  }

  const installUrl = installations.data?.install_url;
  const error = installations.error ?? available.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Add a repository"
        description="Overwatch maps its architecture and keeps it current on every push."
        footer={
          installUrl && (
            <a href={installUrl} target="_blank" rel="noopener noreferrer" className="mr-auto inline-flex items-center gap-1 self-center text-sm text-primary hover:underline">
              Missing a repository? Configure the GitHub App <ArrowSquareOut className="size-3.5" />
            </a>
          )
        }
      >
        {error instanceof ApiError && error.errorCode === 'github_needs_reauth' ? (
          <Banner type="warning" action={<Button size="sm" asChild><a href={GITHUB_SIGN_IN_URL}>Sign in again</a></Button>}>
            Your GitHub authorization expired or was revoked.
          </Banner>
        ) : error ? (
          <Banner type="error" action={<Button size="sm" onClick={() => void (installations.isError ? installations.refetch() : available.refetch())}>Retry</Button>}>
            {error.message}
          </Banner>
        ) : installations.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : !hasInstallation ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted">Install the Overwatch GitHub App on the account that owns your repositories, then come back here.</p>
            <Button variant="primary" asChild>
              <a href={installUrl} target="_blank" rel="noopener noreferrer">
                <GithubMark /> Install GitHub App
              </a>
            </Button>
          </div>
        ) : (
          <RepoPicker
            repos={available.data ?? []}
            loading={available.isPending}
            pending={connect.isPending ? (connect.variables ?? null) : null}
            onSelect={(name) => (available.data?.find((repo) => repo.full_name === name)?.connected ? done(name) : connect.mutate(name))}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
