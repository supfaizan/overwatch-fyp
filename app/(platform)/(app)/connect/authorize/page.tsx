import ConnectTool from '@/features/connect';

const page = async ({ searchParams }: { searchParams: Promise<{ request?: string }> }) => {
  const { request } = await searchParams;
  return <ConnectTool requestId={request ?? null} />;
};

export default page;
