'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Button from '@/shared/components/button';
import Spinner from '@/shared/components/spinner';
import { useSession } from '@/shared/session/store';
import { takeDestination } from '../redirect';
import AuthCard from './auth-card';

/** Landing page after GitHub: the session provider exchanges the new refresh cookie, then we move on. */
export default function AuthComplete() {
  const status = useSession((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace(takeDestination());
  }, [status, router]);

  if (status === 'guest') {
    return (
      <AuthCard title="Sign-in didn't finish" description="We couldn't start your session. Please sign in again.">
        <Button asChild variant="primary">
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Signing you in" description="Setting up your session…">
      <Spinner className="mx-auto size-6 text-muted" />
    </AuthCard>
  );
}
