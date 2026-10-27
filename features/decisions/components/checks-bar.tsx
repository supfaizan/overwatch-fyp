'use client';

import Button from '@/shared/components/button';
import Switch from '@/shared/components/switch';
import { timeAgo } from '@/shared/lib/time';
import { ArrowsClockwise } from '@phosphor-icons/react/ssr';
import { useCheckSettings, useRunCheck, useSetChecksEnabled } from '../hooks';

/** Automatic checks of accepted decisions against what changed: on or off, the last run, and Check now. */
export default function ChecksBar() {
  const settings = useCheckSettings();
  const setEnabled = useSetChecksEnabled();
  const run = useRunCheck();
  const last = settings.data?.last_run_at;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-2 text-sm">
      <label className="flex items-center gap-2">
        <Switch
          checked={settings.data?.enabled ?? true}
          disabled={!settings.data || setEnabled.isPending}
          onCheckedChange={(enabled) => {
            return setEnabled.mutate(enabled);
          }}
        />
        Check accepted decisions against changes every half hour
      </label>
      <span className="flex items-center gap-3 text-xs text-muted">
        {last ? `Last checked ${timeAgo(last)}` : 'Not checked yet'}
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
      </span>
    </div>
  );
}
