import Brand from '@/shared/components/brand';
import Button from '@/shared/components/button';
import { CaretLeft } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import type { ReactNode } from 'react';
import DecisionTrace from './decision-trace';

/** The sign-in screens' layout: the form on the left, an illustration on the right on wide screens. */
export default function AuthShell(
  { title, description, children }: { title: string; description: ReactNode; children: ReactNode },
) {
  return (
    <div className="-mx-4 -my-2 grid min-h-svh lg:grid-cols-2">
      <main className="flex flex-col px-6 py-6 md:px-10">
        <div className="flex items-center gap-2">
          <Button asChild variant="tertiary" iconOnly aria-label="Back to home">
            <Link href="/">
              <CaretLeft />
            </Link>
          </Button>
          <Brand />
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="flex w-full max-w-sm flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted">{description}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
      <div className="hidden p-3 lg:block">
        <DecisionTrace />
      </div>
    </div>
  );
}
