import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { popIn } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/cn';

type TooltipProps = ComponentProps<typeof TooltipPrimitive.Trigger> & {
  /** What the tooltip says. Keep it short and plain text. */
  content: ReactNode;
  /** The trigger: one focusable element, e.g. a Button. */
  children: ReactNode;
  /** @default 'top' */
  side?: ComponentProps<typeof TooltipPrimitive.Content>['side'];
  className?: string;
};

// self-contained: each tooltip brings its own provider, so no app-level setup is needed
/**
 * Hover/focus hint for a single element (Radix Tooltip).
 * - Use it to name icon-only buttons and explain truncated text, never for information the user needs.
 * - Disabled buttons don't fire pointer events; wrap them in a `<span>` to give them a tooltip.
 * - No interactive content inside; use a dropdown or dialog for that.
 * - Works as another component's `asChild` child (e.g. a `DialogTrigger`): extra props reach the trigger.
 */
export default function Tooltip({ content, children, side = 'top', className, ...props }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild {...props}>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn('z-50 max-w-xs rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background', popIn, className)}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
