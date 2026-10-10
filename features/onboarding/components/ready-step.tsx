'use client';

import { CircleCheck } from 'lucide-react';
import Link from 'next/link';
import Button from '@/shared/components/button';
import { useOnboardingStatus } from '../hooks';
import StepCard from './step-card';

export default function ReadyStep() {
  const status = useOnboardingStatus();
  const indexed = status.data?.github.repos.filter((repo) => repo.parse_status === 'done').length ?? 0;
  const project = status.data?.jira.project;

  return (
    <StepCard
      title="You're all set"
      description="Your architecture map is live and updates on every push."
      actions={
        <Button variant="primary" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      }
    >
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex items-center gap-2">
          <CircleCheck className="size-4 text-success" />
          {indexed} {indexed === 1 ? 'repository' : 'repositories'} indexed
        </li>
        <li className="flex items-center gap-2">
          <CircleCheck className={project ? 'size-4 text-success' : 'size-4 text-muted'} />
          {project ? `Jira project ${project.key} connected` : 'Jira skipped. You can connect it later.'}
        </li>
      </ul>
    </StepCard>
  );
}
