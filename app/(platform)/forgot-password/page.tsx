import { ForgotPassword } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reset your password · Overwatch' };

const page = () => <ForgotPassword />;

export default page;
