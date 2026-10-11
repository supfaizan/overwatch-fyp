import { IntegrationsSection } from '@/features/settings';

// a tracker's OAuth callback started from settings lands here with ?jira=connected|denied|error
const page = async ({ searchParams }: { searchParams: Promise<{ jira?: string }> }) => {
  const { jira } = await searchParams;
  return <IntegrationsSection outcome={jira} />;
};

export default page;
