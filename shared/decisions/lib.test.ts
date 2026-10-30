import { describe, expect, it } from 'vitest';
import { evidenceHref, matchLabel } from './lib';
import type { Evidence } from './types';

const evidence = (overrides: Partial<Evidence> = {}): Evidence => {
  return {
    id: 'e1',
    kind: 'document',
    ref_id: 'p1',
    quote: 'q',
    stance: 'supports',
    note: null,
    title: 'PRD',
    external_url: null,
    board_id: null,
    item_key: null,
    added_by: 'u1',
    added_at: '2026-10-01T00:00:00Z',
    state: 'current',
    source_synced_at: null,
    match: null,
    ...overrides,
  };
};

describe('evidenceHref', () => {
  it('opens a page by id and a board item on its board', () => {
    expect(evidenceHref(evidence())).toBe('/documents/p1');
    expect(evidenceHref(evidence({ kind: 'work_item', board_id: 'b1', item_key: 'KAN-4' })))
      .toBe('/board?board=b1&item=KAN-4');
  });
});

describe('matchLabel', () => {
  it('says why a check read the source', () => {
    expect(matchLabel({ reason: 'mentioned', detail: 'DEV-12' })).toBe('mentions DEV-12');
    expect(matchLabel({ reason: 'linked', detail: null })).toBe('linked to a quoted item');
    expect(matchLabel({ reason: 'similar', detail: '0.71' })).toBe('similar in meaning');
  });
});
