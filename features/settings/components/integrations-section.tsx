'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import GithubMark from '@/shared/components/github-mark';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import StatusTag from '@/shared/components/status-tag';
import Tag from '@/shared/components/tag';
import {
  CONNECTION_STATUS,
  CONNECTOR_CATEGORY,
  type ConnectorCategory,
} from '@/shared/connections/constants';
import ConnectGithubButton, { useGithubLinkResult } from '@/shared/repos/connect-github-button';
import { useInstallations } from '@/shared/repos/hooks';
import { useSession } from '@/shared/session/store';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE } from '@/shared/workspaces/types';
import { ArrowSquareOut, BookOpen, Kanban } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  useAddTarget,
  useAvailableTargets,
  useConnections,
  useConnectionStatus,
  useDisconnect,
  useStartAuthorization,
  useSyncNow,
} from '../hooks';
import type { Connection, Target } from '../types';
import { SettingsSection } from './settings-layout';

// what a tracker's OAuth callback reports, e.g. ?jira=connected
const OUTCOMES: Record<string, () => void> = {
  connected: () => {
    return toast.success('Connected.');
  },
  denied: () => {
    return toast.error('Authorization was cancelled.');
  },
  error: () => {
    return toast.error("Couldn't connect. Please try again.");
  },
};

export default function IntegrationsSection({ outcome }: { outcome?: string }) {
  const router = useRouter();
  const status = useConnectionStatus();

  useEffect(() => {
    if (!outcome) {
      return;
    }
    OUTCOMES[outcome]?.();
    router.replace('/settings/integrations'); // drop the outcome so a refresh doesn't toast again
  }, [outcome, router]);

  return (
    <SettingsSection
      title="Integrations"
      description="The tools Overwatch reads from to understand your project."
    >
      {status.isPending && <Skeleton className="h-40 w-full" />}
      {status.isError && (
        <Banner
          type="error"
          action={
            <Button
              size="sm"
              onClick={() => {
                return status.refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          {status.error.message}
        </Banner>
      )}
      {status.isSuccess && (
        <>
          <SourceControl
            authorized={status.data.github.authorized}
            needsReauth={status.data.github.needs_reauth}
          />
          <Connectors />
        </>
      )}
    </SettingsSection>
  );
}

function IntegrationCard(
  { icon, category, name, state, children }: {
    icon: ReactNode;
    category: string;
    name: string;
    state: ReactNode;
    children: ReactNode;
  },
) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md border border-border [&_svg]:size-4">
          {icon}
        </span>
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

function SourceControl({ authorized, needsReauth }: { authorized: boolean; needsReauth: boolean }) {
  const installations = useInstallations(authorized);
  const accounts = installations.data?.installations ?? [];
  const hasGithub = useSession((state) => {
    return Boolean(state.user?.github_login);
  });
  useGithubLinkResult();

  return (
    <IntegrationCard
      icon={<GithubMark />}
      category="Source control"
      name="GitHub"
      state={!authorized && !hasGithub
        ? <Tag>Not connected</Tag>
        : needsReauth || !authorized
        ? <Tag variant="warning">Needs reconnecting</Tag>
        : <Tag variant="success">Connected</Tag>}
    >
      {!authorized && !hasGithub
        ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Connect your GitHub account to add repositories.</p>
            <ConnectGithubButton returnTo="settings" />
          </div>
        )
        : (
          (needsReauth || !authorized) && (
            <Banner type="warning" action={<ConnectGithubButton returnTo="settings" reconnect />}>
              Your GitHub authorization expired or was revoked.
            </Banner>
          )
        )}
      {accounts.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {accounts.map((account) => {
            return (
              <li key={account.id} className="flex items-center justify-between gap-2">
                <span>
                  {account.account_login}{' '}
                  <span className="text-muted">({account.account_type.toLowerCase()})</span>
                </span>
                <span className="text-xs text-muted">
                  {account.repository_selection === 'all'
                    ? 'All repositories'
                    : 'Selected repositories'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {installations.data && (
        <a
          href={installations.data.install_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 self-start text-sm text-primary hover:underline"
        >
          Manage the GitHub App <ArrowSquareOut className="size-3.5" />
        </a>
      )}
    </IntegrationCard>
  );
}

// how each kind of connector is described
const CATEGORY_COPY: Record<
  ConnectorCategory,
  {
    icon: ReactNode;
    label: string;
    target: string;
    reconnect: string;
    disconnect: string;
    targetLabel: (target: Target) => string;
  }
> = {
  [CONNECTOR_CATEGORY.workItems]: {
    icon: <Kanban />,
    label: 'Issue tracker',
    target: 'project',
    reconnect: 'to edit, move and create its tickets from the board',
    disconnect:
      'Ticket sync stops. Tickets already imported are kept, so reconnecting picks up where you left off.',
    targetLabel: (target) => {
      return (target.name ? `${target.key} · ${target.name}` : target.key);
    },
  },
  [CONNECTOR_CATEGORY.documents]: {
    icon: <BookOpen />,
    label: 'Docs',
    target: 'space',
    reconnect: 'to edit its pages in Docs',
    disconnect:
      'Page sync stops. Pages already imported stay in Docs, read-only, until you reconnect.',
    targetLabel: (target) => {
      return [target.name ?? target.key, target.id].filter(Boolean).join(' · ');
    },
  },
};

function Connectors() {
  const connections = useConnections();

  if (connections.isPending) {
    return <Skeleton className="h-32 w-full" />;
  }
  if (connections.isError) {
    return (
      <Banner
        type="error"
        action={
          <Button
            size="sm"
            onClick={() => {
              return connections.refetch();
            }}
          >
            Retry
          </Button>
        }
      >
        {connections.error.message}
      </Banner>
    );
  }
  return connections.data.map((connection) => {
    return <ConnectorCard key={connection.provider} connection={connection} />;
  });
}

function ConnectorCard({ connection }: { connection: Connection }) {
  const { provider, name, category, status, can_write, external_account, targets } = connection;
  const copy = CATEGORY_COPY[category];
  const connect = useStartAuthorization();
  const disconnect = useDisconnect(name);
  const sync = useSyncNow(name);
  const connected = status === CONNECTION_STATUS.active;
  // only admins connect, sync and disconnect; members see the state
  const isAdmin = hasRole(useCurrentWorkspace()?.role, ROLE.admin);

  return (
    <IntegrationCard
      icon={copy.icon}
      category={copy.label}
      name={name}
      state={status === CONNECTION_STATUS.needsReauth
        ? <Tag variant="warning">Needs reconnect</Tag>
        : connected
        ? <Tag variant="success">Connected</Tag>
        : <Tag>Not connected</Tag>}
    >
      {isAdmin && connected && !can_write && (
        <Banner
          type="warning"
          action={
            <Button
              size="sm"
              loading={connect.isPending}
              onClick={() => {
                return connect.mutate(provider);
              }}
            >
              Reconnect
            </Button>
          }
        >
          Reconnect {name} {copy.reconnect}.
        </Banner>
      )}
      {external_account?.name && (
        <p className="text-sm text-muted">
          Site <span className="text-foreground">{external_account.name}</span>
        </p>
      )}
      {targets.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm">
          {targets.map((target) => {
            return (
              <li key={target.key} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">
                  {category === CONNECTOR_CATEGORY.documents
                    ? <span className="font-medium">{target.name ?? target.key}</span>
                    : (
                      <>
                        <span className="font-medium">{target.key}</span>
                        {target.name && <span className="text-muted">{' · '}{target.name}</span>}
                      </>
                    )}
                  {target.sync_error && (
                    <span className="text-danger">{' · '}{target.sync_error}</span>
                  )}
                </span>
                <StatusTag status={target.sync_status} done="Synced" />
              </li>
            );
          })}
        </ul>
      )}
      {isAdmin && connected && (
        <AddTarget
          provider={provider}
          noun={copy.target}
          label={copy.targetLabel}
          synced={targets.map((t) => {
            return t.key;
          })}
        />
      )}
      {isAdmin && (
        <div className="flex gap-2">
          {connected
            ? (
              <>
                {targets.length > 0 && (
                  <Button
                    size="sm"
                    loading={sync.isPending}
                    onClick={() => {
                      return sync.mutate(provider);
                    }}
                  >
                    Sync now
                  </Button>
                )}
                <ConfirmDialog
                  trigger={<Button size="sm">Disconnect</Button>}
                  title={`Disconnect ${name}?`}
                  description={copy.disconnect}
                  confirmLabel={`Disconnect ${name}`}
                  pending={disconnect.isPending}
                  onConfirm={(close) => {
                    return disconnect.mutate(provider, { onSuccess: close });
                  }}
                />
              </>
            )
            : (
              <Button
                size="sm"
                variant="primary"
                loading={connect.isPending}
                onClick={() => {
                  return connect.mutate(provider);
                }}
              >
                {status === CONNECTION_STATUS.needsReauth ? `Reconnect ${name}` : `Connect ${name}`}
              </Button>
            )}
        </div>
      )}
    </IntegrationCard>
  );
}

function AddTarget(
  { provider, noun, label, synced }: {
    provider: string;
    noun: string;
    label: (target: Target) => string;
    synced: string[];
  },
) {
  const available = useAvailableTargets(provider);
  const add = useAddTarget();
  const [selected, setSelected] = useState('');
  const options = (available.data ?? []).filter((target) => {
    return !synced.includes(target.key);
  });
  const target = options.find((option) => {
    return option.key === selected;
  });

  if (available.isPending) {
    return <Skeleton className="h-9 w-full" />;
  }
  if (options.length === 0) {
    return null;
  }
  return (
    <div className="flex gap-2">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger
          className="flex-1"
          size="sm"
          aria-label={`${noun} to sync`}
          placeholder={`Add a ${noun} to sync`}
        />
        <SelectContent>
          {options.map((option) => {
            return (
              <SelectItem key={option.key} value={option.key}>
                {label(option)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        disabled={!target}
        loading={add.isPending}
        onClick={() => {
          return target && add.mutate({ provider, target }, {
            onSuccess: () => {
              return setSelected('');
            },
          });
        }}
      >
        Add
      </Button>
    </div>
  );
}
