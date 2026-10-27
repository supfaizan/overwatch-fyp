import { describe, expect, it } from 'vitest';
import { evidenceHref, inboxTab } from './lib';
import type { Decision, Evidence } from './types';

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
    ...overrides,
  };
};

const decision = (overrides: Partial<Decision> = {}): Decision => {
  return {
    id: 'd1',
    title: 't',
    statement: 's',
    context_md: null,
    area: null,
    status: 'open',
    origin: 'manual',
    owner_id: null,
    review_by: null,
    superseded_by: null,
    evidence: [],
    history: [],
    created_by: 'u1',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    ...overrides,
  };
};

describe('inboxTab', () => {
  const today = '2026-10-27';

  it('puts proposals, owned or due open decisions and accepted ones with broken evidence in Needs you', () => {
    expect(inboxTab(decision({ status: 'proposed' }), 'me', today)).toBe('needs_you');
    expect(inboxTab(decision({ owner_id: 'me' }), 'me', today)).toBe('needs_you');
    expect(inboxTab(decision({ review_by: today }), 'me', today)).toBe('needs_you');
    expect(
      inboxTab(
        decision({ status: 'accepted', evidence: [evidence({ state: 'source_gone' })] }),
        'me',
        today,
      ),
    ).toBe('needs_you');
  });

  it('puts an accepted decision contradicted since it was settled in Needs you, until it is settled again', () => {
    const contradicted = evidence({ stance: 'contradicts', added_at: '2026-10-20T00:00:00Z' });
    const accepted = { status: 'accepted', by: 'u1', note: null } as const;

    expect(
      inboxTab(
        decision({
          status: 'accepted',
          evidence: [contradicted],
          history: [{ ...accepted, at: '2026-10-10T00:00:00Z' }],
        }),
        'me',
        today,
      ),
    ).toBe('needs_you');
    expect(
      inboxTab(
        decision({
          status: 'accepted',
          evidence: [contradicted],
          history: [{ ...accepted, at: '2026-10-25T00:00:00Z' }],
        }),
        'me',
        today,
      ),
    ).toBe('decided');
  });

  it('keeps other open decisions in Open and settled ones in Decided', () => {
    expect(inboxTab(decision({ owner_id: 'else', review_by: '2026-11-01' }), 'me', today)).toBe(
      'open',
    );
    expect(
      inboxTab(
        decision({ status: 'accepted', evidence: [evidence({ state: 'changed' })] }),
        'me',
        today,
      ),
    )
      .toBe('decided');
    expect(inboxTab(decision({ status: 'superseded' }), 'me', today)).toBe('decided');
  });
});

describe('evidenceHref', () => {
  it('opens a page by id and a board item on its board', () => {
    expect(evidenceHref(evidence())).toBe('/documents/p1');
    expect(evidenceHref(evidence({ kind: 'work_item', board_id: 'b1', item_key: 'KAN-4' })))
      .toBe('/board?board=b1&item=KAN-4');
  });
});
