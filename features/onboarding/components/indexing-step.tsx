'use client';

import { useRouter } from 'next/navigation';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import GithubMark from '@/shared/components/github-mark';
import Skeleton from '@/shared/components/skeleton';
import StatusTag from '@/shared/components/status-tag';
import { useInstallations } from '@/shared/repos/hooks';
import { useOnboardingStatus, useReindexRepo } from '../hooks';
import type { OnboardingRepo } from '../types';
import StepCard from './step-card';

export default function IndexingStep() {
  const router = useRouter();
  const status = useOnboardingStatus();

  return (
    <StepCard
      title="Indexing your code"
      description="Overwatch is reading the repository and building its architecture graph. Large repositories take a few minutes."
      actions={
        <Button variant="primary" disabled={!status.data?.ready} onClick={() => router.push('/onboarding/ready')}>
          Continue
        </Button>
      }
    >
      {status.isPending ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        <ul className="flex flex-col gap-3">
          {status.data?.github.repos.map((repo) => <RepoProgress key={repo.repo_full_name} repo={repo} />)}
        </ul>
      )}
    </StepCard>
  );
}

function RepoProgress({ repo }: { repo: OnboardingRepo }) {
  const reindex = useReindexRepo();
  const files = repo.graph_stats?.files;

  return (
    <li className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
      <div className="flex items-center gap-3">
        <GithubMark className="text-muted" />
        <span className="flex-1 truncate font-medium">{repo.repo_full_name}</span>
        {repo.parse_status === 'done' && typeof files === 'number' && <span className="text-muted">{files} files</span>}
        <StatusTag status={repo.parse_status} />
      </div>
      {repo.access_status !== 'active' ? (
        <AccessLost />
      ) : (
        repo.parse_status === 'failed' && (
          <Banner
            type="error"
            action={
              <Button size="sm" loading={reindex.isPending} onClick={() => reindex.mutate(repo.repo_full_name)}>
                Retry
              </Button>
            }
          >
            Indexing failed{repo.parse_error ? `: ${repo.parse_error}` : '.'}
          </Banner>
        )
      )}
    </li>
  );
}

function AccessLost() {
  const installations = useInstallations();
  return (
    <Banner
      type="warning"
      action={
        installations.data && (
          <Button size="sm" asChild>
            <a href={installations.data.install_url} target="_blank" rel="noopener noreferrer">Fix on GitHub</a>
          </Button>
        )
      }
    >
      The GitHub App lost access to this repository. Add it back to keep it in sync.
    </Banner>
  );
}
