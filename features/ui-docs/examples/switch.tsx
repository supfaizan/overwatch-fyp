import Switch from '@/shared/components/switch';

export function WithLabel() {
  return (
    <>
      <label className="flex items-center gap-2 text-sm">
        <Switch defaultChecked /> Email notifications
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        <Switch disabled /> Slack notifications
      </label>
    </>
  );
}
