import { describe, expect, it } from 'vitest';
import { groupByOwner, pickRepo, viewableRepos } from './lib';
import type { AvailableRepo, ConnectedRepo } from './types';

const repo = (name: string, overrides: Partial<ConnectedRepo> = {}): ConnectedRepo => {
  return {
    repo_full_name: name,
    default_branch: 'main',
    access_status: 'active',
    parse_status: 'done',
    parse_error: null,
    indexed_at: '2026-10-01T00:00:00Z',
    graph_stats: null,
    ...overrides,
  };
};

describe('viewableRepos', () => {
  it('keeps a repo being re-indexed, since its last graph is still there', () => {
    expect(viewableRepos([repo('acme/api', { parse_status: 'in_progress' })])).toHaveLength(1);
  });

  it('drops repos never indexed or no longer reachable', () => {
    const repos = [
      repo('acme/new', { indexed_at: null, parse_status: 'pending' }),
      repo('acme/gone', { access_status: 'revoked' }),
    ];
    expect(viewableRepos(repos)).toEqual([]);
  });
});

describe('pickRepo', () => {
  const fresh = repo('acme/new', { indexed_at: null, parse_status: 'pending' });
  const repos = [
    repo('acme/api'),
    repo('acme/web'),
    fresh,
    repo('acme/gone', { access_status: 'revoked' }),
  ];
  const pick = (requested: string | null, lastUsed: string | null = null) => {
    return pickRepo(repos, requested, lastUsed)?.repo_full_name;
  };

  it('opens the requested repo, even while its first index runs', () => {
    expect(pick('acme/web')).toBe('acme/web');
    expect(pick('acme/new')).toBe('acme/new');
  });

  it('never opens a repo whose access was lost', () => {
    expect(pick('acme/gone')).toBe('acme/api');
  });

  it('falls back to the last-used repo, and the URL wins over it', () => {
    expect(pick(null, 'acme/web')).toBe('acme/web');
    expect(pick('acme/api', 'acme/web')).toBe('acme/api');
  });

  it('ignores a last-used repo that was disconnected or lost access', () => {
    expect(pick(null, 'acme/deleted')).toBe('acme/api');
    expect(pick(null, 'acme/gone')).toBe('acme/api');
  });

  it('is null when nothing was asked for and nothing has a graph', () => {
    expect(pickRepo([fresh], null, null)).toBeNull();
  });
});

describe('groupByOwner', () => {
  const available = (full_name: string): AvailableRepo => {
    return {
      id: full_name.length,
      full_name,
      private: false,
      default_branch: 'main',
      installation_id: 1,
      connected: false,
    };
  };

  it('groups by owner, alphabetical regardless of case', () => {
    const groups = groupByOwner(
      ['zeta/web', 'beta/api', 'zeta/Api-gateway', 'Acme/site'].map(available),
    );
    expect(groups.map((group) => {
      return [
        group.owner,
        group.repos.map((r) => {
          return r.full_name;
        }),
      ];
    })).toEqual([
      ['Acme', ['Acme/site']],
      ['beta', ['beta/api']],
      ['zeta', ['zeta/Api-gateway', 'zeta/web']],
    ]);
  });
});
