import { DecisionView } from '@/features/decisions';

const page = async ({ params }: { params: Promise<{ decisionId: string }> }) => {
  const { decisionId } = await params;
  return <DecisionView id={decisionId} />;
};

export default page;
