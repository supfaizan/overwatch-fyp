import { popIn } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/cn';
import { DropdownMenu as Menu } from 'radix-ui';
import type { ComponentProps } from 'react';

/** A menu panel's look, shared with the context menu so both menus match. */
export const MENU_CONTENT_CLASS = cn(
  'z-50 min-w-44 rounded-lg border border-border bg-surface p-1 shadow-chrome shadow-border',
  popIn,
);

/** A group heading's look, shared with the context menu. */
export const MENU_LABEL_CLASS =
  'px-2 py-1.5 text-xs font-semibold tracking-wide text-muted uppercase';

/** A menu item's look, shared with the context menu. */
export const menuItemClass = (danger?: boolean) =>
  cn(
    'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-fill-hover [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted',
    danger && 'text-danger data-highlighted:bg-danger/10 [&_svg]:text-danger',
  );

// unstyled Radix parts, re-exported so callers only import from here
export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

/**
 * Menu of actions under a trigger (Radix DropdownMenu). Compose `DropdownMenu` > `DropdownMenuTrigger asChild` + `DropdownMenuContent` > items.
 * Accepts every Radix `Content` prop (`align`, `side`...).
 * - Use it for actions. To pick a value in a form, use a select.
 * - Put destructive items last, after a separator, with `danger`.
 * - Keep it short; group related items with `DropdownMenuLabel` and separators.
 */
export function DropdownMenuContent(
  { className, sideOffset = 6, ...props }: ComponentProps<typeof Menu.Content>,
) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={sideOffset}
        className={cn(MENU_CONTENT_CLASS, className)}
        {...props}
      />
    </Menu.Portal>
  );
}

type ItemProps = ComponentProps<typeof Menu.Item> & {
  /** Red styling for destructive actions like delete. */
  danger?: boolean;
};

/** One action in the menu. Use `onSelect` (not `onClick`); a leading icon is sized and muted for you. */
export function DropdownMenuItem({ className, danger, ...props }: ItemProps) {
  return (
    <Menu.Item
      className={cn(menuItemClass(danger), className)}
      {...props}
    />
  );
}

/** Small uppercase heading for a group of items. Not selectable. */
export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return <Menu.Label className={cn(MENU_LABEL_CLASS, className)} {...props} />;
}

/** Thin line between groups of items. */
export function DropdownMenuSeparator(
  { className, ...props }: ComponentProps<typeof Menu.Separator>,
) {
  return <Menu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />;
}
