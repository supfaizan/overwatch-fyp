'use client';

import { ArrowSquareOut, Kanban } from '@phosphor-icons/react/ssr';
import type { ReactNode } from 'react';
import { GITHUB_SIGN_IN_URL } from '@/shared/api/envelope';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import GithubMark from '@/shared/components/github-mark';
import Skeleton from '@/shared/components/skeleton';
import StatusTag from '@/shared/components/status-tag';
import Tag from '@/shared/components/tag';
import { useConnectionStatus, useDisconnectJira, useInstallations, useStartJiraAuthorization } from '../hooks';
import type { ConnectionStatus } from '../types';
import { SettingsSection } from './settings-layout';

export default function IntegrationsSection() {
  const status = useConnectionStatus();

  return (
    <SettingsSection title="Integrations" description="The tools Overwatch reads from to understand your project.">
      {status.isPending && <Skeleton className="h-40 w-full" />}
      {status.isError && (
        <Banner type="error" action={<Button size="sm" onClick={() => status.refetch()}>Retry</Button>}>
          {status.error.message}
        </Banner>
      )}
      {status.isSuccess && (
        <>
          <SourceControl needsReauth={!status.data.github.authorized || status.data.github.needs_reauth} />
          <IssueTracker jira={status.data.jira} />
        </>
      )}
    </SettingsSection>
  );
}

function IntegrationCard({ icon, category, name, state, children }: { icon: ReactNode; category: string; name: string; state: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md border border-border [&_svg]:size-4">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{category}</p>
          <p className="text-sm font-medium">{name}</p>
        </div>
        {state}
      </div>
      {children}
    </Card>
  );
}

function SourceControl({ needsReauth }: { needsReauth: boolean }) {
  const installations = useInstallations();
  const accounts = installations.data?.installations ?? [];

  return (
    <IntegrationCard
      icon={<GithubMark />}
      category="Source control"
      name="GitHub"
      state={needsReauth ? <Tag variant="warning">Needs sign-in</Tag> : <Tag variant="success">Connected</Tag>}
    >
      {needsReauth && (
        <Banner type="warning" action={<Button size="sm" asChild><a href={GITHUB_SIGN_IN_URL}>Sign in again</a></Button>}>
          Your GitHub authorization expired or was revoked.
        </Banner>
      )}
      {accounts.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {accounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-2">
              <span>
                {account.account_login} <span className="text-muted">({account.account_type.toLowerCase()})</span>
              </span>
              <span className="text-xs text-muted">{account.repository_selection === 'all' ? 'All repositories' : 'Selected repositories'}</span>
            </li>
          ))}
        </ul>
      )}
      {installations.data && (
        <a href={installations.data.install_url} className="inline-flex items-center gap-1 self-start text-sm text-primary hover:underline">
          Manage the GitHub App <ArrowSquareOut className="size-3.5" />
        </a>
      )}
    </IntegrationCard>
  );
}

function IssueTracker({ jira }: { jira: ConnectionStatus['jira'] }) {
  const connect = useStartJiraAuthorization();
  const disconnect = useDisconnectJira();

  return (
    <IntegrationCard
      icon={<Kanban />}
      category="Issue tracker"
      name="Jira"
      state={jira.project ? <StatusTag status={jira.project.sync_status} done="Synced" /> : <Tag>Not connected</Tag>}
    >
      {jira.project && (
        <p className="text-sm">
          Project <span className="font-medium">{jira.project.key}</span>
          {jira.project.sync_error && <span className="text-danger"> · {jira.project.sync_error}</span>}
        </p>
      )}
      <div className="flex gap-2">
        {jira.connected && !jira.needs_reauth ? (
          <ConfirmDialog
            trigger={<Button size="sm">Disconnect</Button>}
            title="Disconnect Jira?"
            description="Ticket sync stops. Tickets already imported are kept, so reconnecting picks up where you left off."
            confirmLabel="Disconnect Jira"
            pending={disconnect.isPending}
            onConfirm={(close) => disconnect.mutate(undefined, { onSuccess: close })}
          />
        ) : (
          <Button size="sm" variant="primary" loading={connect.isPending} onClick={() => connect.mutate()}>
            {jira.needs_reauth ? 'Reconnect Jira' : 'Connect Jira'}
          </Button>
        )}
      </div>
    </IntegrationCard>
  );
}
