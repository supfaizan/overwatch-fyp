'use client';

import Avatar from '@/shared/components/avatar';
import Banner from '@/shared/components/banner';
import BarChart from '@/shared/components/bar-chart';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import { SYSTEM_USER } from '@/shared/decisions/types';
import { displayName } from '@/shared/session/lib';
import { useWorkspaceMembers } from '@/shared/workspaces/hooks';
import { useState } from 'react';
import { useUsage } from '../hooks';
import { formatCost, formatTokens, isWeekly, ROLE_LABELS, usageBuckets } from '../lib';
import type { UsageSummary } from '../types';
import { SettingsSection } from './settings-layout';
import UsageLimits from './usage-limits';

const PERIODS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

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
  const [days, setDays] = useState('30');
  const usage = useUsage(Number(days));

  return (
    <SettingsSection title="Usage" description="How much AI this workspace uses, and what's left.">
      <UsageLimits />
      <Card className="flex flex-col gap-4">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Activity</h2>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger size="sm" aria-label="Period" className="w-36" />
            <SelectContent>
              {PERIODS.map((period) => {
                return (
                  <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </header>
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
        {usage.data && <Activity summary={usage.data} />}
      </Card>
      {usage.data && usage.data.by_member.length > 0 && <MembersTable summary={usage.data} />}
    </SettingsSection>
  );
}

function Activity({ summary }: { summary: UsageSummary }) {
  const { total } = summary;
  if (total.actions === 0 && total.calls === 0) {
    return (
      <p className="text-sm text-muted">
        No AI use in the last {summary.days}{' '}
        days. Ask the AI chat or suggest decisions, and it shows up here.
      </p>
    );
  }

  const weekly = isWeekly(summary.days);
  const data = usageBuckets(summary, new Date()).map((bucket) => {
    const start = parseDay(bucket.start);
    return {
      key: bucket.start,
      tick: dayFormat.format(start),
      label: weekly
        ? dayFormat.formatRange(start, parseDay(bucket.end))
        : longDayFormat.format(start),
      value: bucket.actions,
    };
  });

  return (
    <>
      <p className="tabular-nums">
        <span className="text-2xl font-semibold">{total.actions.toLocaleString('en')}</span>{' '}
        <span className="text-sm text-muted">AI actions · {formatCost(total.cost_usd)}</span>
      </p>
      <BarChart
        aria-label={`AI actions per ${weekly ? 'week' : 'day'}`}
        valueLabel="AI actions"
        data={data}
      />
    </>
  );
}

function MembersTable({ summary }: { summary: UsageSummary }) {
  // names and roles for the rows; the usage itself doesn't wait for them
  const members = useWorkspaceMembers();
  const rows = [...summary.by_member].sort((a, b) => {
    return b.actions - a.actions;
  });

  return (
    <Card className="p-0">
      <h2 className="px-4 pt-4 pb-2 text-sm font-semibold">Members</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="px-4 py-2 text-left font-medium">Member</th>
              <th scope="col" className="hidden px-4 py-2 text-left font-medium sm:table-cell">
                Role
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">AI actions</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Tokens</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border border-t border-border tabular-nums">
            {rows.map((row) => {
              const member = members.data?.find((m) => {
                return m.user_id === row.user_id;
              });
              // the automatic decision checks, which no member runs
              const name = member
                ? displayName(member)
                : row.user_id === SYSTEM_USER
                ? 'Automatic checks'
                : 'Former member';
              return (
                <tr key={row.user_id}>
                  <th scope="row" className="px-4 py-2 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <Avatar name={name} src={member?.avatar_url} size="sm" />
                      <span className="truncate">{name}</span>
                    </span>
                  </th>
                  <td className="hidden px-4 py-2 text-muted sm:table-cell">
                    {member ? ROLE_LABELS[member.role] : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">{row.actions.toLocaleString('en')}</td>
                  <td className="px-4 py-2 text-right">
                    {formatTokens(row.prompt_tokens + row.completion_tokens)}
                  </td>
                  <td className="px-4 py-2 text-right">{formatCost(row.cost_usd)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
