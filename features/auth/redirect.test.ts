import { describe, expect, it } from 'vitest';
import { DEFAULT_DESTINATION, safeDestination } from './redirect';

describe('safeDestination', () => {
  it('keeps same-site paths', () => {
    expect(safeDestination('/onboarding/jira?jira=connected')).toBe('/onboarding/jira?jira=connected');
  });

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', '', null, undefined])('rejects %s', (path) => {
    expect(safeDestination(path)).toBe(DEFAULT_DESTINATION);
  });
});
