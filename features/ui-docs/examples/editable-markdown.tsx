'use client';

import EditableMarkdown from '@/shared/components/editable-markdown';
import { useState } from 'react';

export function Basic() {
  const [value, setValue] = useState<string | null>(
    'Exports are **member-only**: guests see reports but [can’t download](https://example.com) them.',
  );
  return (
    <div className="w-[32rem]">
      <EditableMarkdown label="Background" value={value} onSave={setValue} />
    </div>
  );
}

export function Empty() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div className="w-[32rem]">
      <EditableMarkdown label="Description" value={value} onSave={setValue} />
    </div>
  );
}

export function WithNotice() {
  const [value, setValue] = useState<string | null>('Keep the word **draft** to see the notice.');
  return (
    <div className="w-[32rem]">
      <EditableMarkdown
        label="Notes"
        value={value}
        onSave={setValue}
        notice={(draft) => {
          return draft.includes('draft') && (
            <p className="text-xs text-warning-strong">This still says it’s a draft.</p>
          );
        }}
      />
    </div>
  );
}

export function Disabled() {
  return <EditableMarkdown label="Summary" value={null} disabled onSave={() => {}} />;
}
