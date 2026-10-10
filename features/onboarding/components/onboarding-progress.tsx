'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import Steps from '@/shared/components/steps';
import { STEPS, stepIndex } from '../steps';

export default function OnboardingProgress() {
  const segment = useSelectedLayoutSegment();
  return <Steps steps={STEPS.map((step) => step.label)} current={stepIndex(segment ?? undefined)} className="justify-center" />;
}
