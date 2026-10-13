'use client';

import { ToggleGroup } from 'radix-ui';
import { useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

const sizes = {
  sm: 'h-6 px-2 text-xs [&_svg]:size-3.5',
  md: 'h-8 px-2.5 text-sm [&_svg]:size-4',
};

type Option<T extends string> = { value: T; label: ReactNode; icon?: ReactNode };

type SegmentedButtonProps<T extends string> = {
  /** The choices, as `{ value, label, icon? }`. */
  options: Option<T>[];
  /** Selected value, for a controlled component. */
  value?: T;
  /**
   * Initially selected value when uncontrolled.
   * @default options[0].value
   */
  defaultValue?: T;
  /** Called with the newly selected value. */
  onValueChange?: (value: T) => void;
  /** Required: names the group for screen readers. */
  'aria-label': string;
  /**
   * `sm` for a secondary switch that shouldn't draw the eye.
   * @default 'md'
   */
  size?: keyof typeof sizes;
};

/**
 * Pick one of a few views, e.g. Apps / Files / Chat (Radix ToggleGroup). One option is always selected.
 * - Two to four short options. For more, use a dropdown or tabs.
 * - Use it to switch views or modes, not to trigger actions.
 * - `size="sm"` when the switch is secondary to what's around it.
 */
export default function SegmentedButton<T extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  'aria-label': ariaLabel,
  size = 'md',
}: SegmentedButtonProps<T>) {
  const [current, setCurrent] = useState(defaultValue ?? options[0]?.value);

  return (
    <ToggleGroup.Root
      type="single"
      aria-label={ariaLabel}
      value={value ?? current}
      // Radix emits '' when the active item is clicked again; a segmented control always keeps one
      onValueChange={(next) => {
        if (!next) return;
        // safe: Radix only emits values from our own options
        setCurrent(next as T);
        onValueChange?.(next as T);
      }}
      className="inline-flex gap-0.5 rounded-lg bg-fill-hover p-0.5"
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-transparent font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary data-[state=on]:border-border data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm',
            sizes[size],
          )}
        >
          {option.icon}
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
