'use client';

import Banner from '@/shared/components/banner';
import BarChart, { type BarChartSeries } from '@/shared/components/bar-chart';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import SegmentedButton from '@/shared/components/segmented-button';
import Skeleton from '@/shared/components/skeleton';
import { SYSTEM_USER } from '@/shared/decisions/types';
import { displayName } from '@/shared/session/lib';
import { useWorkspaceMembers } from '@/shared/workspaces/hooks';
import { CaretDown } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import { useUsage } from '../hooks';
import { formatCost, formatTokens, isWeekly, usageBuckets } from '../lib';
import { USAGE_FEATURE, type UsageFeature, type UsageSummary } from '../types';
import { SettingsSection } from './settings-layout';
import UsageLimits from './usage-limits';

const PERIODS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

const SPLIT = { feature: 'feature', member: 'member' } as const;
type Split = (typeof SPLIT)[keyof typeof SPLIT];
const SPLITS = [
  { value: SPLIT.feature, label: 'By feature' },
  { value: SPLIT.member, label: 'By member' },
];

const FEATURE_LABELS: Record<UsageFeature, string> = {
  chat: 'AI chat',
  decision_suggest: 'Decision suggestions',
  decision_check: 'Decision checks',
  embeddings: 'Search by meaning',
};

// each feature keeps its colour whatever the period or filter
const FEATURE_SERIES: BarChartSeries[] = [
  { key: USAGE_FEATURE.chat, label: FEATURE_LABELS.chat, color: 'var(--color-chart-1)' },
  {
    key: USAGE_FEATURE.decisionSuggest,
    label: FEATURE_LABELS.decision_suggest,
    color: 'var(--color-chart-2)',
  },
  {
    key: USAGE_FEATURE.decisionCheck,
    label: FEATURE_LABELS.decision_check,
    color: 'var(--color-chart-3)',
  },
  {
    key: USAGE_FEATURE.embeddings,
    label: FEATURE_LABELS.embeddings,
    color: 'var(--color-chart-4)',
  },
];

// the busiest members get their own colour; everyone else is "Other"
const MEMBER_COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)'];
const OTHER = 'other';

const dayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const longDayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

/** A `YYYY-MM-DD` day as a local date, so formatting doesn't shift it a day. */
const parseDay = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
};

export default function UsageSection() {
  return (
    <SettingsSection
      title="Usage"
      description="How much AI this workspace uses, and what's left of its limits."
    >
      <UsageLimits />
      <UsageHistory />
    </SettingsSection>
  );
}

