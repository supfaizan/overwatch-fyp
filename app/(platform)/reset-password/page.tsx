import { ResetPassword } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Choose a new password · Overwatch' };

const page = () => <ResetPassword />;

export default page;
