'use client';

import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GITHUB_SIGN_IN_URL } from '@/shared/api/envelope';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import GithubMark from '@/shared/components/github-mark';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import { useAvailableRepos, useConnectRepo, useInstallations, useOnboardingStatus } from '../hooks';
import DisconnectRepo from './disconnect-repo';
import StatusTag from './status-tag';
import StepCard from './step-card';

export default function GithubStep() {
  const router = useRouter();
  const status = useOnboardingStatus();
  const installations = useInstallations(status.data?.github.authorized ?? false);
  const connected = status.data?.github.repos ?? [];
  const hasInstallation = (installations.data?.installations.length ?? 0) > 0;
  const repos = useAvailableRepos(hasInstallation && connected.length === 0);
  const connect = useConnectRepo(() => router.push('/onboarding/jira'));
  const [selected, setSelected] = useState('');

  if (status.data && !status.data.github.authorized) {
    return (
      <StepCard title="Reconnect GitHub" description="Your GitHub authorization expired or was revoked.">
        <Banner type="error" action={<Button size="sm" asChild><a href={GITHUB_SIGN_IN_URL}>Sign in again</a></Button>}>
          Sign in with GitHub again to keep going.
        </Banner>
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
        description="Pick the account and repositories Overwatch may read. You'll come straight back here."
        actions={
          <Button variant="primary" asChild>
            <a href={installUrl}>
              <GithubMark /> Install GitHub App
            </a>
          </Button>
        }
      >
        <p className="text-sm text-muted">Overwatch only asks for read access to code. You can change the repository list on GitHub any time.</p>
      </StepCard>
    );
  }

  const choices = repos.data?.filter((repo) => !repo.connected) ?? [];
  return (
    <StepCard
      title="Connect a repository"
      description="Overwatch maps the repository's architecture and keeps it current on every push."
      actions={
        connected.length > 0 ? (
          <Button variant="primary" onClick={() => router.push('/onboarding/jira')}>
            Continue
          </Button>
        ) : (
          <Button variant="primary" disabled={!selected} loading={connect.isPending} onClick={() => connect.mutate(selected)}>
            Connect and index
          </Button>
        )
      }
    >
      {connected.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {connected.map((repo) => (
            <li key={repo.repo_full_name} className="flex items-center gap-3 px-3 py-2 text-sm">
              <GithubMark className="text-muted" />
              <span className="flex-1 truncate font-medium">{repo.repo_full_name}</span>
              <StatusTag status={repo.parse_status} />
              <DisconnectRepo repoFullName={repo.repo_full_name} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="repository" className="text-sm font-medium">
            Repository
          </label>
          <Select value={selected} onValueChange={setSelected} disabled={repos.isPending || choices.length === 0}>
            <SelectTrigger id="repository" placeholder={repos.isPending ? 'Loading repositories…' : 'Select a repository'} />
            <SelectContent>
              {choices.map((repo) => (
                <SelectItem key={repo.id} value={repo.full_name}>
                  {repo.full_name}
                  {repo.private ? ' (private)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {repos.isError && <p className="text-sm text-danger">{repos.error.message}</p>}
          {repos.isSuccess && choices.length === 0 && (
            <p className="text-sm text-muted">The GitHub App can&apos;t see any repositories yet. Add some below.</p>
          )}
        </div>
      )}
      <a href={installUrl} className="inline-flex items-center gap-1 self-start text-sm text-primary hover:underline">
        Missing a repository? Add it to the GitHub App <ExternalLink className="size-3.5" />
      </a>
    </StepCard>
  );
}
