import type { ReactNode } from 'react';
import { OnboardingProgress } from '@/features/onboarding';

const layout = ({ children }: { children: ReactNode }) => (
  <main className="mx-auto flex w-full max-w-xl flex-col gap-6 py-10">
    <OnboardingProgress />
    {children}
  </main>
);

export default layout;
