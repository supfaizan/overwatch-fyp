import { SignUp } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Create your account · Overwatch' };

const page = async ({ searchParams }: { searchParams: Promise<{ from?: string }> }) => {
  const { from } = await searchParams;
  return <SignUp from={from} />;
};

export default page;
