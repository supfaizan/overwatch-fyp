import type { UsageSummary } from './types';

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** Token counts the way usage pages show them: 950, 12.3K, 4.1M. */
export const formatTokens = (count: number) => {
  return compact.format(count);
};

/** Dollars to the cent, or to four places below a cent so small calls don't read as free. */
export const formatCost = (usd: number) => {
  const digits = usd > 0 && usd < 0.01 ? 4 : 2;
  return `$${usd.toFixed(digits)}`;
};

/** A bar in the usage chart: one day, or one week on long periods; `start`/`end` are `YYYY-MM-DD`. */
export type UsageBucket = {
  start: string;
  end: string;
  byFeature: Record<string, number>;
  byMember: Record<string, number>;
};

// past a month, one bar per day is too thin to read
const WEEKLY_AFTER_DAYS = 31;
const DAYS_PER_WEEK = 7;

/** Whether a period this long is charted a week per bar. */
export const isWeekly = (days: number) => {
  return days > WEEKLY_AFTER_DAYS;
};

/** `date`'s calendar day where the browser is, as `YYYY-MM-DD`. */
export const localDay = (date: Date) => {
  return date.toLocaleDateString('en-CA');
};

const addCounts = (into: Record<string, number>, counts: Record<string, number | undefined>) => {
  for (const [key, count] of Object.entries(counts)) {
    into[key] = (into[key] ?? 0) + (count ?? 0);
  }
};

/**
 * The summary's days as chart bars, oldest first: every day of the period including ones with no
 * usage, grouped into weeks (ending today) past a month. `today` is in the browser's time zone, as
 * the summary's days are.
 */
export function usageBuckets(summary: UsageSummary, today: Date): UsageBucket[] {
  const byDay = new Map(summary.by_day.map((day) => {
    return [day.day, day];
  }));
  // noon, so stepping back a day never lands on the wrong date across a DST change
  const noon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const days = Array.from({ length: summary.days }, (_, index) => {
    const date = new Date(noon);
    date.setDate(noon.getDate() - (summary.days - 1 - index));
    return localDay(date);
  });
  const size = isWeekly(summary.days) ? DAYS_PER_WEEK : 1;
  const buckets: UsageBucket[] = [];
  // grouped from today backwards, so the last bar is always a full week ending today
  for (let end = days.length; end > 0; end -= size) {
    const chunk = days.slice(Math.max(0, end - size), end);
    const bucket: UsageBucket = {
      start: chunk[0],
      end: chunk.at(-1) ?? chunk[0],
      byFeature: {},
      byMember: {},
    };
    for (const day of chunk) {
      const usage = byDay.get(day);
      if (usage) {
        addCounts(bucket.byFeature, usage.calls_by_feature);
        addCounts(bucket.byMember, usage.calls_by_member);
      }
    }
    buckets.unshift(bucket);
  }
  return buckets;
}

/** How full a limit is: `warning` from 80%, `full` once nothing's left. */
export function meterTone(used: number, limit: number): 'ok' | 'warning' | 'full' {
  if (used >= limit) {
    return 'full';
  }
  return used / limit >= 0.8 ? 'warning' : 'ok';
}
