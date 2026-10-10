import Spinner from './spinner';
import Tag from './tag';

type Status = 'pending' | 'in_progress' | 'done' | 'failed';

const labels: Record<Status, { text: string; variant: 'default' | 'primary' | 'success' | 'danger' }> = {
  pending: { text: 'Queued', variant: 'default' },
  in_progress: { text: 'Indexing', variant: 'primary' },
  done: { text: 'Indexed', variant: 'success' },
  failed: { text: 'Failed', variant: 'danger' },
};

type StatusTagProps = {
  /** A background job's status, as the backend reports it (`parse_status`, `sync_status`). */
  status: Status;
  /**
   * Label for a finished job, e.g. "Synced" for a tracker.
   * @default 'Indexed'
   */
  done?: string;
};

/**
 * The status of a background job (indexing a repo, syncing a tracker) as a Tag.
 * - A running job shows a spinner, so it reads as live without polling text.
 */
export default function StatusTag({ status, done = 'Indexed' }: StatusTagProps) {
  const { text, variant } = labels[status];
  return (
    <Tag variant={variant}>
      {status === 'in_progress' && <Spinner className="size-3" />}
      {status === 'done' ? done : text}
    </Tag>
  );
}
