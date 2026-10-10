import type { ReactNode } from 'react';
import Card from '@/shared/components/card';

/** Centered card the sign-in screens share. */
export default function AuthCard({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <main className="flex min-h-[85vh] items-center justify-center">
      <Card className="flex w-full max-w-sm flex-col gap-6 p-8">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-primary">Overwatch</p>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted">{description}</p>
        </div>
        {children}
      </Card>
    </main>
  );
}
