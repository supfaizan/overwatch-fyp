'use client';

import Card from '@/shared/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import Switch from '@/shared/components/switch';
import { useChangeCheckSettings, useCheckSettings } from '@/shared/decisions/hooks';
import { CHECK_INTERVAL_LABELS } from '@/shared/decisions/lib';
import { CHECK_INTERVAL, type CheckInterval } from '@/shared/decisions/types';
import { timeAgo } from '@/shared/lib/time';
import { SettingsSection } from './settings-layout';

const INTERVALS = Object.values(CHECK_INTERVAL);

/** The workspace's automatic checks of accepted decisions against what changed: on or off, and how often. */
export default function DecisionsSection() {
  const settings = useCheckSettings();
  const change = useChangeCheckSettings();

  return (
    <SettingsSection
      title="Decisions"
      description="When a ticket or page your accepted decisions rest on changes, it is read again and anything contradicting them is flagged."
    >
      {!settings.data
        ? <Skeleton className="h-28 w-full" />
        : (
          <Card className="flex flex-col gap-4">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="block font-medium">Automatic checks</span>
                <span className="text-xs text-muted">
                  {settings.data.last_run_at
                    ? `Last checked ${timeAgo(settings.data.last_run_at)}`
                    : 'Not checked yet'}
                </span>
              </span>
              <Switch
                checked={settings.data.enabled}
                disabled={change.isPending}
                onCheckedChange={(enabled) => {
                  return change.mutate({ enabled });
                }}
              />
            </label>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">How often</span>
              <Select
                value={String(settings.data.interval_minutes)}
                disabled={!settings.data.enabled || change.isPending}
                onValueChange={(value) => {
                  return change.mutate({ interval_minutes: Number(value) as CheckInterval });
                }}
              >
                <SelectTrigger size="sm" aria-label="How often" className="w-44" />
                <SelectContent>
                  {INTERVALS.map((minutes) => {
                    return (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {CHECK_INTERVAL_LABELS[minutes]}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}
    </SettingsSection>
  );
}
