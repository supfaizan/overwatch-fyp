'use client';

import Banner from '@/shared/components/banner';
import Card from '@/shared/components/card';
import Skeleton from '@/shared/components/skeleton';
import { cn } from '@/shared/lib/cn';
import Link from 'next/link';
import { Progress } from 'radix-ui';
import { useUsageLimits } from '../hooks';
import { filledTicks, meterTone } from '../lib';
import { USAGE_LIMIT_KIND, type UsageLimit, type UsageLimitKind } from '../types';

type LimitCopy = { title: string; period: string; unit: string; full: string };

// the limits shown, a card each; the member's hourly one stays out, it only guards against bursts
const LIMITS: Partial<Record<UsageLimitKind, LimitCopy>> = {
  ai_actions: {
    title: 'AI actions',
    period: 'This month',
    unit: 'actions',
    full: "This month's allowance is used up.",
  },
  chat_questions: {
    title: 'Chat questions',
    period: 'Today',
    unit: 'questions',
    full: 'Used up for today.',
  },
  decision_suggestions: {
    title: 'Decision suggestions',
    period: 'Today',
    unit: 'runs',
    full: 'Used up for today.',
  },
  decision_checks: {
    title: 'Decision checks',
    period: 'Sources read today',
    unit: 'sources',
    full: 'Used up for today.',
  },
};

const TICKS = 20;
const TONE_CLASSES = { ok: 'bg-primary', warning: 'bg-warning', full: 'bg-danger' } as const;

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const date = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

/** What's left of the workspace's AI limits right now, a card each. */
export default function UsageLimits() {
  const limits = useUsageLimits();

  if (limits.isPending) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (limits.isError) {
    return <Banner type="error">{limits.error.message}</Banner>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {limits.data.limits.map((limit) => {
        const copy = LIMITS[limit.kind];
        return copy && <LimitCard key={limit.kind} limit={limit} copy={copy} />;
      })}
    </ul>
  );
}

function LimitCard({ limit, copy }: { limit: UsageLimit; copy: LimitCopy }) {
  const tone = meterTone(limit.used, limit.limit);
  const filled = filledTicks(limit.used, limit.limit, TICKS);
  const resetsAt = new Date(limit.resets_at);
  const resets = limit.kind === USAGE_LIMIT_KIND.aiActions
    ? date.format(resetsAt)
    : time.format(resetsAt);

  return (
    <li>
      <Card className="flex h-full flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">{copy.title}</h2>
          <p className={cn('text-xs', tone === 'full' ? 'text-danger' : 'text-muted')}>
            {tone === 'full' ? copy.full : copy.period} · resets {resets}
          </p>
        </div>
        <p className="whitespace-nowrap tabular-nums">
          <span className="text-2xl font-semibold">{limit.used.toLocaleString('en')}</span>{' '}
          <span className="text-sm text-muted">of {limit.limit.toLocaleString('en')}</span>
        </p>
        <Progress.Root
          value={Math.min(limit.used, limit.limit)}
          max={Math.max(limit.limit, 1)}
          aria-label={copy.title}
          getValueLabel={() => {
            return `${limit.used} of ${limit.limit} ${copy.unit}`;
          }}
          className="flex gap-1"
        >
          {Array.from({ length: TICKS }, (_, index) => {
            return (
              <span
                key={index}
                aria-hidden
                className={cn(
                  'h-5 flex-1 rounded-full',
                  index < filled ? TONE_CLASSES[tone] : 'bg-fill-active',
                )}
              />
            );
          })}
        </Progress.Root>
        {tone === 'full' && limit.kind === USAGE_LIMIT_KIND.decisionChecks && (
          <Link
            href="/settings/decisions"
            className="text-xs text-danger underline underline-offset-2"
          >
            Check less often
          </Link>
        )}
      </Card>
    </li>
  );
}
