import { cn } from '@/shared/lib/cn';
import { Check, Minus } from '@phosphor-icons/react/ssr';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

/**
 * Checkbox (Radix Checkbox). Accepts every Radix `Checkbox.Root` prop (`checked`, `onCheckedChange`...).
 * - `checked="indeterminate"` shows the partial state, e.g. "select all" when only some rows are selected.
 * - Wrap it in a `<label>` with the text so the label is clickable.
 */
export default function Checkbox(
  { className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>,
) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'group inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border border-border-strong bg-surface text-white transition-colors hover:border-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3.5 group-data-[state=indeterminate]:hidden" weight="bold" />
        <Minus className="hidden size-3.5 group-data-[state=indeterminate]:block" weight="bold" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
