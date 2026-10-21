'use client';

import { groupByOwner } from '@/shared/repos/lib';
import { GitBranch, LockSimple } from '@phosphor-icons/react/ssr';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import Skeleton from './skeleton';
import Spinner from './spinner';
import Tag from './tag';

type RepoOption = { id: number; full_name: string; private: boolean; connected: boolean };

type RepoPickerProps = {
  /** The repos to choose from; grouped by owner and sorted here. */
  repos: RepoOption[];
  /** Shows placeholder rows while the list loads. */
  loading?: boolean;
  /** The repo being connected right now: it shows a spinner and the list is locked until it's done. */
  pending?: string | null;
  /** Called with `owner/name`. Already-connected repos call it too, so picking one can simply open it. */
  onSelect: (repoFullName: string) => void;
};

/**
 * Search and pick one GitHub repository, grouped by owner. Typing filters; arrows and Enter pick.
 * - Data-free: the caller fetches the repos and decides what picking does (connect, open).
 * - For the dialog wired to the API, use `AddRepoDialog` from `shared/repos`.
 */
export default function RepoPicker(
  { repos, loading = false, pending = null, onSelect }: RepoPickerProps,
) {
  return (
    <Command className="rounded-lg border border-border">
      <CommandInput placeholder="Search repositories…" disabled={pending !== null} />
      <CommandList className="max-h-72">
        {loading
          ? (
            <div className="flex flex-col gap-2 p-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-3/5" />
            </div>
          )
          : <CommandEmpty>No repositories match.</CommandEmpty>}
        {groupByOwner(repos).map((group) => {
          return (
            <CommandGroup key={group.owner} heading={group.owner}>
              {group.repos.map((repo) => {
                return (
                  <CommandItem
                    key={repo.id}
                    value={repo.full_name}
                    disabled={pending !== null}
                    onSelect={() => {
                      return onSelect(repo.full_name);
                    }}
                  >
                    <GitBranch />
                    <span className="min-w-0 flex-1 truncate">
                      {repo.full_name.slice(group.owner.length + 1)}
                    </span>
                    {repo.private && <LockSimple aria-label="Private" />}
                    {pending === repo.full_name
                      ? <Spinner />
                      : repo.connected && <Tag>Connected</Tag>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </Command>
  );
}
