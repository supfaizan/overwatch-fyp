'use client';

import Button from '@/shared/components/button';
import GithubMark from '@/shared/components/github-mark';
import { useState } from 'react';
import { startGithubSignIn } from '../api';

/** "or", then GitHub's own button: the foreground color, so it flips with the theme. */
export default function GithubSignIn({ from, label }: { from?: string; label: string }) {
  const [leaving, setLeaving] = useState(false);
  return (
    <>
      <div className="flex items-center gap-3 text-xs text-muted" role="separator">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        variant="primary"
        size="lg"
        bg="var(--color-foreground)"
        border="var(--color-foreground)"
        edge="var(--color-foreground)"
        text="var(--color-background)"
        loading={leaving}
        onClick={() => {
          setLeaving(true);
          startGithubSignIn(from);
        }}
      >
        <GithubMark />
        {label}
      </Button>
    </>
  );
}
