import { cn } from '@/shared/lib/cn';
import type { ComponentProps } from 'react';

/**
 * Keyboard shortcut hint, e.g. `<Kbd>⌘K</Kbd>`. The thicker bottom border echoes the raised buttons.
 * - One key or chord per `Kbd`; put separate keys in separate `Kbd`s.
 * - Use it as a hint next to the control the shortcut triggers (e.g. an Input `suffix`), not as the only way to do something.
 */
export default function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-b-2 border-border-strong bg-surface px-1 font-sans text-xs font-medium text-muted',
        className,
      )}
      {...props}
    />
  );
}
