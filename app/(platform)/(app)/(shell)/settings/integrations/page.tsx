import { IntegrationsSection } from '@/features/settings';

// a connector's OAuth callback started from settings lands here with ?jira=connected|denied|error (or ?confluence=…)
const page = async ({ searchParams }: { searchParams: Promise<{ jira?: string; confluence?: string }> }) => {
  const { jira, confluence } = await searchParams;
  return <IntegrationsSection outcome={jira ?? confluence} />;
};

export default page;
