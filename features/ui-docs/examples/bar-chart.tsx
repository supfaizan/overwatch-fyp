'use client';

import BarChart from '@/shared/components/bar-chart';

const SERIES = [
  { key: 'chat', label: 'AI chat', color: 'var(--color-chart-1)' },
  { key: 'suggest', label: 'Suggestions', color: 'var(--color-chart-2)' },
  { key: 'check', label: 'Checks', color: 'var(--color-chart-3)' },
];

const DATA = ['Oct 24', 'Oct 25', 'Oct 26', 'Oct 27', 'Oct 28', 'Oct 29', 'Oct 30'].map(
  (tick, index) => {
    return {
      key: tick,
      tick,
      values: { chat: (index * 3) % 7, suggest: index % 3, check: index === 4 ? 9 : index % 2 },
    };
  },
);

export function Stacked() {
  return (
    <div className="w-[36rem]">
      <BarChart aria-label="AI calls per day, by feature" data={DATA} series={SERIES} />
    </div>
  );
}

export function WithOther() {
  return (
    <div className="w-[36rem]">
      <BarChart
        aria-label="AI calls per day, by member"
        height={160}
        data={DATA}
        series={[
          { key: 'chat', label: 'Ayesha', color: 'var(--color-chart-1)' },
          { key: 'suggest', label: 'Everyone else', color: 'var(--color-chart-other)' },
        ]}
      />
    </div>
  );
}
