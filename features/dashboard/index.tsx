'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Spinner from '@/shared/components/spinner';
import { useConnectedRepos } from '@/shared/repos/hooks';
import { pickRepo, readLastRepo, saveLastRepo } from '@/shared/repos/lib';
import { useSession } from '@/shared/session/store';
import { useWorkspace } from '@/shared/workspaces/store';
import DiagramCanvas from './components/diagram-canvas';
import { useViewStore } from './store';

/** The architecture dashboard for `?repo=owner/name`, else the last repo used, else the first with a graph. */
export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get('repo');
  const userId = useSession((state) => state.user?.id ?? '');
  const workspaceId = useWorkspace((state) => state.id ?? '');
  const lastUsed = readLastRepo(userId, workspaceId);
  const repos = useConnectedRepos();
  const repoName = repos.data ? pickRepo(repos.data, requested, lastUsed)?.repo_full_name : undefined;

  useEffect(() => {
    if (!repos.data) return;
    // nothing to show yet: onboarding knows which step comes next
    if (!repoName) {
      router.replace('/onboarding');
      return;
    }
    saveLastRepo(userId, workspaceId, repoName);
    // keep the URL naming what's on screen, so it can be shared; only when it differs, or this would loop
    if (repoName !== requested) {
      const params = new URLSearchParams(searchParams);
      params.set('repo', repoName);
      router.replace(`${pathname}?${params}`);
    }
  }, [repos.data, repoName, requested, searchParams, pathname, userId, workspaceId, router]);

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
