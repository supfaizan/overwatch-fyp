'use client';

import { Input } from '@/shared/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import Switch from '@/shared/components/switch';
import { useEffect, useMemo, useRef } from 'react';
import { useSlackDigest, useUpdateSlackDigest } from '../hooks';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * The Slack bot's daily digest in each watched channel: on or off, and when.
 *
 * - Until a time zone is saved the digest runs in UTC, so the first admin to open this saves theirs.
 */
export default function SlackDigest() {
  const digest = useSlackDigest(true);
  const change = useUpdateSlackDigest();
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zones = useMemo(() => {
    return Intl.supportedValuesOf('timeZone');
  }, []);
  const savedZone = digest.data?.time_zone;
  const { mutate, isPending } = change;
  // tried once per visit: a failed save shows its error rather than retrying in a loop
  const guessedZone = useRef(false);

  useEffect(() => {
    // a freshly connected workspace has no zone yet: the admin looking at it is the best guess
    if (digest.data && savedZone === null && !guessedZone.current) {
      guessedZone.current = true;
      mutate({ time_zone: browserZone });
    }
  }, [digest.data, savedZone, browserZone, mutate]);

  if (!digest.data) {
    return (
      <div className="border-t border-border p-4">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  const { enabled, time, time_zone } = digest.data;

  return (
    <div className="flex flex-col gap-3 border-t border-border p-4 text-sm">
      <label className="flex items-center justify-between gap-3">
        <span>
          <span className="block font-medium">Daily digest</span>
          <span className="text-xs text-muted">
            Once a day, the bot posts unsettled questions and the decisions it found in each
            channel.
          </span>
        </span>
        <Switch
          checked={enabled}
          disabled={isPending}
          onCheckedChange={(on) => {
            return mutate({ enabled: on });
          }}
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium">Posted at</span>
        <div className="flex items-center gap-2">
          <Input
            type="time"
            size="sm"
            aria-label="Digest time"
            className="w-28"
            defaultValue={time}
            disabled={!enabled || isPending}
            onBlur={(event) => {
              const value = event.currentTarget.value;
              if (TIME.test(value) && value !== time) {
                mutate({ time: value });
              }
            }}
          />
          <Select
            value={time_zone ?? browserZone}
            disabled={!enabled || isPending}
            onValueChange={(zone) => {
              return mutate({ time_zone: zone });
            }}
          >
            <SelectTrigger size="sm" aria-label="Digest time zone" className="w-56" />
            <SelectContent>
              {zones.map((zone) => {
                return <SelectItem key={zone} value={zone}>{zone}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
