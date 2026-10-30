'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/command';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { useConnectedRepos } from '@/shared/repos/hooks';
import { ACCESS_STATUS } from '@/shared/repos/types';
import { signOut } from '@/shared/session/sign-out';
import { useCurrentWorkspace, useSwitchWorkspace, useWorkspaces } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE } from '@/shared/workspaces/types';
import {
  Buildings,
  ChatCircleDots,
  FileText,
  GitBranch,
  Monitor,
  Moon,
  Plus,
  SignOut,
  Sun,
  Ticket,
} from '@phosphor-icons/react/ssr';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSearch } from '../hooks';
import {
  highlightParts,
  isCommandShortcut,
  MIN_SEARCH_LENGTH,
  resultHref,
  sourceLabel,
} from '../lib';
import { PAGES, SETTINGS_PAGES } from '../nav';
import { SEARCH_RESULT_KIND, type SearchResult } from '../types';

const SEARCH_DELAY_MS = 250;
const RESULT_GROUPS = [
  {
    kind: SEARCH_RESULT_KIND.workItem,
    heading: 'Tickets',
    icon: Ticket,
    color: 'text-accent-blue',
  },
  {
    kind: SEARCH_RESULT_KIND.document,
    heading: 'Documents',
    icon: FileText,
    color: 'text-accent-orange',
  },
];

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun, color: 'text-accent-amber' },
  { value: 'dark', label: 'Dark', icon: Moon, color: 'text-accent-purple' },
  { value: 'system', label: 'System', icon: Monitor, color: 'text-accent-slate' },
];

type CommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddRepo: () => void;
  onCreateWorkspace: () => void;
};

/** A result's cmdk value: unique, and never matched against what's typed (results are always shown). */
function resultValue(result: SearchResult): string {
  return `${result.kind} ${result.id}`;
}

/** `text` with every match of `query` marked. */
function Highlighted({ text, query }: { text: string; query: string }) {
  return highlightParts(text, query).map((part, index) => {
    return part.match
      ? <mark key={index} className="rounded-sm bg-primary/15 text-inherit">{part.text}</mark>
      : part.text;
  });
}

