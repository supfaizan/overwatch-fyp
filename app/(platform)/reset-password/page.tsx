import type { Metadata } from 'next';
import { ResetPassword } from '@/features/auth';

export const metadata: Metadata = { title: 'Choose a new password · Overwatch' };

const page = () => <ResetPassword />;

export default page;
