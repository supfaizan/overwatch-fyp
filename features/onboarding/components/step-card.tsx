import type { ReactNode } from 'react';
import Card from '@/shared/components/card';

/** The frame every onboarding step sits in: heading, body, and an action row. */
export default function StepCard({ title, description, children, actions }: {
  title: string;
  description: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {children}
      {actions && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">{actions}</div>}
    </Card>
  );
}
