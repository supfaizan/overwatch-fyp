'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { toApiError } from '@/shared/api/envelope';
import Button from '@/shared/components/button';
import GithubMark from '@/shared/components/github-mark';
import { linkGithub, type GithubLinkReturn } from './api';

const GITHUB_RESULT_PARAM = 'github';

/** Connects GitHub to the signed-in account (needed to add repositories); also reconnects an expired one. */
export default function ConnectGithubButton({ returnTo, reconnect, size = 'sm' }: { returnTo: GithubLinkReturn; reconnect?: boolean; size?: 'sm' | 'md' }) {
  const [leaving, setLeaving] = useState(false);
  return (
    <Button
      size={size}
      loading={leaving}
      onClick={() => {
        setLeaving(true);
        linkGithub(returnTo).catch((error: unknown) => {
          setLeaving(false);
          toast.error(toApiError(error).message);
        });
      }}
    >
      <GithubMark /> {reconnect ? 'Reconnect GitHub' : 'Connect GitHub'}
    </Button>
  );
}

const LINK_RESULTS: Record<string, { ok: boolean; message: string }> = {
  linked: { ok: true, message: 'GitHub connected.' },
  in_use: { ok: false, message: 'That GitHub account is already connected to another Overwatch account.' },
  denied: { ok: false, message: 'Connecting GitHub was cancelled.' },
  error: { ok: false, message: "GitHub isn't responding right now. Please try again in a moment." },
};

/** Says how a "connect GitHub" round trip went (`?github=`), once, then drops the parameter from the address. */
export function useGithubLinkResult(): void {
  useEffect(() => {
    const url = new URL(window.location.href);
    const result = LINK_RESULTS[url.searchParams.get(GITHUB_RESULT_PARAM) ?? ''];
    if (!result) return;
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
    url.searchParams.delete(GITHUB_RESULT_PARAM);
    window.history.replaceState(null, '', url);
  }, []);
}
