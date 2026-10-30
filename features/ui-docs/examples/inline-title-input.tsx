'use client';

import InlineTitleInput from '@/shared/components/inline-title-input';
import { useState } from 'react';

export function Basic() {
  const [title, setTitle] = useState('Guests can’t export reports');
  return (
    <div className="flex w-96 flex-col gap-1">
      <InlineTitleInput value={title} onSave={setTitle} />
      <p className="px-2 text-xs text-muted">Saved: {title}</p>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="w-96">
      <InlineTitleInput value="Read-only title" disabled onSave={() => {}} />
    </div>
  );
}
