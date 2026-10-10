import StatusTag from '@/shared/components/status-tag';

export function Statuses() {
  return (
    <>
      <StatusTag status="pending" />
      <StatusTag status="in_progress" />
      <StatusTag status="done" />
      <StatusTag status="done" done="Synced" />
      <StatusTag status="failed" />
    </>
  );
}
