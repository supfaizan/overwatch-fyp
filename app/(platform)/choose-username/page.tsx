import type { Metadata } from 'next';
import { ChooseUsername } from '@/features/auth';
import SessionGate from '@/shared/session/session-gate';

export const metadata: Metadata = { title: 'Choose a username · Overwatch' };

const page = async ({ searchParams }: { searchParams: Promise<{ from?: string }> }) => {
  const { from } = await searchParams;
  return (
    <SessionGate>
      <ChooseUsername from={from} />
    </SessionGate>
  );
};

export default page;
