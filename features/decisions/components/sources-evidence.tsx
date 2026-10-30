'use client';

import Button from '@/shared/components/button';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { useRemoveEvidence } from '@/shared/decisions/hooks';
import { EVIDENCE_STATE_LABELS, evidenceHref, isBroken, matchLabel } from '@/shared/decisions/lib';
import {
  type Decision,
  EVIDENCE_KIND,
  EVIDENCE_STANCE,
  EVIDENCE_STATE,
  type EvidenceKind,
  SYSTEM_USER,
} from '@/shared/decisions/types';
import { cn } from '@/shared/lib/cn';
import { timeAgo } from '@/shared/lib/time';
import { ArrowSquareOut, FileText, Ticket, Trash, Warning } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { groupEvidence, type SourceGroup } from '../lib';

/** A source card's element id, for its citations in the background to scroll to. */
export const sourceCardId = (sourceId: string) => {
  return `source-${sourceId}`;
};

const KIND_ICONS = { [EVIDENCE_KIND.workItem]: Ticket, [EVIDENCE_KIND.document]: FileText };

type SourcesEvidenceProps = {
  decision: Decision;
  /** The source a citation points at right now: its card is highlighted. */
  pointed: string | null;
};

/** The items and pages a decision rests on, numbered as its background cites them, each with the passages quoted from it. */
export default function SourcesEvidence({ decision, pointed }: SourcesEvidenceProps) {
  const groups = groupEvidence(decision);
  const passages = decision.evidence.length;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        Sources & evidence
        {groups.length > 0 && (
          <span className="font-normal text-muted">
            {' · '}
            {groups.length} {groups.length === 1 ? 'source' : 'sources'} · {passages}{' '}
            {passages === 1 ? 'passage' : 'passages'}
          </span>
        )}
      </h2>
      {groups.length === 0 && (
        <p className="text-sm text-muted">
          No passages yet. Record a decision from a ticket or docs page to quote it.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {groups.map((group) => {
          return (
            <SourceCard
              key={group.key}
              decisionId={decision.id}
              group={group}
              highlighted={group.source !== null && group.source.id === pointed}
            />
          );
        })}
      </ul>
    </section>
  );
}

function SourceCard(
  { decisionId, group, highlighted }: {
    decisionId: string;
    group: SourceGroup;
    highlighted: boolean;
  },
) {
  const remove = useRemoveEvidence();
  const [first] = group.evidence;
  const kind: EvidenceKind | null = group.source?.kind ?? first?.kind ?? null;
  const Icon = kind ? KIND_ICONS[kind] : FileText;
  const title = first?.title || group.source?.title || 'Untitled';
  // a cited page opens by its id; a cited ticket needs its key, which only a quote of it carries
  const href = first
    ? evidenceHref(first)
    : group.source?.kind === EVIDENCE_KIND.document
    ? `/documents/${group.source.ref_id}`
    : null;
  const broken = group.evidence.some(isBroken);
  const external = first?.external_url;

  return (
    <li
      id={group.source ? sourceCardId(group.source.id) : undefined}
      className={cn(
        'flex scroll-mt-4 flex-col gap-3 rounded-lg border p-3 transition-shadow',
        broken ? 'border-warning/50' : 'border-border',
        highlighted && 'ring-2 ring-primary',
      )}
    >
      <div className="flex items-center gap-2">
        {group.source && (
          <span className="rounded-full border border-border-strong bg-background px-1.5 font-mono text-xs font-medium text-muted">
            {group.source.id}
          </span>
        )}
        <Icon aria-hidden className="size-4 shrink-0 text-muted" />
        {href
          ? (
            <Link
              href={href}
              className="min-w-0 flex-1 truncate text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {title}
            </Link>
          )
          : <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>}
        {external && (
          <Tooltip content="Open the original">
            <Button size="sm" variant="tertiary" iconOnly aria-label="Open the original" asChild>
              <a href={external} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut aria-hidden />
              </a>
            </Button>
          </Tooltip>
        )}
      </div>
      {group.evidence.length === 0 && (
        <p className="text-xs text-muted">Cited in the background; no passage quoted from it.</p>
      )}
      {group.evidence.map((evidence) => {
        const brokenPassage = isBroken(evidence);
        return (
          <div key={evidence.id} className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <Tag variant={evidence.stance === EVIDENCE_STANCE.supports ? 'success' : 'danger'}>
                {evidence.stance === EVIDENCE_STANCE.supports ? 'Supports' : 'Contradicts'}
              </Tag>
              <blockquote className="min-w-0 flex-1 border-l-2 border-border-strong pl-3 text-sm whitespace-pre-wrap">
                {evidence.quote}
              </blockquote>
              <Tooltip content="Remove passage">
                <Button
                  size="sm"
                  variant="tertiary"
                  iconOnly
                  aria-label="Remove passage"
                  disabled={remove.isPending}
                  onClick={() => {
                    return remove.mutate({ id: decisionId, evidenceId: evidence.id });
                  }}
                >
                  <Trash aria-hidden />
                </Button>
              </Tooltip>
            </div>
            {evidence.note && <p className="text-sm text-muted">{evidence.note}</p>}
            <p
              className={cn(
                'flex items-center gap-1 text-xs',
                brokenPassage ? 'text-warning-strong' : 'text-muted',
              )}
            >
              {brokenPassage && <Warning aria-hidden />}
              {evidence.state !== EVIDENCE_STATE.current
                && `${EVIDENCE_STATE_LABELS[evidence.state]} · `}
              {evidence.added_by === SYSTEM_USER || evidence.match ? 'Found by a check' : 'Quoted'}
              {evidence.match && ` (${matchLabel(evidence.match)})`} {timeAgo(evidence.added_at)}
              {evidence.source_synced_at
                && ` · source synced ${timeAgo(evidence.source_synced_at)}`}
            </p>
          </div>
        );
      })}
    </li>
  );
}
