'use client';

import Banner from '@/shared/components/banner';
import Card from '@/shared/components/card';
import Skeleton from '@/shared/components/skeleton';
import { cn } from '@/shared/lib/cn';
import { WarningCircle } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { Progress } from 'radix-ui';
import { useUsageLimits } from '../hooks';
import { meterTone } from '../lib';
import { USAGE_LIMIT_KIND, type UsageLimit, type UsageLimitKind } from '../types';

const LIMITS: Record<UsageLimitKind, { label: string; unit: string; full: string }> = {
  chat_questions: {
    label: 'AI chat questions today',
    unit: 'questions',
    full: 'The AI chat answers again after the reset.',
  },
  member_chat_questions: {
    label: 'Your questions this hour',
    unit: 'questions',
    full: 'You can ask again next hour.',
  },
  decision_suggestions: {
    label: 'Decision suggestions today',
    unit: 'runs',
    full: 'Suggestions work again after the reset.',
  },
  decision_checks: {
    label: 'Sources read by decision checks today',
    unit: 'sources',
    full: 'Checks resume after the reset.',
  },
};

const TONE_CLASSES = { ok: 'bg-primary', warning: 'bg-warning', full: 'bg-danger' } as const;

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** "in 6 h" or "in 40 min" until `iso`. */
const until = (iso: string) => {
  const minutes = Math.max(1, Math.round((new Date(iso).getTime() - Date.now()) / 60_000));
  return minutes < 60 ? `in ${minutes} min` : `in ${Math.round(minutes / 60)} h`;
};

/** What's left of the workspace's AI limits right now, each in its own unit. */
export default function UsageLimits() {
  const limits = useUsageLimits();

  if (limits.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (limits.isError) {
    return <Banner type="error">{limits.error.message}</Banner>;
  }
  const daily = limits.data.limits.find((limit) => {
    return limit.kind !== USAGE_LIMIT_KIND.memberChatQuestions;
  });
  return (
    <Card className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">What's left</h2>
        {daily && (
          <span className="text-xs text-muted">
            Daily limits reset at {time.format(new Date(daily.resets_at))}{' '}
            ({until(daily.resets_at)})
          </span>
        )}
      </header>
      <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {limits.data.limits.map((limit) => {
          return <LimitMeter key={limit.kind} limit={limit} />;
        })}
      </ul>
    </Card>
  );
}

function LimitMeter({ limit }: { limit: UsageLimit }) {
  const { label, unit, full } = LIMITS[limit.kind];
  const tone = meterTone(limit.used, limit.limit);
  // a limit lowered below what's already used still reads as full
  const used = Math.min(limit.used, limit.limit);
  const percent = limit.limit > 0 ? (used / limit.limit) * 100 : 100;

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="tabular-nums">
          <span className="font-semibold">{limit.used.toLocaleString('en')}</span>
          <span className="text-muted">/ {limit.limit.toLocaleString('en')}</span>
        </span>
      </div>
      <Progress.Root
        value={used}
        max={Math.max(limit.limit, 1)}
        aria-label={label}
        getValueLabel={() => {
          return `${limit.used} of ${limit.limit} ${unit}`;
        }}
        className="h-2 overflow-hidden rounded-full bg-fill-active"
      >
        <Progress.Indicator
          className={cn('h-full rounded-full transition-transform', TONE_CLASSES[tone])}
          style={{ transform: `translateX(-${100 - percent}%)` }}
        />
      </Progress.Root>
      {tone === 'full' && (
        <p className="flex items-start gap-1 text-xs text-danger">
          <WarningCircle aria-hidden className="mt-px size-3.5 shrink-0" />
          <span>
            Limit reached. {full}
            {limit.kind === USAGE_LIMIT_KIND.decisionChecks && (
              <>
                {' '}
                <Link href="/settings/decisions" className="underline underline-offset-2">
                  Check less often
                </Link>
              </>
            )}
          </span>
        </p>
      )}
    </li>
  );
}
