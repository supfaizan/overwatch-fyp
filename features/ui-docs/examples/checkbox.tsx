import Checkbox from '@/shared/components/checkbox';

export function States() {
  return (
    <>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox defaultChecked /> Checked
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox /> Unchecked
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked="indeterminate" /> Some selected
      </label>
    </>
  );
}
