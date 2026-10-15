'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import GithubMark from '@/shared/components/github-mark';
import RepoPicker from '@/shared/components/repo-picker';
import Skeleton from '@/shared/components/skeleton';
import StatusTag from '@/shared/components/status-tag';
import ConnectGithubButton, { useGithubLinkResult } from '@/shared/repos/connect-github-button';
import { useAvailableRepos, useConnectRepo, useInstallations } from '@/shared/repos/hooks';
import { useSession } from '@/shared/session/store';
import { ArrowSquareOut, GitBranch } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import { useOnboardingStatus } from '../hooks';
import DisconnectRepo from './disconnect-repo';
import StepCard from './step-card';

export default function GithubStep() {
  const router = useRouter();
  const status = useOnboardingStatus();
  const installations = useInstallations(status.data?.github.authorized ?? false);
  const connected = status.data?.github.repos ?? [];
  const hasInstallation = (installations.data?.installations.length ?? 0) > 0;
  const repos = useAvailableRepos(hasInstallation && connected.length === 0);
  const connect = useConnectRepo(() => {
    return router.push('/onboarding/jira');
  });
  const hasGithub = useSession((state) => {
    return Boolean(state.user?.github_login);
  });
  useGithubLinkResult();

  if (status.data && !status.data.github.authorized) {
    return hasGithub
      ? (
        <StepCard
          title="Reconnect GitHub"
          description="Your GitHub authorization expired or was revoked."
        >
          <Banner type="error" action={<ConnectGithubButton returnTo="onboarding" reconnect />}>
            Reconnect GitHub to keep going.
          </Banner>
        </StepCard>
      )
      : (
        <StepCard
          title="Connect GitHub"
          description="Overwatch reads your repositories through GitHub. Connect your GitHub account to pick the ones to map."
          actions={<ConnectGithubButton returnTo="onboarding" size="md" />}
        >
          <p className="text-sm text-muted">
            You&apos;ll keep signing in with your email; GitHub is only used to reach your code.
          </p>
        </StepCard>
      );
  }

  if (status.isPending || installations.isPending) {
    return (
      <StepCard title="Connect a repository" description="Checking your GitHub access…">
        <Skeleton className="h-9 w-full" />
      </StepCard>
    );
  }

  const installUrl = installations.data?.install_url;
  if (!hasInstallation) {
    return (
      <StepCard
        title="Install the Overwatch GitHub App"
        description="Pick the account and repositories Overwatch may read. GitHub opens in a new tab; come back here when you're done."
        actions={
          <Button variant="primary" asChild>
            <a href={installUrl} target="_blank" rel="noopener noreferrer">
              <GithubMark /> Install GitHub App
            </a>
          </Button>
        }
      >
        <p className="text-sm text-muted">
          Overwatch only asks for read access to code. You can change the repository list on GitHub
          any time.
        </p>
      </StepCard>
    );
  }

  return (
    <StepCard
      title="Connect a repository"
      description="Overwatch maps the repository's architecture and keeps it current on every push."
      actions={connected.length > 0 && (
        <Button
          variant="primary"
          onClick={() => {
            return router.push('/onboarding/jira');
          }}
        >
          Continue
        </Button>
      )}
    >
      {connected.length > 0
        ? (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {connected.map((repo) => {
              return (
                <li key={repo.repo_full_name} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <GitBranch weight="fill" className="size-4 shrink-0 text-accent-blue" />
                  <span className="flex-1 truncate font-medium">{repo.repo_full_name}</span>
                  <StatusTag status={repo.parse_status} />
                  <DisconnectRepo repoFullName={repo.repo_full_name} />
                </li>
              );
            })}
          </ul>
        )
        : (
          <div className="flex flex-col gap-1.5">
            {repos.isError
              ? <p className="text-sm text-danger">{repos.error.message}</p>
              : (
                <RepoPicker
                  repos={repos.data?.filter((repo) => {
                    return !repo.connected;
                  }) ?? []}
                  loading={repos.isPending}
                  pending={connect.isPending ? (connect.variables ?? null) : null}
                  onSelect={(name) => {
                    return connect.mutate(name);
                  }}
                />
              )}
            {repos.isSuccess && repos.data.every((repo) => {
              return repo.connected;
            }) && (
              <p className="text-sm text-muted">
                The GitHub App can&apos;t see any repositories yet. Add some below.
              </p>
            )}
          </div>
        )}
      <a
        href={installUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 self-start text-sm text-primary hover:underline"
      >
        Missing a repository? Add it to the GitHub App <ArrowSquareOut className="size-3.5" />
      </a>
    </StepCard>
  );
}
