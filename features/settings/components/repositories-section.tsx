'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import Skeleton from '@/shared/components/skeleton';
import StatusTag from '@/shared/components/status-tag';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { isRunning } from '@/shared/lib/job-status';
import AddRepoDialog from '@/shared/repos/add-repo-dialog';
import { useConnectedRepos, useInstallations } from '@/shared/repos/hooks';
import { ACCESS_STATUS, type ConnectedRepo } from '@/shared/repos/types';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE } from '@/shared/workspaces/types';
import {
  ArrowsClockwise,
  ArrowSquareOut,
  GitBranch,
  LinkBreak,
  Plus,
  SquaresFour,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDisconnectRepo, useReindexRepo } from '../hooks';
import { SettingsSection } from './settings-layout';

export default function RepositoriesSection() {
  const router = useRouter();
  const repos = useConnectedRepos();
  const installations = useInstallations();
  const [adding, setAdding] = useState(false);
  // only admins connect and disconnect; members still view and re-index
  const isAdmin = hasRole(useCurrentWorkspace()?.role, ROLE.admin);

  return (
    <SettingsSection
      title="Repositories"
      description="The repositories we index and keep in sync on every push."
      action={isAdmin && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            return setAdding(true);
          }}
        >
          <Plus /> Add repository
        </Button>
      )}
    >
      {repos.isPending && <Skeleton className="h-32 w-full" />}
      {repos.isError && (
        <Banner
          type="error"
          action={
            <Button
              size="sm"
              onClick={() => {
                return repos.refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          {repos.error.message}
        </Banner>
      )}
      {repos.isSuccess && (
        <Card className="p-0">
          {repos.data.length === 0
            ? <p className="p-4 text-sm text-muted">No repositories connected yet.</p>
            : (
              <ul className="divide-y divide-border">
                {repos.data.map((repo) => {
                  return <RepoRow key={repo.repo_full_name} repo={repo} canDisconnect={isAdmin} />;
                })}
              </ul>
            )}
        </Card>
      )}
      {installations.data && (
        <a
          href={installations.data.install_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 self-start text-sm text-primary hover:underline"
        >
          Configure the GitHub App <ArrowSquareOut className="size-3.5" />
        </a>
      )}
      <AddRepoDialog
        open={adding}
        onOpenChange={setAdding}
        onConnected={(repo) => {
          return router.push(`/dashboard?repo=${encodeURIComponent(repo)}`);
        }}
      />
    </SettingsSection>
  );
}

function RepoRow({ repo, canDisconnect }: { repo: ConnectedRepo; canDisconnect: boolean }) {
  const reindex = useReindexRepo();
  const disconnect = useDisconnectRepo();
  const running = isRunning(repo.parse_status);
  const files = repo.graph_stats?.files;

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <GitBranch weight="fill" className="size-4 shrink-0 text-accent-blue" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{repo.repo_full_name}</p>
        <p className="truncate text-xs text-muted">
          {repo.default_branch}
          {files !== undefined && ` · ${files} files`}
          {repo.parse_error && ` · ${repo.parse_error}`}
        </p>
      </div>
      {repo.access_status === ACCESS_STATUS.active
        ? <StatusTag status={repo.parse_status} />
        : <Tag variant="warning">No access</Tag>}
      <div className="flex gap-1">
        {repo.indexed_at && (
          <Tooltip content="Open in dashboard">
            <Button size="sm" variant="tertiary" iconOnly asChild>
              <Link
                href={`/dashboard?repo=${encodeURIComponent(repo.repo_full_name)}`}
                aria-label={`Open ${repo.repo_full_name} in the dashboard`}
              >
                <SquaresFour />
              </Link>
            </Button>
          </Tooltip>
        )}
        <Tooltip content={running ? 'Indexing…' : 'Re-index'}>
          {/* a disabled button fires no pointer events, so the span carries the tooltip */}
          <span className="inline-flex">
            <Button
              size="sm"
              variant="tertiary"
              iconOnly
              aria-label={`Re-index ${repo.repo_full_name}`}
              disabled={running || repo.access_status !== ACCESS_STATUS.active}
              loading={reindex.isPending}
              onClick={() => {
                return reindex.mutate(repo.repo_full_name);
              }}
            >
              <ArrowsClockwise />
            </Button>
          </span>
        </Tooltip>
        {canDisconnect && (
          <ConfirmDialog
            trigger={
              <Tooltip content="Disconnect">
                <Button
                  size="sm"
                  variant="tertiary"
                  iconOnly
                  aria-label={`Disconnect ${repo.repo_full_name}`}
                  className="hover:text-danger"
                >
                  <LinkBreak />
                </Button>
              </Tooltip>
            }
            title={`Disconnect ${repo.repo_full_name}?`}
            description="We stop tracking it for this workspace. Its copy of the code and its graph are deleted once no other workspace uses them."
            confirmLabel="Disconnect repository"
            pending={disconnect.isPending}
            onConfirm={(close) => {
              return disconnect.mutate(repo.repo_full_name, { onSuccess: close });
            }}
          />
        )}
      </div>
    </li>
  );
}
