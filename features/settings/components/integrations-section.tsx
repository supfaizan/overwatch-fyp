'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import GithubMark from '@/shared/components/github-mark';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import Tooltip from '@/shared/components/tooltip';
import {
  CONNECTION_STATUS,
  CONNECTOR_CATEGORY,
  type ConnectorCategory,
  PROVIDER,
} from '@/shared/connections/constants';
import { INTEGRATION_LOGOS } from '@/shared/lib/integrations';
import ConnectGithubButton, { useGithubLinkResult } from '@/shared/repos/connect-github-button';
import { useInstallations } from '@/shared/repos/hooks';
import { useSession } from '@/shared/session/store';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE } from '@/shared/workspaces/types';
import {
  ArrowsClockwise,
  ArrowSquareOut,
  BookOpen,
  Kanban,
  Plugs,
} from '@phosphor-icons/react/ssr';
import Image from 'next/image';
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
import { ConnectionStatusIcon, SyncStatusIcon } from './status-icon';

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
      description="The tools we read from to understand your project."
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

// tracker logos, by provider; anything else falls back to its category's icon
const PROVIDER_LOGOS: Record<string, string> = {
  [PROVIDER.jira]: INTEGRATION_LOGOS.jira,
  [PROVIDER.confluence]: INTEGRATION_LOGOS.confluence,
};
const LOGO_SIZE = 24;

/** One integration: logo, name and state up top with its actions; what it syncs listed underneath. */
function IntegrationCard(
  { logo, name, detail, status, actions, children }: {
    logo: ReactNode;
    name: string;
    /** Under the name, e.g. the category and the connected site. */
    detail: string;
    status: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
  },
) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface [&_svg]:size-5">
          {logo}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium">{name}</p>
            {status}
          </div>
          <p className="truncate text-xs text-muted">{detail}</p>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}

/** The things an integration covers, one per row, divided like a table. */
function ItemList({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-border border-t border-border text-sm">{children}</ul>;
}

function Item({ children }: { children: ReactNode }) {
  return <li className="flex min-h-11 items-center justify-between gap-3 px-4 py-2">{children}</li>;
}

function SourceControl({ authorized, needsReauth }: { authorized: boolean; needsReauth: boolean }) {
  const installations = useInstallations(authorized);
  const accounts = installations.data?.installations ?? [];
  const hasGithub = useSession((state) => {
    return Boolean(state.user?.github_login);
  });
  useGithubLinkResult();
  const notConnected = !authorized && !hasGithub;
  const expired = !notConnected && (needsReauth || !authorized);

  return (
    <IntegrationCard
      logo={<GithubMark />}
      name="GitHub"
      detail="Source control"
      status={
        <ConnectionStatusIcon
          status={notConnected
            ? CONNECTION_STATUS.disconnected
            : expired
            ? CONNECTION_STATUS.needsReauth
            : CONNECTION_STATUS.active}
        />
      }
      actions={notConnected
        ? <ConnectGithubButton returnTo="settings" />
        : installations.data && (
          <Button asChild size="sm" variant="tertiary">
            <a href={installations.data.install_url} target="_blank" rel="noopener noreferrer">
              Manage on GitHub <ArrowSquareOut />
            </a>
          </Button>
        )}
    >
      {expired && (
        <div className="border-t border-border p-4">
          <Banner type="warning" action={<ConnectGithubButton returnTo="settings" reconnect />}>
            Your GitHub authorization expired or was revoked.
          </Banner>
        </div>
      )}
      {accounts.length > 0 && (
        <ItemList>
          {accounts.map((account) => {
            return (
              <Item key={account.id}>
                <span className="min-w-0 truncate">
                  <span className="font-medium">{account.account_login}</span>
                  <span className="text-muted">{' · '}{account.account_type.toLowerCase()}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {account.repository_selection === 'all'
                    ? 'All repositories'
                    : 'Selected repositories'}
                </span>
              </Item>
            );
          })}
        </ItemList>
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
    /** why to reconnect a grant that can write but predates something newer */
    outdated: string;
    disconnect: string;
    targetLabel: (target: Target) => string;
  }
> = {
  [CONNECTOR_CATEGORY.workItems]: {
    icon: <Kanban />,
    label: 'Issue tracker',
    target: 'project',
    reconnect: 'to edit, move and create its tickets from the board',
    outdated: "to import its boards' columns and sprints",
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
    outdated: 'to keep its spaces syncing fully',
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
  const { provider, name, category, status, can_write, outdated, external_account, targets } =
    connection;
  const copy = CATEGORY_COPY[category];
  const connect = useStartAuthorization();
  const disconnect = useDisconnect(name);
  const sync = useSyncNow(name);
  const connected = status === CONNECTION_STATUS.active;
  // only admins connect, sync and disconnect; members see the state
  const isAdmin = hasRole(useCurrentWorkspace()?.role, ROLE.admin);
  const logo = PROVIDER_LOGOS[provider];

  return (
    <IntegrationCard
      logo={logo
        ? (
          <Image
            src={logo}
            alt=""
            width={LOGO_SIZE}
            height={LOGO_SIZE}
            className="size-6 object-contain"
          />
        )
        : copy.icon}
      name={name}
      detail={[copy.label, external_account?.name].filter(Boolean).join(' · ')}
      status={<ConnectionStatusIcon status={status} />}
      actions={isAdmin && (connected
        ? (
          <>
            {targets.length > 0 && (
              <Tooltip content="Sync now">
                <Button
                  size="sm"
                  variant="tertiary"
                  iconOnly
                  aria-label={`Sync ${name} now`}
                  loading={sync.isPending}
                  onClick={() => {
                    return sync.mutate(provider);
                  }}
                >
                  <ArrowsClockwise />
                </Button>
              </Tooltip>
            )}
            <ConfirmDialog
              trigger={
                <Tooltip content="Disconnect">
                  <Button size="sm" variant="tertiary" iconOnly aria-label={`Disconnect ${name}`}>
                    <Plugs />
                  </Button>
                </Tooltip>
              }
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
            {status === CONNECTION_STATUS.needsReauth ? 'Reconnect' : 'Connect'}
          </Button>
        ))}
    >
      {isAdmin && connected && (!can_write || outdated) && (
        <div className="border-t border-border p-4">
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
            Reconnect {name} {can_write ? copy.outdated : copy.reconnect}.
          </Banner>
        </div>
      )}
      {(targets.length > 0 || (isAdmin && connected)) && (
        <ItemList>
          {targets.map((target) => {
            return (
              <Item key={target.key}>
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
                <SyncStatusIcon
                  status={target.sync_status}
                  lastSyncedAt={target.last_synced_at}
                  error={target.sync_error}
                />
              </Item>
            );
          })}
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
        </ItemList>
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
    return (
      <Item>
        <Skeleton className="h-8 w-full" />
      </Item>
    );
  }
  if (options.length === 0) {
    return null;
  }
  return (
    <li className="flex gap-2 bg-fill-hover px-4 py-3">
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
    </li>
  );
}
