'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import Checkbox from '@/shared/components/checkbox';
import { Input } from '@/shared/components/input';
import SegmentedButton from '@/shared/components/segmented-button';
import Skeleton from '@/shared/components/skeleton';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { useDecisionPages, useDismissSuggestions, useInboxCounts } from '@/shared/decisions/hooks';
import {
  hasBrokenEvidence,
  isAwaitingReview,
  localToday,
  STATUS_LABELS,
  STATUS_TAGS,
} from '@/shared/decisions/lib';
import RecordDecisionDialog from '@/shared/decisions/record-decision-dialog';
import { type Decision, DECISION_ORIGIN, INBOX_TAB, type InboxTab } from '@/shared/decisions/types';
import { timeAgo } from '@/shared/lib/time';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import {
  BookOpenText,
  MagnifyingGlass,
  Plus,
  Quotes,
  Robot,
  Warning,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import ChecksBar from './components/checks-bar';
import { useUpdateOverview } from './hooks';

export { default as DecisionView } from './components/decision-view';

const TAB_LABELS: Record<InboxTab, string> = {
  needs_you: 'Needs you',
  open: 'Open',
  decided: 'Decided',
};
const SEARCH_DELAY_MS = 300;
const EMPTY: Record<InboxTab, string> = {
  needs_you: 'Nothing is waiting on you.',
  open: 'No open decisions.',
  decided: 'Nothing decided yet.',
};

/** The Decisions inbox: what needs a call from you, what's still open, and what was decided. */
export default function DecisionsInbox() {
  const router = useRouter();
  const [tab, setTab] = useState<InboxTab>(INBOX_TAB.needsYou);
  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const [recording, setRecording] = useState(false);
  const overview = useUpdateOverview();
  const counts = useInboxCounts();
  const [fromTools, setFromTools] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const dismiss = useDismissSuggestions();
  // a search looks through every tab
  const decisions = useDecisionPages({
    ...(query ? { q: query } : { tab, today: localToday() }),
    ...(fromTools && { origin: DECISION_ORIGIN.agent }),
  });
  // only what's still listed can be dismissed
  const chosen = selected.filter((id) => {
    return decisions.decisions.some((decision) => {
      return decision.id === id;
    });
  });
  const toggle = (id: string) => {
    return setSelected((ids) => {
      return ids.includes(id)
        ? ids.filter((other) => {
          return other !== id;
        })
        : [...ids, id];
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pt-4 pb-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Decisions</h1>
            <p className="text-sm text-muted">
              What the team agreed, and the passages in tickets and docs it rests on.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tooltip content="A docs page of the accepted decisions by area, with their sources">
              <Button
                loading={overview.isPending}
                onClick={() => {
                  return overview.mutate();
                }}
              >
                <BookOpenText aria-hidden />
                Product overview
              </Button>
            </Tooltip>
            <Button
              variant="primary"
              onClick={() => {
                return setRecording(true);
              }}
            >
              <Plus aria-hidden />
              Record decision
            </Button>
          </div>
        </header>
        <ChecksBar />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedButton
            aria-label="Show"
            options={Object.values(INBOX_TAB).map((value) => {
              const count = counts.data?.[value];
              return {
                value,
                label: count ? `${TAB_LABELS[value]} (${count})` : TAB_LABELS[value],
              };
            })}
            value={tab}
            onValueChange={setTab}
          />
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button
              aria-pressed={fromTools}
              variant={fromTools ? 'primary' : 'secondary'}
              onClick={() => {
                return setFromTools((on) => {
                  return !on;
                });
              }}
            >
              <Robot aria-hidden />
              From AI tools
            </Button>
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
        </div>
        {chosen.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-2 text-sm">
            <span>{chosen.length} selected</span>
            <span className="flex gap-2">
              <Button
                size="sm"
                variant="tertiary"
                onClick={() => {
                  return setSelected([]);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                loading={dismiss.isPending}
                onClick={() => {
                  return dismiss.mutate(chosen, {
                    onSuccess: () => {
                      return setSelected([]);
                    },
                  });
                }}
              >
                Not decisions
              </Button>
            </span>
          </div>
        )}
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
        {decisions.isSuccess && (decisions.decisions.length
          ? (
            <Card className="p-0">
              <ul className="divide-y divide-border">
                {decisions.decisions.map((decision) => {
                  return (
                    <DecisionRow
                      key={decision.id}
                      decision={decision}
                      selected={chosen.includes(decision.id)}
                      onToggle={toggle}
                    />
                  );
                })}
              </ul>
              {decisions.hasNextPage && (
                <LoadMore
                  loading={decisions.isFetchingNextPage}
                  onLoadMore={() => {
                    return void decisions.fetchNextPage();
                  }}
                />
              )}
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

/** Loads the next page once it scrolls into view; a button too, for keyboards and screen readers. */
function LoadMore({ loading, onLoadMore }: { loading: boolean; onLoadMore: () => void }) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !sentinel.current) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        return entry.isIntersecting && onLoadMore();
      },
      { rootMargin: '0px 0px 200px 0px' },
    );
    observer.observe(sentinel.current);
    return () => {
      return observer.disconnect();
    };
  }, [loading, onLoadMore]);

  return (
    <div ref={sentinel} className="flex justify-center border-t border-border p-2">
      <Button size="sm" variant="tertiary" loading={loading} onClick={onLoadMore}>
        Load more
      </Button>
    </div>
  );
}

function DecisionRow(
  { decision, selected, onToggle }: {
    decision: Decision;
    selected: boolean;
    onToggle: (id: string) => void;
  },
) {
  return (
    <li className="flex items-start">
      {/* only an AI draft nobody settled can be dismissed, so only those can be picked */}
      {isAwaitingReview(decision) && (
        <Checkbox
          className="mt-3.5 ml-4"
          aria-label={`Select ${decision.title}`}
          checked={selected}
          onCheckedChange={() => {
            return onToggle(decision.id);
          }}
        />
      )}
      <Link
        href={`/decisions/${decision.id}`}
        className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3 transition-colors hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-medium">
            {decision.key && <span className="mr-2 font-normal text-muted">{decision.key}</span>}
            {decision.title}
          </span>
          <Tag variant={STATUS_TAGS[decision.status]}>{STATUS_LABELS[decision.status]}</Tag>
        </span>
        <span className="line-clamp-2 text-sm text-muted">{decision.statement}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {decision.area && <Tag>{decision.area}</Tag>}
          <span className="flex items-center gap-1">
            <Quotes aria-hidden />
            {decision.evidence.length} {decision.evidence.length === 1 ? 'passage' : 'passages'}
          </span>
          {(hasBrokenEvidence(decision) || decision.needs_attention) && (
            <span className="flex items-center gap-1 text-warning-strong">
              <Warning aria-hidden />
              {hasBrokenEvidence(decision) ? 'Evidence changed' : 'New contradiction'}
            </span>
          )}
          {decision.capture && (
            <span className="flex items-center gap-1">
              <Robot aria-hidden />
              via {decision.capture.client}
            </span>
          )}
          <span>Updated {timeAgo(decision.updated_at)}</span>
        </span>
      </Link>
    </li>
  );
}
