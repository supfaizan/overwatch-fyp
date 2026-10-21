import { ChooseUsername } from '@/features/auth';
import SessionGate from '@/shared/session/session-gate';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Choose a username' };

const page = async ({ searchParams }: { searchParams: Promise<{ from?: string }> }) => {
  const { from } = await searchParams;
  return (
    <SessionGate>
      <ChooseUsername from={from} />
    </SessionGate>
  );
};

export default page;
