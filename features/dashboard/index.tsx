'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Spinner from '@/shared/components/spinner';
import DiagramCanvas from './components/diagram-canvas';
import { useConnectedRepos } from './hooks';
import { pickRepo } from './lib/repos';
import { useViewStore } from './store';

/** The architecture dashboard for `?repo=owner/name`, falling back to the first repo with a graph. */
export default function Dashboard() {
  const router = useRouter();
  const requested = useSearchParams().get('repo');
  const repos = useConnectedRepos();
  const repo = repos.data ? pickRepo(repos.data, requested) : null;
  const repoName = repo?.repo_full_name;

  // nothing indexed yet: onboarding knows which step comes next
  useEffect(() => {
    if (repos.data && !repoName) router.replace('/onboarding');
  }, [repos.data, repoName, router]);

  // open folders belong to one repo's ids
  useEffect(() => {
    useViewStore.getState().reset();
  }, [repoName]);

  if (repos.isError) {
    return (
      <Banner type="error" className="mx-auto mt-10 max-w-xl" action={<Button size="sm" onClick={() => repos.refetch()}>Retry</Button>}>
        {repos.error.message}
      </Banner>
    );
  }
  if (!repoName) return <Spinner className="mx-auto mt-10 size-6 text-muted" />;

  return (
    <div className="flex h-full flex-col gap-2">
      <h1 className="truncate font-mono text-sm font-medium">{repoName}</h1>
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-surface">
        <ReactFlowProvider>
          <DiagramCanvas key={repoName} repo={repoName} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
