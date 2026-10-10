import Link from 'next/link';
import type { ReactNode } from 'react';
import { UserMenu } from '@/features/auth';
import { OnboardingProgress } from '@/features/onboarding';

// a focused flow: no app sidebar, just the logo and the account menu
const layout = ({ children }: { children: ReactNode }) => (
  <>
    <header className="flex h-12 items-center justify-between border-b border-border">
      <Link href="/dashboard" className="text-sm font-bold">
        Overwatch
      </Link>
      <UserMenu />
    </header>
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 py-10">
      <OnboardingProgress />
      {children}
    </main>
  </>
);

export default layout;
