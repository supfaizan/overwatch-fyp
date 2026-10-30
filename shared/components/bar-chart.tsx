'use client';

import { cn } from '@/shared/lib/cn';
import { useState } from 'react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';
import Button from './button';

export type BarChartSeries = {
  /** The key of the series' values in each datum's `values`. */
  key: string;
  label: string;
  /** A chart token, in fixed order per entity: `var(--color-chart-1)`…`-4`, or `var(--color-chart-other)`. */
  color: string;
};

export type BarChartDatum = {
  /** Unique; also the x-axis tick unless `tick` is given. */
  key: string;
  /** The x-axis tick, e.g. "Oct 27". */
  tick?: string;
  /** The tooltip's heading, e.g. "Mon, Oct 27". @default tick ?? key */
  label?: string;
  /** Each series' value; a missing series counts as 0. */
  values: Record<string, number>;
};

type BarChartProps = {
  /** Required: what the chart shows, for screen readers, e.g. "AI calls per day, by feature". */
  'aria-label': string;
  data: BarChartDatum[];
  /** Stacked bottom to top in this order. */
  series: BarChartSeries[];
  /** Formats values in the tooltip, legend and table. @default toLocaleString */
  formatValue?: (value: number) => string;
  /** The plot's height in px. @default 220 */
  height?: number;
  className?: string;
};

const defaultFormat = (value: number) => {
  return value.toLocaleString('en');
};

const valueOf = (datum: BarChartDatum, key: string) => {
  return datum.values[key] ?? 0;
};

/** Whole-number shares of `totals` that add up to 100 (largest remainder), 0s when they're all 0. */
export function shares(totals: number[]): number[] {
  const sum = totals.reduce((a, b) => {
    return a + b;
  }, 0);
  if (sum === 0) {
    return totals.map(() => {
      return 0;
    });
  }
  const exact = totals.map((total) => {
    return (total / sum) * 100;
  });
  const result = exact.map(Math.floor);
  let left = 100 - result.reduce((a, b) => {
    return a + b;
  }, 0);
  const byRemainder = exact.map((value, index) => {
    return { index, remainder: value - Math.floor(value) };
  }).sort((a, b) => {
    return b.remainder - a.remainder;
  });
  for (const { index } of byRemainder) {
    if (left === 0) {
      break;
    }
    result[index] += 1;
    left -= 1;
  }
  return result;
}

/**
 * Stacked bars in the design system's look, e.g. calls per day split by feature. Recharts draws it;
 * axes, grid, tooltip and legend use our tokens, so dark mode follows `.dark`.
 * - Give each entity a fixed chart token (`--color-chart-1`…`-4`); fold anything past four into
 *   one `--color-chart-other` series rather than inventing colors.
 * - The legend names every series with its share of the total; colour never carries identity alone.
 * - Keyboard: Tab to the plot, then ←/→ step through the bars with the tooltip following.
 * - "Show as table" swaps the plot for the same numbers as a table.
 */
export default function BarChart(
  { data, series, formatValue = defaultFormat, height = 220, className, ...props }: BarChartProps,
) {
  const [asTable, setAsTable] = useState(false);
  const totals = series.map((s) => {
    return data.reduce((sum, datum) => {
      return sum + valueOf(datum, s.key);
    }, 0);
  });
  const percents = shares(totals);
  // the last series is the top of the stack: it gets the rounded cap
  const top = series.map((s) => {
    return s.key;
  }).at(-1);

  return (
    <figure className={cn('flex flex-col gap-3', className)}>
      {asTable
        ? <ChartTable data={data} series={series} formatValue={formatValue} />
        : (
          <div style={{ height }} className="-ml-2 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={data}
                accessibilityLayer
                title={props['aria-label']}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey={(datum: BarChartDatum) => {
                    return datum.tick ?? datum.key;
                  }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border-strong)' }}
                  tick={{ fill: 'var(--color-muted)' }}
                  minTickGap={16}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-muted)' }}
                  width={40}
                  tickFormatter={formatValue}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-fill-hover)' }}
                  content={(content: TooltipContentProps) => {
                    return <ChartTooltip {...content} series={series} formatValue={formatValue} />;
                  }}
                />
                {series.map((s) => {
                  return (
                    <Bar
                      key={s.key}
                      dataKey={(datum: BarChartDatum) => {
                        return valueOf(datum, s.key);
                      }}
                      name={s.label}
                      stackId="stack"
                      fill={s.color}
                      // a 2px surface gap between stacked segments
                      stroke="var(--color-surface)"
                      strokeWidth={2}
                      radius={s.key === top ? [4, 4, 0, 0] : 0}
                      maxBarSize={32}
                      isAnimationActive={false}
                    />
                  );
                })}
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        )}
      <figcaption className="flex flex-wrap items-end justify-between gap-3">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {series.map((s, index) => {
            return (
              <li key={s.key} className="flex items-stretch gap-2">
                <span aria-hidden className="w-1 rounded-full" style={{ background: s.color }} />
                <span className="flex flex-col">
                  <span className="text-xs text-muted">{s.label}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {percents[index]}%
                    <span className="ml-1 font-normal text-muted">
                      {formatValue(totals[index])}
                    </span>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <Button
          size="sm"
          variant="tertiary"
          aria-pressed={asTable}
          onClick={() => {
            return setAsTable(!asTable);
          }}
        >
          {asTable ? 'Show as chart' : 'Show as table'}
        </Button>
      </figcaption>
    </figure>
  );
}

function ChartTooltip(
  { active, payload, series, formatValue }: TooltipContentProps & {
    series: BarChartSeries[];
    formatValue: (value: number) => string;
  },
) {
  const datum = payload?.[0]?.payload as BarChartDatum | undefined;
  if (!active || !datum) {
    return null;
  }
  const total = series.reduce((sum, s) => {
    return sum + valueOf(datum, s.key);
  }, 0);
  return (
    <div className="flex min-w-40 flex-col gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-chrome shadow-border">
      <span className="font-semibold">{datum.label ?? datum.tick ?? datum.key}</span>
      {[...series].reverse().map((s) => {
        return (
          <span key={s.key} className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-sm" style={{ background: s.color }} />
            <span className="flex-1 text-muted">{s.label}</span>
            <span className="tabular-nums">{formatValue(valueOf(datum, s.key))}</span>
          </span>
        );
      })}
      <span className="flex justify-between border-t border-border pt-1.5 font-medium">
        Total <span className="tabular-nums">{formatValue(total)}</span>
      </span>
    </div>
  );
}

function ChartTable(
  { data, series, formatValue }: {
    data: BarChartDatum[];
    series: BarChartSeries[];
    formatValue: (value: number) => string;
  },
) {
  return (
    <div className="max-h-80 overflow-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface text-xs text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">Period</th>
            {series.map((s) => {
              return (
                <th key={s.key} scope="col" className="px-3 py-2 text-right font-medium">
                  {s.label}
                </th>
              );
            })}
            <th scope="col" className="px-3 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border border-t border-border tabular-nums">
          {data.map((datum) => {
            return (
              <tr key={datum.key}>
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  {datum.label ?? datum.tick ?? datum.key}
                </th>
                {series.map((s) => {
                  return (
                    <td key={s.key} className="px-3 py-2 text-right">
                      {formatValue(valueOf(datum, s.key))}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right font-medium">
                  {formatValue(series.reduce((sum, s) => {
                    return sum + valueOf(datum, s.key);
                  }, 0))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
