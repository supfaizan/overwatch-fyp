'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import Spinner from '@/shared/components/spinner';
import { useSession } from './store';

export const CHOOSE_USERNAME_PATH = '/choose-username';

/**
 * Renders its children for signed-in users; sends guests to sign in and back here afterwards, and
 * accounts without a username to choose one first.
 */
export default function SessionGate({ children }: { children: ReactNode }) {
  const status = useSession((state) => state.status);
  const needsUsername = useSession((state) => state.user !== null && !state.user.username);
  const pathname = usePathname();
  const router = useRouter();
  const choosing = pathname === CHOOSE_USERNAME_PATH;

  useEffect(() => {
    const here = encodeURIComponent(pathname + window.location.search);
    if (status === 'guest') router.replace(`/sign-in?from=${here}`);
    else if (status === 'authenticated' && needsUsername && !choosing) router.replace(`${CHOOSE_USERNAME_PATH}?from=${here}`);
  }, [status, needsUsername, choosing, pathname, router]);

  if (status !== 'authenticated' || (needsUsername && !choosing)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6 text-muted" />
      </div>
    );
  }
  return children;
}
