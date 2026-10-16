import { describe, expect, it } from 'vitest';
import { hasRole, pickWorkspace } from './lib';
import type { Workspace } from './types';

const workspace = (id: string, personal = false): Workspace => {
  return {
    id,
    name: id,
    personal,
    role: 'member',
  };
};
const list = [workspace('acme'), workspace('me', true), workspace('beta')];

describe('pickWorkspace', () => {
  it('prefers the one asked for, then the last used, then the personal one', () => {
    expect(pickWorkspace(list, 'beta', 'acme')?.id).toBe('beta');
    expect(pickWorkspace(list, null, 'acme')?.id).toBe('acme');
    expect(pickWorkspace(list, null, null)?.id).toBe('me');
  });

  it('skips ids the user no longer belongs to', () => {
    expect(pickWorkspace(list, 'gone', 'also-gone')?.id).toBe('me');
  });

  it('falls back to the first without a personal workspace, and to null without any', () => {
    expect(pickWorkspace([workspace('acme')], null, null)?.id).toBe('acme');
    expect(pickWorkspace([], null, null)).toBeNull();
  });
});

describe('hasRole', () => {
  it('ranks owner over admin over member', () => {
    expect(hasRole('owner', 'admin')).toBe(true);
    expect(hasRole('admin', 'admin')).toBe(true);
    expect(hasRole('member', 'admin')).toBe(false);
    expect(hasRole(undefined, 'member')).toBe(false);
  });
});
