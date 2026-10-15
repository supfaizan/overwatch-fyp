'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Spinner from '@/shared/components/spinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useOnboardingStatus } from '../hooks';
import { isJiraSkipped } from '../jira-skip';
import { currentStep } from '../steps';

/** Where GitHub sends users after installing or changing the App: back to onboarding, or to their repositories once set up. */
export default function GithubSetup() {
  const router = useRouter();
  const status = useOnboardingStatus();

  useEffect(() => {
    if (!status.data) {
      return;
    }
    router.replace(
      currentStep(status.data, isJiraSkipped()) === 'ready'
        ? '/settings/repositories'
        : '/onboarding',
    );
  }, [status.data, router]);

  if (status.isError) {
    return (
      <Banner
        type="error"
        className="mx-auto mt-10 max-w-xl"
        action={<Button size="sm" onClick={() => status.refetch()}>Retry</Button>}
      >
        {status.error.message}
      </Banner>
    );
  }
  return <Spinner className="mx-auto mt-10 size-6 text-muted" />;
}
