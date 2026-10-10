'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import Spinner from '@/shared/components/spinner';
import { useSession } from './store';

/** Renders its children for signed-in users; sends guests to sign in and back here afterwards. */
export default function SessionGate({ children }: { children: ReactNode }) {
  const status = useSession((state) => state.status);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'guest') router.replace(`/sign-in?from=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6 text-muted" />
      </div>
    );
  }
  return children;
}
