import Spinner from '@/shared/components/spinner';
import Tag from '@/shared/components/tag';
import type { ParseStatus } from '../types';

const labels: Record<ParseStatus, { text: string; variant: 'default' | 'primary' | 'success' | 'danger' }> = {
  pending: { text: 'Queued', variant: 'default' },
  in_progress: { text: 'Indexing', variant: 'primary' },
  done: { text: 'Indexed', variant: 'success' },
  failed: { text: 'Failed', variant: 'danger' },
};

export default function StatusTag({ status, done = 'Indexed' }: { status: ParseStatus; done?: string }) {
  const { text, variant } = labels[status];
  return (
    <Tag variant={variant}>
      {status === 'in_progress' && <Spinner className="size-3" />}
      {status === 'done' ? done : text}
    </Tag>
  );
}