/** The ⌘K / Ctrl+K palette: open a ticket or document, go anywhere, ask about the repo, switch workspace, repo or theme, sign out. */
export default function CommandMenu(
  { open, onOpenChange, onAddRepo, onCreateWorkspace }: CommandMenuProps,
) {
  const router = useRouter();
  const repos = useConnectedRepos();
  const workspaces = useWorkspaces();
  const current = useCurrentWorkspace();
  const switchWorkspace = useSwitchWorkspace();
  const { setTheme } = useTheme();
  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const searching = query.length >= MIN_SEARCH_LENGTH;
  const results = useSearch(query);
  const found: SearchResult[] = searching ? (results.data ?? []) : [];
  const [highlighted, setHighlighted] = useState('');
  const firstResult = found[0] ? resultValue(found[0]) : null;
  // the results shown are for an earlier search while the next one is typed or loading
  const stale = search.trim() !== query || results.isPlaceholderData;

  useEffect(() => {
    // results load after cmdk has picked the first match, so pick the first result, for Enter to open it
    if (firstResult) {
      setHighlighted(firstResult);
    }
  }, [firstResult]);

  useEffect(() => {
    // each opening starts with an empty search
    if (!open) {
      setSearch('');
    }
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isCommandShortcut(event)) {
        return;
      }
      event.preventDefault();
      onOpenChange(!open);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      return window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  // close first, so the next page or dialog gets focus rather than the palette
  const run = (action: () => void) => {
    return () => {
      onOpenChange(false);
      action();
    };
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command menu"
      value={highlighted}
      onValueChange={setHighlighted}
    >
      <CommandInput
        placeholder="Search tickets and documents, or type a command…"
        value={search}
        onValueChange={setSearch}
        onKeyDown={(event) => {
          // Enter on an earlier search's result would open the wrong one; cmdk skips a prevented key
          const onResult = found.some((result) => {
            return resultValue(result) === highlighted;
          });
          if (event.key === 'Enter' && stale && onResult) {
            event.preventDefault();
          }
        }}
      />
      <CommandList>
        {/* the server already matched the results, so they're always shown (forceMount) and count as results */}
        {!found.length && (
          <CommandEmpty>
            {searching && results.isFetching ? 'Searching…' : 'No results.'}
          </CommandEmpty>
        )}
        {RESULT_GROUPS.map(({ kind, heading, icon: Icon, color }) => {
          const group = found.filter((result) => {
            return result.kind === kind;
          });
          if (!group.length) {
            return null;
          }
          return (
            <CommandGroup key={kind} heading={heading} forceMount>
              {group.map((result) => {
                const label = sourceLabel(result.source);
                return (
                  <CommandItem
                    key={result.id}
                    value={resultValue(result)}
                    forceMount
                    className="h-auto min-h-9 py-1.5"
                    onSelect={run(() => {
                      return router.push(resultHref(result));
                    })}
                  >
                    <Icon weight="fill" className={color} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-2">
                        <span className="truncate">
                          {result.key && <span className="mr-1.5 text-muted">{result.key}</span>}
                          <Highlighted text={result.title} query={query} />
                        </span>
                        {label && (
                          <span className="ml-auto shrink-0 text-xs text-muted">{label}</span>
                        )}
                      </span>
                      {result.snippet && (
                        <span className="truncate text-xs text-muted">
                          <Highlighted text={result.snippet} query={query} />
                        </span>
                      )}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
        <CommandGroup heading="Go to">
          {PAGES.map(({ href, label, icon: Icon, color }) => {
            return (
              <CommandItem
                key={href}
                onSelect={run(() => {
                  return router.push(href);
                })}
              >
                <Icon weight="fill" className={color} /> {label}
              </CommandItem>
            );
          })}
          {/* features/dashboard opens its chat for this param; the URL is the contract between the two */}
          <CommandItem
            keywords={['chat', 'ai', 'question', 'ask']}
            onSelect={run(() => {
              return router.push('/dashboard?chat=open');
            })}
          >
            <ChatCircleDots weight="fill" className="text-accent-blue" /> Ask about this repository
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Repositories">
          {repos.data
            ?.filter((repo) => {
              return repo.access_status === ACCESS_STATUS.active;
            })
            .map((repo) => {
              return (
                <CommandItem
                  key={repo.repo_full_name}
                  value={`Switch to ${repo.repo_full_name}`}
                  keywords={['repo', 'repository', 'switch']}
                  onSelect={run(() => {
                    return router.push(
                      `/dashboard?repo=${encodeURIComponent(repo.repo_full_name)}`,
                    );
                  })}
                >
                  <GitBranch weight="fill" className="text-accent-blue" /> {repo.repo_full_name}
                </CommandItem>
              );
            })}
          {hasRole(current?.role, ROLE.admin) && (
            <CommandItem keywords={['repo', 'repository', 'connect']} onSelect={run(onAddRepo)}>
              <Plus /> Add repository…
            </CommandItem>
          )}
        </CommandGroup>
        <CommandGroup heading="Workspaces">
          {workspaces.data
            ?.filter((workspace) => {
              return workspace.id !== current?.id;
            })
            .map((workspace) => {
              return (
                <CommandItem
                  key={workspace.id}
                  value={`Switch to workspace ${workspace.name}`}
                  keywords={['workspace', 'team', 'switch']}
                  onSelect={run(() => {
                    return switchWorkspace(workspace.id);
                  })}
                >
                  <Buildings weight="fill" className="text-accent-purple" /> {workspace.name}
                </CommandItem>
              );
            })}
          <CommandItem keywords={['workspace', 'team', 'new']} onSelect={run(onCreateWorkspace)}>
            <Plus /> Create workspace…
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Settings">
          {SETTINGS_PAGES.map(({ href, label, icon: Icon, color }) => {
            return (
              <CommandItem
                key={href}
                value={`Settings ${label}`}
                keywords={['settings']}
                onSelect={run(() => {
                  return router.push(href);
                })}
              >
                <Icon weight="fill" className={color} /> {label}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup heading="Theme">
          {THEMES.map(({ value, label, icon: Icon, color }) => {
            return (
              <CommandItem
                key={value}
                value={`Theme ${label}`}
                keywords={['theme', 'appearance']}
                onSelect={run(() => {
                  return setTheme(value);
                })}
              >
                <Icon weight="fill" className={color} /> {label}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup heading="Account">
          <CommandItem
            keywords={['log out', 'logout']}
            onSelect={run(() => {
              return void signOut().finally(() => {
                return router.replace('/sign-in');
              });
            })}
          >
            <SignOut weight="fill" className="text-danger" /> Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
