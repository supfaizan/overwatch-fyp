import type { Metadata } from 'next';
import { SignIn } from '@/features/auth';

export const metadata: Metadata = { title: 'Sign in · Overwatch' };

const page = async ({ searchParams }: { searchParams: Promise<{ error?: string; from?: string }> }) => {
  const { error, from } = await searchParams;
  return <SignIn error={error} from={from} />;
};

export default page;
