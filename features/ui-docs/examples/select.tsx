'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';

export function Basic() {
  const [repo, setRepo] = useState('');
  return (
    <div className="flex w-72 flex-col gap-1.5">
      <label htmlFor="example-repo" className="text-sm font-medium">
        Repository
      </label>
      <Select value={repo} onValueChange={setRepo}>
        <SelectTrigger id="example-repo" placeholder="Select a repository" />
        <SelectContent>
          <SelectItem value="acme/api">acme/api</SelectItem>
          <SelectItem value="acme/web">acme/web</SelectItem>
          <SelectItem value="acme/legacy" disabled>
            acme/legacy (archived)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function Sizes() {
  return (
    <>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Select key={size} defaultValue="main">
          <SelectTrigger size={size} aria-label={`Branch (${size})`} className="w-40" />
          <SelectContent>
            <SelectItem value="main">main</SelectItem>
            <SelectItem value="develop">develop</SelectItem>
          </SelectContent>
        </Select>
      ))}
    </>
  );
}
