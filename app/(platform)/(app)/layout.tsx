import Link from 'next/link';
import type { ReactNode } from 'react';
import { UserMenu } from '@/features/auth';
import SessionGate from '@/shared/session/session-gate';

const layout = ({ children }: { children: ReactNode }) => (
  <SessionGate>
    <header className="flex h-12 items-center justify-between border-b border-border">
      <Link href="/onboarding" className="text-sm font-bold">
        Overwatch
      </Link>
      <UserMenu />
    </header>
    {children}
  </SessionGate>
);

export default layout;
