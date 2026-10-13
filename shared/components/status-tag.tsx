import { JOB_STATUS, type JobStatus } from '@/shared/lib/job-status';
import Spinner from './spinner';
import Tag from './tag';


const labels: Record<JobStatus, { text: string; variant: 'default' | 'primary' | 'success' | 'danger' }> = {
  pending: { text: 'Queued', variant: 'default' },
  in_progress: { text: 'Indexing', variant: 'primary' },
  done: { text: 'Indexed', variant: 'success' },
  failed: { text: 'Failed', variant: 'danger' },
};

type StatusTagProps = {
  /** A background job's status, as the backend reports it (`parse_status`, `sync_status`). */
  status: JobStatus;
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
      {status === JOB_STATUS.inProgress && <Spinner className="size-3" />}
      {status === JOB_STATUS.done ? done : text}
    </Tag>
  );
}
