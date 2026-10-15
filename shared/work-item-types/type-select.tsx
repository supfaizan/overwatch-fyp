'use client';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import { useWorkItemTypes } from './hooks';
import TypeIcon from './type-icon';

type TypeSelectProps = {
  value: string | undefined;
  onChange: (typeId: string) => void;
  /** The types it may change to; others show disabled. Null or omitted: any. */
  allowed?: string[] | null;
  disabled?: boolean;
  /** @default 'md' */
  size?: 'sm' | 'md';
};

/** Picks a work item's type, each shown with its icon. */
export default function TypeSelect(
  { value, onChange, allowed = null, disabled = false, size = 'md' }: TypeSelectProps,
) {
  const types = useWorkItemTypes();
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || types.isPending}>
      <SelectTrigger
        aria-label="Type"
        size={size}
        placeholder={types.isPending ? 'Loading types…' : 'Type'}
      />
      <SelectContent>
        {types.data?.map((type) => (
          <SelectItem
            key={type.id}
            value={type.id}
            disabled={Boolean(allowed) && !allowed?.includes(type.id) && type.id !== value}
          >
            <span className="flex items-center gap-2">
              <TypeIcon type={type} />
              {type.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
