'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Spinner from '@/shared/components/spinner';
import { useOnboardingStatus } from '../hooks';
import { isJiraSkipped } from '../jira-skip';
import { currentStep } from '../steps';

/** /onboarding sends the user to the step they're on. */
export default function ResumeOnboarding() {
  const router = useRouter();
  const status = useOnboardingStatus();

  useEffect(() => {
    if (status.data) router.replace(`/onboarding/${currentStep(status.data, isJiraSkipped())}`);
  }, [status.data, router]);

  if (status.isError) {
    return (
      <Banner type="error" action={<Button size="sm" onClick={() => status.refetch()}>Retry</Button>}>
        {status.error.message}
      </Banner>
    );
  }
  return <Spinner className="mx-auto size-6 text-muted" />;
}
