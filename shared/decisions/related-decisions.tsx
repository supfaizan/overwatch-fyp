'use client';

import Button from '@/shared/components/button';
import Skeleton from '@/shared/components/skeleton';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { Plus, Sparkle, Warning } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useState } from 'react';
import { useDecisions, useSuggestDecisions } from './hooks';
import { EVIDENCE_STATE_LABELS, isBroken, STATUS_LABELS, STATUS_TAGS } from './lib';
import RecordDecisionDialog, { type DecisionSource } from './record-decision-dialog';

type RelatedDecisionsProps = {
  source: DecisionSource;
  /** Read when recording starts, e.g. the text selected on the page, to quote. */
  readQuote?: () => string;
};

/** The decisions quoting an item or page, and a way to record one from it. */
export default function RelatedDecisions({ source, readQuote }: RelatedDecisionsProps) {
  const decisions = useDecisions({ ref_id: source.refId });
  const suggest = useSuggestDecisions();
  // a fresh dialog per open, holding the quote read as it opened
  const [recording, setRecording] = useState<{ key: number; quote: string } | null>(null);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Decisions</h3>
        <div className="flex gap-1">
          <Tooltip content="The AI drafts the decisions this states, for you to review">
            <Button
              size="sm"
              variant="tertiary"
              loading={suggest.isPending}
              onClick={() => {
                return suggest.mutate({ kind: source.kind, ref_id: source.refId });
              }}
            >
              <Sparkle aria-hidden />
              Suggest
            </Button>
          </Tooltip>
          <Button
            size="sm"
            variant="tertiary"
            // mouse down, before the click moves focus and clears the selection being quoted
            onMouseDown={() => {
              setRecording({ key: Date.now(), quote: readQuote?.() ?? '' });
            }}
            onClick={() => {
              setRecording((current) => {
                return current ?? { key: Date.now(), quote: readQuote?.() ?? '' };
              });
            }}
          >
            <Plus aria-hidden />
            Record
          </Button>
        </div>
      </div>
      {decisions.isPending && <Skeleton className="h-10 w-full" />}
      {decisions.isError && <p className="text-xs text-danger">{decisions.error.message}</p>}
      {decisions.data?.length === 0 && (
        <p className="text-xs text-muted">No decisions quote this yet.</p>
      )}
      {decisions.data && decisions.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {decisions.data.map((decision) => {
            // this source no longer says what the decision quoted from it
            const stale = decision.evidence.find((evidence) => {
              return evidence.ref_id === source.refId && isBroken(evidence);
            });
            return (
              <li key={decision.id} className="flex flex-col gap-1">
                <Link
                  href={`/decisions/${decision.id}`}
                  className="flex items-start justify-between gap-2 text-sm hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span className="min-w-0 truncate">{decision.title}</span>
                  <Tag variant={STATUS_TAGS[decision.status]}>{STATUS_LABELS[decision.status]}</Tag>
                </Link>
                {stale && (
                  <span className="flex items-center gap-1 text-xs text-warning-strong">
                    <Warning aria-hidden />
                    {EVIDENCE_STATE_LABELS[stale.state]}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {recording && (
        <RecordDecisionDialog
          key={recording.key}
          open
          onOpenChange={(open) => {
            if (!open) {
              setRecording(null);
            }
          }}
          source={source}
          quote={recording.quote}
        />
      )}
    </section>
  );
}
