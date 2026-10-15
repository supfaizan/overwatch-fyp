'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';
import StatusTag from '@/shared/components/status-tag';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { JOB_STATUS } from '@/shared/lib/job-status';
import { useConnectedRepos } from '@/shared/repos/hooks';
import { isRunning, pickRepo, readLastRepo } from '@/shared/repos/lib';
import { ACCESS_STATUS } from '@/shared/repos/types';
import { useSession } from '@/shared/session/store';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { useWorkspace } from '@/shared/workspaces/store';
import { ROLE } from '@/shared/workspaces/types';
import { CaretUpDown, Check, GearSix, GitBranch, Plus } from '@phosphor-icons/react/ssr';
import { useRouter, useSearchParams } from 'next/navigation';

/** Which repo the app is looking at; switching opens it on the dashboard. */
export default function RepoSwitcher(
  { collapsed, onAddRepo }: { collapsed: boolean; onAddRepo: () => void },
) {
  const router = useRouter();
  const requested = useSearchParams().get('repo');
  const userId = useSession((state) => state.user?.id ?? '');
  const workspaceId = useWorkspace((state) => state.id ?? '');
  const repos = useConnectedRepos();
  const current = repos.data
    ? pickRepo(repos.data, requested, readLastRepo(userId, workspaceId))?.repo_full_name
    : undefined;
  const label = current ?? 'Choose a repository';
  const isAdmin = hasRole(useCurrentWorkspace()?.role, ROLE.admin);

  const trigger = (
    <DropdownMenuTrigger
      aria-label={`Repository: ${label}`}
      className={cn(
        'flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-border text-sm transition-colors hover:border-border-hover focus-visible:outline-2 focus-visible:outline-primary data-[state=open]:border-border-hover [&>svg]:size-4 [&>svg]:shrink-0',
        collapsed ? 'w-8 justify-center' : 'px-2',
      )}
    >
      <GitBranch weight="fill" className="text-accent-blue" />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate text-left font-medium">{label}</span>
          <CaretUpDown className="text-muted" />
        </>
      )}
    </DropdownMenuTrigger>
  );

  return (
    // non-modal, so opening the add dialog from it doesn't leave the page's pointer lock behind
    <DropdownMenu modal={false}>
      {collapsed
        ? (
          <Tooltip content={label} side="right">
            {trigger}
          </Tooltip>
        )
        : trigger}
      <DropdownMenuContent side={collapsed ? 'right' : 'bottom'} align="start" className="w-64">
        <DropdownMenuLabel>Repositories</DropdownMenuLabel>
        {repos.data?.map((repo) => (
          <DropdownMenuItem
            key={repo.repo_full_name}
            onSelect={() =>
              router.push(`/dashboard?repo=${encodeURIComponent(repo.repo_full_name)}`)}
          >
            <Check className={cn(repo.repo_full_name !== current && 'invisible')} />
            <span className="min-w-0 flex-1 truncate">{repo.repo_full_name}</span>
            {repo.access_status !== ACCESS_STATUS.active
              ? <Tag variant="warning">No access</Tag>
              : (
                (isRunning(repo) || repo.parse_status === JOB_STATUS.failed) && (
                  <StatusTag status={repo.parse_status} />
                )
              )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem onSelect={onAddRepo}>
            <Plus /> Add repository…
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => router.push('/settings/repositories')}>
          <GearSix /> Manage repositories
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
