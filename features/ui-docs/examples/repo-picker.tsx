'use client';

import { useState } from 'react';
import RepoPicker from '@/shared/components/repo-picker';

const repos = [
  { id: 1, full_name: 'acme/api', private: true, connected: true },
  { id: 2, full_name: 'acme/web', private: false, connected: false },
  { id: 3, full_name: 'acme/infra', private: true, connected: false },
  { id: 4, full_name: 'octocat/hello-world', private: false, connected: false },
];

export function Picker() {
  const [pending, setPending] = useState<string | null>(null);
  return (
    <div className="w-full max-w-md">
      <RepoPicker
        repos={repos}
        pending={pending}
        onSelect={(name) => {
          setPending(name);
          setTimeout(() => setPending(null), 1000);
        }}
      />
    </div>
  );
}

export function Loading() {
  return (
    <div className="w-full max-w-md">
      <RepoPicker repos={[]} loading onSelect={() => {}} />
    </div>
  );
}
