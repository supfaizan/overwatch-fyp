'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import { Input } from '@/shared/components/input';
import SegmentedButton from '@/shared/components/segmented-button';
import Skeleton from '@/shared/components/skeleton';
import Tag from '@/shared/components/tag';
import { useDecisions } from '@/shared/decisions/hooks';
import {
  hasBrokenEvidence,
  INBOX_TAB,
  type InboxTab,
  inboxTab,
  localToday,
  STATUS_LABELS,
  STATUS_TAGS,
} from '@/shared/decisions/lib';
import RecordDecisionDialog from '@/shared/decisions/record-decision-dialog';
import type { Decision } from '@/shared/decisions/types';
import { timeAgo } from '@/shared/lib/time';
import { useSession } from '@/shared/session/store';
import { MagnifyingGlass, Plus, Quotes, Warning } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export { default as DecisionView } from './components/decision-view';

const TAB_LABELS: Record<InboxTab, string> = {
  needs_you: 'Needs you',
  open: 'Open',
  decided: 'Decided',
};
const EMPTY: Record<InboxTab, string> = {
  needs_you: 'Nothing is waiting on you.',
  open: 'No open decisions.',
  decided: 'Nothing decided yet.',
};

/** The Decisions inbox: what needs a call from you, what's still open, and what was decided. */
export default function DecisionsInbox() {
  const router = useRouter();
  const userId = useSession((state) => {
    return state.user?.id;
  });
  const decisions = useDecisions();
  const [tab, setTab] = useState<InboxTab>(INBOX_TAB.needsYou);
  const [search, setSearch] = useState('');
  const [recording, setRecording] = useState(false);

  const today = localToday();
  const query = search.trim().toLowerCase();
  const byTab = (wanted: InboxTab) => {
    return (decisions.data ?? []).filter((decision) => {
      return inboxTab(decision, userId, today) === wanted;
    });
  };
  // a search looks through every tab
  const shown = query
    ? (decisions.data ?? []).filter((decision) => {
      return `${decision.title} ${decision.statement} ${decision.area ?? ''}`.toLowerCase()
        .includes(query);
    })
    : byTab(tab);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Decisions</h1>
            <p className="text-sm text-muted">
              What the team agreed, and the passages in tickets and docs it rests on.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              return setRecording(true);
            }}
          >
            <Plus aria-hidden />
            Record decision
          </Button>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedButton
            aria-label="Show"
            options={Object.values(INBOX_TAB).map((value) => {
              const count = byTab(value).length;
              return {
                value,
                label: count ? `${TAB_LABELS[value]} (${count})` : TAB_LABELS[value],
              };
            })}
            value={tab}
            onValueChange={setTab}
          />
          <Input
            aria-label="Search decisions"
            placeholder="Search"
            prefix={<MagnifyingGlass aria-hidden />}
            className="w-full sm:w-64"
            value={search}
            onChange={(e) => {
              return setSearch(e.target.value);
            }}
          />
        </div>
        {decisions.isPending && <Skeleton className="h-48 w-full" />}
        {decisions.isError && (
          <Banner
            type="error"
            action={
              <Button
                size="sm"
                onClick={() => {
                  return decisions.refetch();
                }}
              >
                Retry
              </Button>
            }
          >
            {decisions.error.message}
          </Banner>
        )}
        {decisions.data && (shown.length
          ? (
            <Card className="p-0">
              <ul className="divide-y divide-border">
                {shown.map((decision) => {
                  return <DecisionRow key={decision.id} decision={decision} />;
                })}
              </ul>
            </Card>
          )
          : (
            <Card className="text-sm text-muted">
              {query ? 'No decisions match that search.' : EMPTY[tab]}
            </Card>
          ))}
      </div>
      {recording && (
        <RecordDecisionDialog
          open
          onOpenChange={setRecording}
          onRecorded={(id) => {
            return router.push(`/decisions/${id}`);
          }}
        />
      )}
    </div>
  );
}

function DecisionRow({ decision }: { decision: Decision }) {
  return (
    <li>
      <Link
        href={`/decisions/${decision.id}`}
        className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-medium">{decision.title}</span>
          <Tag variant={STATUS_TAGS[decision.status]}>{STATUS_LABELS[decision.status]}</Tag>
        </span>
        <span className="line-clamp-2 text-sm text-muted">{decision.statement}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {decision.area && <Tag>{decision.area}</Tag>}
          <span className="flex items-center gap-1">
            <Quotes aria-hidden />
            {decision.evidence.length} {decision.evidence.length === 1 ? 'passage' : 'passages'}
          </span>
          {hasBrokenEvidence(decision) && (
            <span className="flex items-center gap-1 text-warning-strong">
              <Warning aria-hidden />
              Evidence changed
            </span>
          )}
          <span>Updated {timeAgo(decision.updated_at)}</span>
        </span>
      </Link>
    </li>
  );
}
