import type { Metadata } from 'next';
import { VerifyEmail } from '@/features/auth';

export const metadata: Metadata = { title: 'Verify your email · Overwatch' };

const page = () => <VerifyEmail />;

export default page;
