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

export type BarChartDatum = {
  /** Unique; also the x-axis tick unless `tick` is given. */
  key: string;
  /** The x-axis tick, e.g. "Oct 27". */
  tick?: string;
  /** The tooltip's heading, e.g. "Mon, Oct 27". @default tick ?? key */
  label?: string;
  value: number;
};

type BarChartProps = {
  /** Required: what the chart shows, for screen readers, e.g. "AI actions per day". */
  'aria-label': string;
  data: BarChartDatum[];
  /** What a value counts, for the tooltip and the table's column, e.g. "AI actions". */
  valueLabel: string;
  /** Formats values on the axis, in the tooltip and the table. @default toLocaleString */
  formatValue?: (value: number) => string;
  /** The plot's height in px. @default 220 */
  height?: number;
  className?: string;
};

const defaultFormat = (value: number) => {
  return value.toLocaleString('en');
};

const headingOf = (datum: BarChartDatum) => {
  return datum.label ?? datum.tick ?? datum.key;
};

/**
 * One measure over time as quiet bars, e.g. AI actions per day. Recharts draws it in our tokens, so
 * dark mode follows `.dark`.
 * - One measure per chart. Bars are grey and the hovered one turns `--color-chart-1`, so the eye
 *   goes to the bar being read rather than to colour.
 * - Keyboard: Tab to the plot, then ←/→ step through the bars with the tooltip following.
 * - "Show as table" swaps the plot for the same numbers as a table.
 */
export default function BarChart(
  { data, valueLabel, formatValue = defaultFormat, height = 220, className, ...props }:
    BarChartProps,
) {
  const [asTable, setAsTable] = useState(false);

  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      {asTable
        ? <ChartTable data={data} valueLabel={valueLabel} formatValue={formatValue} />
        : (
          <div style={{ height }} className="-ml-2 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={data}
                accessibilityLayer
                title={props['aria-label']}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey={(datum: BarChartDatum) => {
                    return datum.tick ?? datum.key;
                  }}
                  tickLine={false}
                  axisLine={false}
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
                  cursor={false}
                  content={(content: TooltipContentProps) => {
                    return (
                      <ChartTooltip
                        {...content}
                        valueLabel={valueLabel}
                        formatValue={formatValue}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="value"
                  name={valueLabel}
                  fill="var(--color-chart-other)"
                  activeBar={{ fill: 'var(--color-chart-1)' }}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={16}
                  isAnimationActive={false}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        )}
      <figcaption className="flex justify-end">
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
  { active, payload, valueLabel, formatValue }: TooltipContentProps & {
    valueLabel: string;
    formatValue: (value: number) => string;
  },
) {
  const datum = payload?.[0]?.payload as BarChartDatum | undefined;
  if (!active || !datum) {
    return null;
  }
  return (
    <div className="flex min-w-36 flex-col gap-1 rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-chrome shadow-border">
      <span className="font-semibold">{headingOf(datum)}</span>
      <span className="text-muted">{valueLabel}</span>
      <span className="text-base font-semibold tabular-nums">{formatValue(datum.value)}</span>
    </div>
  );
}

function ChartTable(
  { data, valueLabel, formatValue }: {
    data: BarChartDatum[];
    valueLabel: string;
    formatValue: (value: number) => string;
  },
) {
  return (
    <div className="max-h-80 overflow-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface text-xs text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">Period</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">{valueLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border border-t border-border tabular-nums">
          {data.map((datum) => {
            return (
              <tr key={datum.key}>
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  {headingOf(datum)}
                </th>
                <td className="px-3 py-2 text-right">{formatValue(datum.value)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
