'use client';

import { ArrowSquareOut, ArrowsClockwise } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import GithubMark from '@/shared/components/github-mark';
import Skeleton from '@/shared/components/skeleton';
import StatusTag from '@/shared/components/status-tag';
import Tag from '@/shared/components/tag';
import { useConnectedRepos, useDisconnectRepo, useInstallations, useReindexRepo } from '../hooks';
import type { ConnectedRepo } from '../types';
import { SettingsSection } from './settings-layout';

export default function RepositoriesSection() {
  const repos = useConnectedRepos();
  const installations = useInstallations();

  return (
    <SettingsSection title="Repositories" description="The repositories Overwatch indexes and keeps in sync on every push.">
      {repos.isPending && <Skeleton className="h-32 w-full" />}
      {repos.isError && (
        <Banner type="error" action={<Button size="sm" onClick={() => repos.refetch()}>Retry</Button>}>
          {repos.error.message}
        </Banner>
      )}
      {repos.isSuccess && (
        <Card className="p-0">
          {repos.data.length === 0 ? (
            <p className="p-4 text-sm text-muted">No repositories connected yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {repos.data.map((repo) => (
                <RepoRow key={repo.repo_full_name} repo={repo} />
              ))}
            </ul>
          )}
        </Card>
      )}
      {installations.data && (
        <a href={installations.data.install_url} className="inline-flex items-center gap-1 self-start text-sm text-primary hover:underline">
          Add repositories on GitHub <ArrowSquareOut className="size-3.5" />
        </a>
      )}
    </SettingsSection>
  );
}

function RepoRow({ repo }: { repo: ConnectedRepo }) {
  const reindex = useReindexRepo();
  const disconnect = useDisconnectRepo();
  const running = repo.parse_status === 'pending' || repo.parse_status === 'in_progress';
  const files = repo.graph_stats?.files;

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <GithubMark className="text-muted" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{repo.repo_full_name}</p>
        <p className="truncate text-xs text-muted">
          {repo.default_branch}
          {files !== undefined && ` · ${files} files`}
          {repo.parse_error && ` · ${repo.parse_error}`}
        </p>
      </div>
      {repo.access_status === 'active' ? <StatusTag status={repo.parse_status} /> : <Tag variant="warning">No access</Tag>}
      <div className="flex gap-1">
        {repo.indexed_at && (
          <Button size="sm" variant="tertiary" asChild>
            <Link href={`/dashboard?repo=${encodeURIComponent(repo.repo_full_name)}`}>Open</Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="tertiary"
          iconOnly
          aria-label={`Re-index ${repo.repo_full_name}`}
          disabled={running || repo.access_status !== 'active'}
          loading={reindex.isPending}
          onClick={() => reindex.mutate(repo.repo_full_name)}
        >
          <ArrowsClockwise />
        </Button>
        <ConfirmDialog
          trigger={
            <Button size="sm" variant="tertiary">
              Disconnect
            </Button>
          }
          title={`Disconnect ${repo.repo_full_name}?`}
          description="Overwatch stops tracking it and deletes its copy of the code and its graph."
          confirmLabel="Disconnect repository"
          pending={disconnect.isPending}
          onConfirm={(close) => disconnect.mutate(repo.repo_full_name, { onSuccess: close })}
        />
      </div>
    </li>
  );
}
