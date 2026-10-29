'use client';

import Button from '@/shared/components/button';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { useRemoveEvidence } from '@/shared/decisions/hooks';
import { EVIDENCE_STATE_LABELS, evidenceHref, isBroken, matchLabel } from '@/shared/decisions/lib';
import {
  type Decision,
  EVIDENCE_STANCE,
  EVIDENCE_STATE,
  SYSTEM_USER,
} from '@/shared/decisions/types';
import { cn } from '@/shared/lib/cn';
import { timeAgo } from '@/shared/lib/time';
import { Trash, Warning } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

/** The passages a decision rests on, each with what has become of its source since. */
export default function EvidenceList({ decision }: { decision: Decision }) {
  const remove = useRemoveEvidence();

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">Evidence</h2>
      {decision.evidence.length === 0 && (
        <p className="text-sm text-muted">
          No passages yet. Record a decision from a ticket or docs page to quote it.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {decision.evidence.map((evidence) => {
          const broken = isBroken(evidence);
          return (
            <li
              key={evidence.id}
              className={cn(
                'flex flex-col gap-2 rounded-lg border p-3',
                broken ? 'border-warning/50' : 'border-border',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Tag variant={evidence.stance === EVIDENCE_STANCE.supports ? 'success' : 'danger'}>
                  {evidence.stance === EVIDENCE_STANCE.supports ? 'Supports' : 'Contradicts'}
                </Tag>
                <Link
                  href={evidenceHref(evidence)}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {evidence.title || 'Untitled'}
                </Link>
                <Tooltip content="Remove passage">
                  <Button
                    size="sm"
                    variant="tertiary"
                    iconOnly
                    aria-label="Remove passage"
                    disabled={remove.isPending}
                    onClick={() => {
                      return remove.mutate({ id: decision.id, evidenceId: evidence.id });
                    }}
                  >
                    <Trash aria-hidden />
                  </Button>
                </Tooltip>
              </div>
              <blockquote className="border-l-2 border-border-strong pl-3 text-sm whitespace-pre-wrap">
                {evidence.quote}
              </blockquote>
              {evidence.note && <p className="text-sm text-muted">{evidence.note}</p>}
              <p
                className={cn(
                  'flex items-center gap-1 text-xs',
                  broken ? 'text-warning-strong' : 'text-muted',
                )}
              >
                {broken && <Warning aria-hidden />}
                {evidence.state !== EVIDENCE_STATE.current
                  && `${EVIDENCE_STATE_LABELS[evidence.state]} · `}
                {evidence.added_by === SYSTEM_USER || evidence.match
                  ? 'Found by a check'
                  : 'Quoted'}
                {evidence.match && ` (${matchLabel(evidence.match)})`} {timeAgo(evidence.added_at)}
                {evidence.source_synced_at
                  && ` · source synced ${timeAgo(evidence.source_synced_at)}`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
