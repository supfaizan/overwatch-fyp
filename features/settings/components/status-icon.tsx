import Spinner from '@/shared/components/spinner';
import Tooltip from '@/shared/components/tooltip';
import { CONNECTION_STATUS, type ConnectionStatus } from '@/shared/connections/constants';
import { JOB_STATUS, type JobStatus } from '@/shared/lib/job-status';
import { timeAgo } from '@/shared/lib/time';
import { CheckCircle, Clock, MinusCircle, WarningCircle } from '@phosphor-icons/react/ssr';
import type { ReactNode } from 'react';

/** A state as one colored icon; the tooltip (and screen readers) get the words. */
function StatusIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip content={label}>
      <span
        role="img"
        aria-label={label}
        tabIndex={0}
        className="inline-flex shrink-0 rounded-full [&_svg]:size-5"
      >
        {children}
      </span>
    </Tooltip>
  );
}

const CONNECTION_ICONS: Record<ConnectionStatus, { label: string; icon: ReactNode }> = {
  [CONNECTION_STATUS.active]: {
    label: 'Connected',
    icon: <CheckCircle weight="fill" className="text-success" />,
  },
  [CONNECTION_STATUS.needsReauth]: {
    label: 'Needs reconnecting',
    icon: <WarningCircle weight="fill" className="text-warning-strong" />,
  },
  [CONNECTION_STATUS.disconnected]: {
    label: 'Not connected',
    icon: <MinusCircle className="text-muted" />,
  },
};

export function ConnectionStatusIcon({ status }: { status: ConnectionStatus }) {
  const { label, icon } = CONNECTION_ICONS[status];
  return <StatusIcon label={label}>{icon}</StatusIcon>;
}

export function SyncStatusIcon(
  { status, lastSyncedAt, error }: {
    status: JobStatus;
    lastSyncedAt: string | null;
    error: string | null;
  },
) {
  const label = {
    [JOB_STATUS.pending]: 'Queued to sync',
    [JOB_STATUS.inProgress]: 'Syncing',
    [JOB_STATUS.done]: lastSyncedAt ? `Synced ${timeAgo(lastSyncedAt)}` : 'Synced',
    [JOB_STATUS.failed]: error ? `Sync failed: ${error}` : 'Sync failed',
  }[status];
  return (
    <StatusIcon label={label}>
      {status === JOB_STATUS.done && <CheckCircle weight="fill" className="text-success" />}
      {status === JOB_STATUS.inProgress && <Spinner aria-hidden className="text-primary" />}
      {status === JOB_STATUS.pending && <Clock className="text-muted" />}
      {status === JOB_STATUS.failed && <WarningCircle weight="fill" className="text-danger" />}
    </StatusIcon>
  );
}
