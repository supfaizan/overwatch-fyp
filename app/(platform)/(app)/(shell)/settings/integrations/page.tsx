import { IntegrationsSection } from '@/features/settings';

// a connector's OAuth callback started from settings lands here with ?jira=connected|denied|taken|error (or ?confluence=…, ?slack=…)
const page = async (
  { searchParams }: {
    searchParams: Promise<{ jira?: string; confluence?: string; slack?: string }>;
  },
) => {
  const { jira, confluence, slack } = await searchParams;
  return <IntegrationsSection outcome={jira ?? confluence ?? slack} />;
};

export default page;
