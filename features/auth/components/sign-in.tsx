'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import GithubMark from '@/shared/components/github-mark';
import { useSession } from '@/shared/session/store';
import { startGithubSignIn } from '../api';
import { signInErrorMessage } from '../errors';
import { safeDestination } from '../redirect';
import AuthCard from './auth-card';

export default function SignIn({ error, from }: { error?: string; from?: string }) {
  const status = useSession((state) => state.status);
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const message = signInErrorMessage(error);

  // already signed in (e.g. a bookmarked /sign-in): skip straight ahead
  useEffect(() => {
    if (status === 'authenticated') router.replace(safeDestination(from));
  }, [status, from, router]);

  return (
    <AuthCard title="Sign in" description="Overwatch uses your GitHub account. We never see or store a password.">
      {message && <Banner type="error">{message}</Banner>}
      <Button
        variant="primary"
        size="lg"
        // GitHub's own button: the foreground color, so it flips with the theme
        bg="var(--color-foreground)"
        border="var(--color-foreground)"
        edge="var(--color-foreground)"
        text="var(--color-background)"
        loading={leaving || status === 'loading'}
        onClick={() => {
          setLeaving(true);
          startGithubSignIn(from);
        }}
      >
        <GithubMark />
        Continue with GitHub
      </Button>
    </AuthCard>
  );
}
