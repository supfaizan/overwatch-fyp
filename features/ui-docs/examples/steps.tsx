import Steps from '@/shared/components/steps';

export function Onboarding() {
  return <Steps steps={['GitHub', 'Jira', 'Indexing', 'Ready']} current={1} />;
}

export function Finished() {
  return <Steps steps={['GitHub', 'Jira', 'Indexing', 'Ready']} current={4} />;
}
