'use client';

import BarChart from '@/shared/components/bar-chart';

const DAYS = ['Oct 24', 'Oct 25', 'Oct 26', 'Oct 27', 'Oct 28', 'Oct 29', 'Oct 30'].map(
  (tick, index) => {
    return { key: tick, tick, value: index === 4 ? 18 : (index * 5) % 11 };
  },
);

const WEEKS = Array.from({ length: 13 }, (_, index) => {
  const tick = `Week ${index + 1}`;
  return { key: tick, tick, value: (index * 7) % 23 };
});

export function Default() {
  return (
    <div className="w-[36rem]">
      <BarChart aria-label="AI actions per day" valueLabel="AI actions" data={DAYS} />
    </div>
  );
}

export function Weekly() {
  return (
    <div className="w-[36rem]">
      <BarChart
        aria-label="AI actions per week"
        valueLabel="AI actions"
        height={160}
        data={WEEKS}
      />
    </div>
  );
}
