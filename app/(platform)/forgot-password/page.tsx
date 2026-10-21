import { ForgotPassword } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reset your password' };

const page = () => {
  return <ForgotPassword />;
};

export default page;
