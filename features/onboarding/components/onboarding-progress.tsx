'use client';

import Steps from '@/shared/components/steps';
import { useRouter, useSelectedLayoutSegment } from 'next/navigation';
import { useEffect } from 'react';
import { useOnboardingStatus } from '../hooks';
import { isJiraSkipped } from '../jira-skip';
import { currentStep, stepIndex, STEPS } from '../steps';

/** The step indicator; also sends the user back if they open a step they haven't reached. */
export default function OnboardingProgress() {
  const segment = useSelectedLayoutSegment();
  const router = useRouter();
  const status = useOnboardingStatus();

  useEffect(() => {
    // wait out refetches: a step just completed is only reflected once fresh status arrives
    if (!segment || !status.data || status.isFetching) {
      return;
    }
    const reached = currentStep(status.data, isJiraSkipped());
    if (stepIndex(segment) > stepIndex(reached)) {
      router.replace(`/onboarding/${reached}`);
    }
  }, [segment, status.data, status.isFetching, router]);

  return (
    <Steps
      steps={STEPS.map((step) => {
        return step.label;
      })}
      current={stepIndex(segment ?? undefined)}
      className="justify-center"
    />
  );
}
