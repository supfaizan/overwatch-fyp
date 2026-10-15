import { describe, expect, it } from 'vitest';
import { currentStep, isRunning, stepIndex } from './steps';
import type { OnboardingRepo, OnboardingStatus } from './types';

const repo = (
  parse_status: 'pending' | 'done',
  access_status: 'active' | 'revoked' = 'active',
): OnboardingRepo => ({
  repo_full_name: 'acme/api',
  parse_status,
  parse_error: null,
  access_status,
  graph_stats: null,
});

function status(
  overrides: {
    authorized?: boolean;
    repos?: OnboardingRepo[];
    project?: boolean;
    ready?: boolean;
    role?: OnboardingStatus['role'];
  } = {},
): OnboardingStatus {
  return {
    role: overrides.role ?? 'owner',
    github: {
      authorized: overrides.authorized ?? true,
      needs_reauth: false,
      repos: overrides.repos ?? [],
    },
    jira: {
      connected: Boolean(overrides.project),
      needs_reauth: false,
      project: overrides.project ? { key: 'OVR', sync_status: 'done', sync_error: null } : null,
    },
    ready: overrides.ready ?? false,
  };
}

describe('currentStep', () => {
  it('starts at GitHub until a repo is connected', () => {
    expect(currentStep(status(), false)).toBe('github');
    expect(currentStep(status({ authorized: false, repos: [repo('done')] }), false)).toBe('github');
  });

  it('asks for Jira next, unless it was skipped', () => {
    expect(currentStep(status({ repos: [repo('pending')] }), false)).toBe('jira');
    expect(currentStep(status({ repos: [repo('pending')] }), true)).toBe('indexing');
  });

  it('skips Jira for members, who cannot connect it', () => {
    expect(currentStep(status({ repos: [repo('pending')], role: 'member' }), false)).toBe(
      'indexing',
    );
    expect(currentStep(status({ repos: [repo('pending')], role: 'admin' }), false)).toBe('jira');
  });

  it('waits on indexing, then finishes', () => {
    expect(currentStep(status({ repos: [repo('pending')], project: true }), false)).toBe(
      'indexing',
    );
    expect(currentStep(status({ repos: [repo('done')], project: true, ready: true }), false)).toBe(
      'ready',
    );
  });
});

describe('helpers', () => {
  it('maps unknown segments to the first step', () => {
    expect(stepIndex('jira')).toBe(1);
    expect(stepIndex(undefined)).toBe(0);
  });

  it('treats queued and running work as running', () => {
    expect(isRunning({ parse_status: 'pending' })).toBe(true);
    expect(isRunning({ sync_status: 'in_progress' })).toBe(true);
    expect(isRunning({ parse_status: 'done' })).toBe(false);
    expect(isRunning(null)).toBe(false);
  });
});
