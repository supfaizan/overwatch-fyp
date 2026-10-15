import type { Metadata } from 'next';
import { SignIn } from '@/features/auth';

export const metadata: Metadata = { title: 'Sign in · Overwatch' };

const page = async ({ searchParams }: { searchParams: Promise<{ error?: string; from?: string; reset?: string }> }) => {
  const { error, from, reset } = await searchParams;
  return <SignIn error={error} from={from} reset={reset === '1'} />;
};

export default page;
