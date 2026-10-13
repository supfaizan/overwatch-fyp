import { JiraStep } from '@/features/onboarding';

// the backend's Jira callback lands here with ?jira=connected|denied|error
const page = async ({ searchParams }: { searchParams: Promise<{ jira?: string }> }) => {
  const { jira } = await searchParams;
  return <JiraStep outcome={jira} />;
};

export default page;
