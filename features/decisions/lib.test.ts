import type { Evidence } from '@/shared/decisions/types';
import { describe, expect, it } from 'vitest';
import { citationsToCode, groupEvidence } from './lib';

const evidence = (id: string, refId: string, kind: Evidence['kind'] = 'document'): Evidence => {
  return {
    id,
    kind,
    ref_id: refId,
    quote: `quote ${id}`,
    stance: 'supports',
    note: null,
    title: `Source ${refId}`,
    external_url: null,
    board_id: null,
    item_key: null,
    added_by: 'u1',
    added_at: '2026-10-29T10:00:00Z',
    state: 'current',
    source_synced_at: null,
    match: null,
  };
};

describe('citationsToCode', () => {
  const ids = new Set(['S1', 'S2']);

  it('marks known citations, as written or as the editor escapes them', () => {
    expect(citationsToCode('Guests asked [S1] and \\[S2\\].', ids)).toBe(
      'Guests asked `S1` and `S2`.',
    );
  });

  it('leaves unknown citations, links and code alone', () => {
    expect(citationsToCode('See [S9] and [docs](https://x.test)', ids)).toBe(
      'See [S9] and [docs](https://x.test)',
    );
    expect(citationsToCode('`[S1]` and\n```\n[S2]\n```\nthen [S1]', ids)).toBe(
      '`[S1]` and\n```\n[S2]\n```\nthen `S1`',
    );
  });
});

describe('groupEvidence', () => {
  it('groups passages under their source, in source order, keeping cited-only sources', () => {
    const groups = groupEvidence({
      sources: [
        { id: 'S1', kind: 'document', ref_id: 'a', title: 'A' },
        { id: 'S2', kind: null, ref_id: null, title: 'Gone' },
        { id: 'S3', kind: 'work_item', ref_id: 'b', title: 'B' },
      ],
      evidence: [evidence('e1', 'b', 'work_item'), evidence('e2', 'a'), evidence('e3', 'a')],
    });

    expect(
      groups.map((group) => {
        return [
          group.source?.id,
          group.evidence.map((e) => {
            return e.id;
          }),
        ];
      }),
    ).toEqual([['S1', ['e2', 'e3']], ['S2', []], ['S3', ['e1']]]);
  });

  it('groups a decision from before sources were numbered by item or page', () => {
    const groups = groupEvidence({
      sources: [],
      evidence: [evidence('e1', 'a'), evidence('e2', 'b'), evidence('e3', 'a')],
    });

    expect(
      groups.map((group) => {
        return [group.source, group.evidence.length];
      }),
    ).toEqual([[null, 2], [null, 1]]);
  });
});
