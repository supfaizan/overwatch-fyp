import type { ConnectedRepo } from '../types';

/** Repos with a graph to show: indexed at least once (a re-index keeps the old graph) and still reachable. */
export function viewableRepos(repos: ConnectedRepo[]): ConnectedRepo[] {
  return repos.filter((repo) => repo.indexed_at !== null && repo.access_status === 'active');
}

/** The repo named in the URL if it's viewable, else the first viewable one. */
export function pickRepo(repos: ConnectedRepo[], requested: string | null): ConnectedRepo | null {
  const viewable = viewableRepos(repos);
  return viewable.find((repo) => repo.repo_full_name === requested) ?? viewable[0] ?? null;
}
