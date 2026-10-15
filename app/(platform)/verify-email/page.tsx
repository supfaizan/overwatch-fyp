import { VerifyEmail } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Verify your email · Overwatch' };

const page = () => {
  return <VerifyEmail />;
};

export default page;
