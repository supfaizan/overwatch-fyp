'use client';

import { DatePicker } from '@/shared/components/date-picker';
import { useState } from 'react';

export function Basic() {
  const [due, setDue] = useState<string | null>(null);
  return (
    <div className="flex w-56 flex-col gap-1.5">
      <label htmlFor="example-due" className="text-sm font-medium">
        Due date
      </label>
      <DatePicker id="example-due" value={due} onChange={setDue} />
    </div>
  );
}

export function Range() {
  const [start, setStart] = useState<string | null>('2026-11-02');
  const [end, setEnd] = useState<string | null>('2026-11-13');
  return (
    <div className="flex gap-3">
      <DatePicker aria-label="Starts" value={start} max={end ?? undefined} onChange={setStart} />
      <DatePicker aria-label="Ends" value={end} min={start ?? undefined} onChange={setEnd} />
    </div>
  );
}

export function Sizes() {
  return (
    <>
      {(['sm', 'md', 'lg'] as const).map((size) => {
        return (
          <DatePicker
            key={size}
            size={size}
            aria-label={`Date (${size})`}
            value="2026-10-28"
            className="w-48"
            onChange={() => {}}
          />
        );
      })}
    </>
  );
}

export function Disabled() {
  return <DatePicker aria-label="Locked date" value="2026-10-28" disabled onChange={() => {}} />;
}
