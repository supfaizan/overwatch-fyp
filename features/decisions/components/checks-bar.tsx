'use client';

import Button from '@/shared/components/button';
import { useCheckSettings, useRunCheck } from '@/shared/decisions/hooks';
import { CHECK_INTERVAL_LABELS } from '@/shared/decisions/lib';
import { timeAgo } from '@/shared/lib/time';
import { ArrowsClockwise } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

// Settings → Decisions, where how often (or whether) they run is chosen
const SETTINGS_HREF = '/settings/decisions';

/** How the automatic checks of accepted decisions are set, when they last ran, and Check now. */
export default function ChecksBar() {
  const settings = useCheckSettings();
  const run = useRunCheck();
  if (!settings.data) {
    return null;
  }
  const { enabled, interval_minutes: every, last_run_at: last } = settings.data;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
      <span>
        {enabled
          ? `Automatic checks: ${CHECK_INTERVAL_LABELS[every].toLowerCase()}`
          : 'Automatic checks are off'}
        {last && ` · last checked ${timeAgo(last)}`}
        {' · '}
        <Link href={SETTINGS_HREF} className="underline hover:text-foreground">
          Change
        </Link>
      </span>
      <Button
        size="sm"
        variant="tertiary"
        loading={run.isPending}
        onClick={() => {
          return run.mutate();
        }}
      >
        <ArrowsClockwise aria-hidden />
        Check now
      </Button>
    </div>
  );
}
