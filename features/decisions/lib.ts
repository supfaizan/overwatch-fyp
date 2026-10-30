import type { Decision, DecisionSource, Evidence } from '@/shared/decisions/types';

const CITATION_RE = /\\?\[(S\d+)\\?\]/g;
// code is left as written: a citation inside it is an example, not a reference
const CODE_RE = /(```[\s\S]*?```|`[^`\n]*`)/;

/** `markdown` with each citation of a known source (`[S1]`, or `\[S1\]` as the editor saves it) as inline code `S1`, for `Markdown` to render as a chip. */
export function citationsToCode(markdown: string, sourceIds: ReadonlySet<string>): string {
  return markdown.split(CODE_RE).map((part, index) => {
    // split with a capture group: odd parts are the code
    return index % 2
      ? part
      : part.replace(CITATION_RE, (whole, id: string) => {
        return sourceIds.has(id) ? `\`${id}\`` : whole;
      });
  }).join('');
}

/** One source and the passages quoted from it; `source` is null for evidence of a decision from before sources were numbered. */
export type SourceGroup = { key: string; source: DecisionSource | null; evidence: Evidence[] };

/** The decision's evidence grouped by the item or page it quotes, in its sources' order (S1 first); a source it only cites has no passages. */
export function groupEvidence(decision: Pick<Decision, 'sources' | 'evidence'>): SourceGroup[] {
  const sourceKey = (kind: string | null, refId: string | null) => {
    return `${kind}:${refId}`;
  };
  const groups = new Map<string, SourceGroup>();
  for (const source of decision.sources) {
    const key = source.ref_id ? sourceKey(source.kind, source.ref_id) : source.id;
    groups.set(key, { key, source, evidence: [] });
  }
  for (const evidence of decision.evidence) {
    const key = sourceKey(evidence.kind, evidence.ref_id);
    const group = groups.get(key) ?? { key, source: null, evidence: [] };
    group.evidence.push(evidence);
    groups.set(key, group);
  }
  return [...groups.values()];
}
