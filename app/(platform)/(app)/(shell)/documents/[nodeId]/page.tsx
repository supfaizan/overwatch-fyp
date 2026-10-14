import { DocView } from '@/features/docs';

const page = async ({ params }: { params: Promise<{ nodeId: string }> }) => {
  const { nodeId } = await params;
  return <DocView id={nodeId} />;
};

export default page;
