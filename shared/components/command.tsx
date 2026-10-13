'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { MagnifyingGlass } from '@phosphor-icons/react/ssr';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { popIn } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/cn';
import Kbd from './kbd';

/**
 * A searchable list of actions (cmdk). Compose `Command` > `CommandInput` + `CommandList` > `CommandEmpty` + `CommandGroup`s > `CommandItem`s.
 * Filtering, arrow keys and Enter work out of the box; for a ⌘K palette, put it in a `CommandDialog`.
 * - Name items as actions or places ("Open settings", "Dashboard") and group them by kind.
 * - Add `keywords` to an item for synonyms people may type.
 * - Close the palette before running an item that navigates or opens something else.
 */
export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return <CommandPrimitive loop className={cn('flex w-full flex-col overflow-hidden text-sm', className)} {...props} />;
}

/** The search field, with a search icon. */
export function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-3">
      <MagnifyingGlass className="size-4 shrink-0 text-muted" aria-hidden />
      <CommandPrimitive.Input className={cn('h-11 w-full bg-transparent outline-none placeholder:text-muted', className)} {...props} />
    </div>
  );
}

/** The scrolling results area. */
export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={cn('max-h-80 overflow-y-auto overscroll-contain p-1', className)} {...props} />;
}

/** Shown when nothing matches the search. */
export function CommandEmpty({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className={cn('py-6 text-center text-muted', className)} {...props} />;
}

/** A labelled group of items; pass the label as `heading`. Hidden when none of its items match. */
export function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn('**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted', className)}
      {...props}
    />
  );
}

/** One action. `onSelect` runs on click or Enter; an icon child is sized automatically and muted unless it has its own `text-*` colour. */
export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        'flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-fill-hover [&_svg]:size-4 [&_svg]:shrink-0 [&_svg:not([class*=text-])]:text-muted',
        className,
      )}
      {...props}
    />
  );
}

/** A shortcut hint on the right of an item. */
export function CommandShortcut({ className, ...props }: ComponentProps<'kbd'>) {
  return <Kbd className={cn('ml-auto', className)} {...props} />;
}

type CommandDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Required: the accessible name, read by screen readers only. */
  title: string;
  /** The `CommandInput` and `CommandList`. */
  children: ReactNode;
};

/** A `Command` in a modal, near the top of the screen, for a ⌘K palette. Esc or a click outside closes it. */
export function CommandDialog({ open, onOpenChange, title, children }: CommandDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            'fixed top-[15dvh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-chrome shadow-border outline-none',
            popIn,
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <Command>{children}</Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
