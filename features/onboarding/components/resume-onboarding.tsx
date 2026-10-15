'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Spinner from '@/shared/components/spinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useOnboardingStatus } from '../hooks';
import { isJiraSkipped } from '../jira-skip';
import { currentStep } from '../steps';

/** /onboarding sends the user to the step they're on, or to the dashboard once onboarding is done. */
export default function ResumeOnboarding() {
  const router = useRouter();
  const status = useOnboardingStatus();

  useEffect(() => {
    if (!status.data) {
      return;
    }
    const step = currentStep(status.data, isJiraSkipped());
    router.replace(step === 'ready' ? '/dashboard' : `/onboarding/${step}`);
  }, [status.data, router]);

  if (status.isError) {
    return (
      <Banner
        type="error"
        action={
          <Button
            size="sm"
            onClick={() => status.refetch()}
          >
            Retry
          </Button>
        }
      >
        {status.error.message}
      </Banner>
    );
  }
  return <Spinner className="mx-auto size-6 text-muted" />;
}
