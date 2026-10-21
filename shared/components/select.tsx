import { popIn } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/cn';
import { CaretDown, Check } from '@phosphor-icons/react/ssr';
import { Select as SelectPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { field, fieldSizes } from './input';

// unstyled Radix root, re-exported so callers only import from here; takes `value`/`onValueChange`
export const Select = SelectPrimitive.Root;

type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger> & {
  /** Shown until a value is picked. */
  placeholder?: string;
  /**
   * Matches Input and Button heights.
   * @default 'md'
   */
  size?: keyof typeof fieldSizes;
};

/**
 * Pick one value from a list (Radix Select). Compose `Select` > `SelectTrigger` + `SelectContent` > `SelectItem`s.
 * Keyboard and typeahead work out of the box; the field looks like an Input.
 * - Use it to choose a value in a form. For actions, use a DropdownMenu.
 * - Label it with a visible `<label htmlFor>` pointing at the trigger's `id`, or `aria-label`.
 * - Past a few dozen options, sort them so typeahead stays useful.
 */
export function SelectTrigger(
  { className, placeholder, size = 'md', ...props }: SelectTriggerProps,
) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        field,
        fieldSizes[size],
        'flex w-full cursor-pointer items-center justify-between gap-2 text-left outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 data-placeholder:text-muted [&>span]:truncate',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Value placeholder={placeholder} />
      <SelectPrimitive.Icon asChild>
        <CaretDown className="size-4 shrink-0 text-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/** The dropdown list, as wide as the trigger. Scrolls when long. */
export function SelectContent(
  { className, children, ...props }: ComponentProps<typeof SelectPrimitive.Content>,
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={6}
        className={cn(
          'z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-border bg-surface shadow-chrome shadow-border',
          popIn,
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/** One option. `value` is what `onValueChange` receives; children are what's shown. */
export function SelectItem(
  { className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>,
) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex h-8 cursor-pointer items-center gap-2 rounded-md pr-8 pl-2 text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-fill-hover',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <Check className="size-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
