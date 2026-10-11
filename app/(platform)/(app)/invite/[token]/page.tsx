import AcceptInvite from '@/features/invite';

const page = async ({ params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;
  return (
    <main className="mx-auto w-full max-w-md py-16">
      <AcceptInvite token={token} />
    </main>
  );
};

export default page;
