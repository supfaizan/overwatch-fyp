import { describe, expect, it } from 'vitest';
import type { ConnectedRepo } from '../types';
import { pickRepo, viewableRepos } from './repos';

const repo = (name: string, overrides: Partial<ConnectedRepo> = {}): ConnectedRepo => ({
  repo_full_name: name,
  default_branch: 'main',
  access_status: 'active',
  parse_status: 'done',
  parse_error: null,
  indexed_at: '2026-10-01T00:00:00Z',
  ...overrides,
});

describe('viewableRepos', () => {
  it('keeps a repo being re-indexed, since its last graph is still there', () => {
    expect(viewableRepos([repo('acme/api', { parse_status: 'in_progress' })])).toHaveLength(1);
  });

  it('drops repos never indexed or no longer reachable', () => {
    const repos = [repo('acme/new', { indexed_at: null, parse_status: 'pending' }), repo('acme/gone', { access_status: 'revoked' })];
    expect(viewableRepos(repos)).toEqual([]);
  });
});

describe('pickRepo', () => {
  const repos = [repo('acme/api'), repo('acme/web'), repo('acme/gone', { access_status: 'revoked' })];

  it('uses the repo named in the URL', () => {
    expect(pickRepo(repos, 'acme/web')?.repo_full_name).toBe('acme/web');
  });

  it('falls back to the first viewable repo for a missing, unknown or unviewable name', () => {
    expect(pickRepo(repos, null)?.repo_full_name).toBe('acme/api');
    expect(pickRepo(repos, 'other/repo')?.repo_full_name).toBe('acme/api');
    expect(pickRepo(repos, 'acme/gone')?.repo_full_name).toBe('acme/api');
  });

  it('is null when nothing is viewable', () => {
    expect(pickRepo([repo('acme/new', { indexed_at: null })], 'acme/new')).toBeNull();
  });
});
