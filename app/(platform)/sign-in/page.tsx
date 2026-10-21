import { SignIn } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in' };

const page = async (
  { searchParams }: { searchParams: Promise<{ error?: string; from?: string; reset?: string }> },
) => {
  const { error, from, reset } = await searchParams;
  return <SignIn error={error} from={from} reset={reset === '1'} />;
};

export default page;
