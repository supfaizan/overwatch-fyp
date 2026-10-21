import { cn } from '@/shared/lib/cn';
import { Switch as SwitchPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

/**
 * On/off toggle that applies immediately (Radix Switch). Accepts every Radix `Switch.Root` prop (`checked`, `onCheckedChange`...).
 * - Wrap it in a `<label>` with the text so the whole row is clickable.
 * - Use it for settings that take effect right away; inside a form that's submitted later, use a Checkbox.
 */
export default function Switch(
  { className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>,
) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-border-strong transition-colors hover:bg-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:bg-primary',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-[translate] data-[state=checked]:translate-x-4.5" />
    </SwitchPrimitive.Root>
  );
}
