'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import SegmentedButton from '@/shared/components/segmented-button';
import Skeleton from '@/shared/components/skeleton';
import { SYSTEM_USER } from '@/shared/decisions/types';
import { displayName } from '@/shared/session/lib';
import { useWorkspaceMembers } from '@/shared/workspaces/hooks';
import { useState } from 'react';
import { useUsage } from '../hooks';
import { formatCost, formatTokens } from '../lib';
import type { UsageFeature, UsageSummary, UsageTotals } from '../types';
import { SettingsSection } from './settings-layout';

const PERIODS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

const FEATURE_LABELS: Record<UsageFeature, string> = {
  chat: 'AI chat',
  decision_suggest: 'Decision suggestions',
  decision_check: 'Decision checks',
  embeddings: 'Search by meaning',
};

type Row = { key: string; label: string; totals: UsageTotals };

export default function UsageSection() {
  const [days, setDays] = useState('30');
  const usage = useUsage(Number(days));

  return (
    <SettingsSection
      title="Usage"
      description="AI usage in this workspace: what each feature and member used, and what it cost."
      action={
        <SegmentedButton
          aria-label="Period"
          size="sm"
          options={PERIODS}
          value={days}
          onValueChange={setDays}
        />
      }
    >
      {usage.isPending && <Skeleton className="h-64 w-full" />}
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
      {usage.data && <UsageDetails summary={usage.data} />}
    </SettingsSection>
  );
}

function UsageDetails({ summary }: { summary: UsageSummary }) {
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
    return <Card className="text-sm text-muted">No AI usage in the last {summary.days} days.</Card>;
  }
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Model calls" value={total.calls.toLocaleString('en')} />
        <Stat label="Tokens in" value={formatTokens(total.prompt_tokens)} />
        <Stat label="Tokens out" value={formatTokens(total.completion_tokens)} />
        <Stat label="Cost" value={formatCost(total.cost_usd)} />
      </div>
      <Breakdown
        title="By feature"
        rows={summary.by_feature.map((row) => {
          return {
            key: row.feature,
            label: FEATURE_LABELS[row.feature] ?? row.feature,
            totals: row,
          };
        })}
      />
      <Breakdown
        title="By member"
        rows={summary.by_member.map((row) => {
          return { key: row.user_id, label: nameOf(row.user_id), totals: row };
        })}
      />
      <Breakdown
        title="By day"
        rows={summary.by_day.map((row) => {
          return { key: row.day, label: row.day, totals: row };
        })}
      />
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

function Breakdown({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <caption className="px-4 pt-3 pb-1 text-left text-sm font-semibold">{title}</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th scope="col" className="px-4 py-2 text-left font-medium">Name</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Calls</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Tokens in</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Tokens out</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border border-t border-border tabular-nums">
          {rows.map(({ key, label, totals }) => {
            return (
              <tr key={key}>
                <th scope="row" className="px-4 py-2 text-left font-normal">{label}</th>
                <td className="px-4 py-2 text-right">{totals.calls.toLocaleString('en')}</td>
                <td className="px-4 py-2 text-right">{formatTokens(totals.prompt_tokens)}</td>
                <td className="px-4 py-2 text-right">{formatTokens(totals.completion_tokens)}</td>
                <td className="px-4 py-2 text-right">{formatCost(totals.cost_usd)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
