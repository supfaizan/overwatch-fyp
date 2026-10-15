import type { Metadata } from 'next';
import { ForgotPassword } from '@/features/auth';

export const metadata: Metadata = { title: 'Reset your password · Overwatch' };

const page = () => <ForgotPassword />;

export default page;