function UsageHistory() {
  const [days, setDays] = useState('30');
  const [split, setSplit] = useState<Split>(SPLIT.feature);
  const usage = useUsage(Number(days));

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">History</h2>
        <div className="flex flex-wrap gap-2">
          <SegmentedButton
            aria-label="Split by"
            size="sm"
            options={SPLITS}
            value={split}
            onValueChange={setSplit}
          />
          <SegmentedButton
            aria-label="Period"
            size="sm"
            options={PERIODS}
            value={days}
            onValueChange={setDays}
          />
        </div>
      </header>
      {usage.isPending && <Skeleton className="h-80 w-full" />}
      {usage.isError && (
        <Banner
          type="error"
          action={
            <Button
              size="sm"
              onClick={() => {
                return usage.refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          {usage.error.message}
        </Banner>
      )}
      {usage.data && <UsageDetails summary={usage.data} split={split} />}
    </section>
  );
}

function UsageDetails({ summary, split }: { summary: UsageSummary; split: Split }) {
  // names for the member rows; the usage itself doesn't wait for them
  const members = useWorkspaceMembers();
  const nameOf = (userId: string) => {
    const member = members.data?.find((m) => {
      return m.user_id === userId;
    });
    if (member) {
      return displayName(member);
    }
    // the automatic decision checks, which no member runs
    return userId === SYSTEM_USER ? 'Automatic checks' : 'Former member';
  };

  const { total } = summary;
  if (total.calls === 0) {
    return (
      <Card className="text-sm text-muted">
        No AI use in the last {summary.days}{' '}
        days. Ask the AI chat or suggest decisions, and it shows up here.
      </Card>
    );
  }

  const busiest = [...summary.by_member].sort((a, b) => {
    return b.calls - a.calls;
  });
  const named = busiest.slice(0, MEMBER_COLORS.length);
  const memberSeries: BarChartSeries[] = [
    ...named.map((member, index) => {
      return { key: member.user_id, label: nameOf(member.user_id), color: MEMBER_COLORS[index] };
    }),
    ...(busiest.length > named.length
      ? [{ key: OTHER, label: 'Everyone else', color: 'var(--color-chart-other)' }]
      : []),
  ];
  const namedIds = new Set(named.map((member) => {
    return member.user_id;
  }));
  const weekly = isWeekly(summary.days);
  const data = usageBuckets(summary, new Date()).map((bucket) => {
    const byMember: Record<string, number> = {};
    for (const [userId, calls] of Object.entries(bucket.byMember)) {
      const key = namedIds.has(userId) ? userId : OTHER;
      byMember[key] = (byMember[key] ?? 0) + calls;
    }
    const start = parseDay(bucket.start);
    return {
      key: bucket.start,
      tick: dayFormat.format(start),
      label: weekly
        ? dayFormat.formatRange(start, parseDay(bucket.end))
        : longDayFormat.format(start),
      values: split === SPLIT.feature ? bucket.byFeature : byMember,
    };
  });
  const activeMembers = summary.by_member.filter((member) => {
    return member.user_id !== SYSTEM_USER;
  }).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="AI calls" value={total.calls.toLocaleString('en')} />
        <Stat label="Cost" value={formatCost(total.cost_usd)} />
        <Stat label="Members using AI" value={activeMembers.toLocaleString('en')} />
      </div>
      <Card className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">
          AI calls per {weekly ? 'week' : 'day'}
          <span className="font-normal text-muted">
            {' · '}days in {summary.time_zone.replaceAll('_', ' ')}
          </span>
        </h3>
        <BarChart
          aria-label={`AI calls per ${weekly ? 'week' : 'day'}, by ${split}`}
          data={data}
          series={split === SPLIT.feature ? FEATURE_SERIES : memberSeries}
        />
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <ShareList
          title="By feature"
          rows={FEATURE_SERIES.flatMap((series) => {
            const row = summary.by_feature.find((f) => {
              return f.feature === series.key;
            });
            return row ? [{ ...series, calls: row.calls, cost: row.cost_usd }] : [];
          })}
          total={total.calls}
        />
        <ShareList
          title="By member"
          rows={busiest.map((member) => {
            const series = memberSeries.find((s) => {
              return s.key === member.user_id;
            });
            return {
              key: member.user_id,
              label: nameOf(member.user_id),
              color: series?.color ?? 'var(--color-chart-other)',
              calls: member.calls,
              cost: member.cost_usd,
            };
          })}
          total={total.calls}
        />
      </div>
      <TokenDetails summary={summary} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </Card>
  );
}

/** Who or what used the most, each with its share of the period's calls. */
function ShareList(
  { title, rows, total }: {
    title: string;
    rows: { key: string; label: string; color: string; calls: number; cost: number }[];
    total: number;
  },
) {
  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="flex flex-col gap-3">
        {[...rows].sort((a, b) => {
          return b.calls - a.calls;
        }).map((row) => {
          const share = Math.round((row.calls / total) * 100);
          return (
            <li key={row.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">{row.label}</span>
                <span className="shrink-0 text-xs text-muted tabular-nums">
                  {row.calls.toLocaleString('en')} calls · {formatCost(row.cost)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill-active">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${share}%`, background: row.color }}
                  />
                </div>
                <span className="w-9 text-right text-xs tabular-nums">{share}%</span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Tokens per feature, for whoever wants the raw numbers; folded away by default. */
function TokenDetails({ summary }: { summary: UsageSummary }) {
  return (
    <details className="group rounded-lg border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-semibold hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        Token details
        <CaretDown
          aria-hidden
          className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <p className="px-4 pb-2 text-xs text-muted">
        Search by meaning reads a lot of text but costs very little, so tokens say more about what
        was read than what was spent.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="px-4 py-2 text-left font-medium">Feature</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Tokens in</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Cached</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Tokens out</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border border-t border-border tabular-nums">
            {summary.by_feature.map((row) => {
              return (
                <tr key={row.feature}>
                  <th scope="row" className="px-4 py-2 text-left font-normal">
                    {FEATURE_LABELS[row.feature] ?? row.feature}
                  </th>
                  <td className="px-4 py-2 text-right">{formatTokens(row.prompt_tokens)}</td>
                  <td className="px-4 py-2 text-right">{formatTokens(row.cached_tokens)}</td>
                  <td className="px-4 py-2 text-right">{formatTokens(row.completion_tokens)}</td>
                  <td className="px-4 py-2 text-right">{formatCost(row.cost_usd)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
