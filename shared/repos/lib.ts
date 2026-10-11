import type { ConnectedRepo } from './types';

export const isRunning = (repo: Pick<ConnectedRepo, 'parse_status'>) => repo.parse_status === 'pending' || repo.parse_status === 'in_progress';

const isReachable = (repo: ConnectedRepo) => repo.access_status === 'active';

/** Repos with a graph to show: indexed at least once (a re-index keeps the old graph) and still reachable. */
export function viewableRepos(repos: ConnectedRepo[]): ConnectedRepo[] {
  return repos.filter((repo) => repo.indexed_at !== null && isReachable(repo));
}

/**
 * The repo to show: the one asked for (even if its first index is still running), else the last one used,
 * else the first with a graph. Null when there's nothing to show.
 */
export function pickRepo(repos: ConnectedRepo[], requested: string | null, lastUsed: string | null): ConnectedRepo | null {
  const reachable = (name: string | null) => repos.find((repo) => repo.repo_full_name === name && isReachable(repo));
  return reachable(requested) ?? reachable(lastUsed) ?? viewableRepos(repos)[0] ?? null;
}

/** Repos by owner, owners and names alphabetical regardless of case. */
export function groupByOwner<T extends { full_name: string }>(repos: T[]): { owner: string; repos: T[] }[] {
  const byName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });
  const groups = new Map<string, T[]>();
  for (const repo of repos) {
    const owner = repo.full_name.split('/')[0];
    groups.set(owner, [...(groups.get(owner) ?? []), repo]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => byName(a, b))
    .map(([owner, list]) => ({ owner, repos: list.sort((a, b) => byName(a.full_name, b.full_name)) }));
}

// keyed by user (browsers get shared) and workspace (each has its own repos)
const lastRepoKey = (userId: string, workspaceId: string) => `ow_last_repo:${userId}:${workspaceId}`;

export function readLastRepo(userId: string, workspaceId: string): string | null {
  try {
    return localStorage.getItem(lastRepoKey(userId, workspaceId));
  } catch {
    return null;
  }
}

export function saveLastRepo(userId: string, workspaceId: string, repoFullName: string): void {
  try {
    localStorage.setItem(lastRepoKey(userId, workspaceId), repoFullName);
  } catch {
    // storage blocked: the dashboard just opens the first repo next time
  }
}
