import { cn } from '@/shared/lib/cn';
import { ContextMenu as Menu } from 'radix-ui';
import type { ComponentProps } from 'react';
import { MENU_CONTENT_CLASS, MENU_LABEL_CLASS, menuItemClass } from './dropdown-menu';

// unstyled Radix parts, re-exported so callers only import from here
export const ContextMenu = Menu.Root;
export const ContextMenuTrigger = Menu.Trigger;

/**
 * Actions on right-click (or long-press) over an element (Radix ContextMenu); looks the same as the dropdown menu.
 * Compose `ContextMenu` > `ContextMenuTrigger asChild` (the element) + `ContextMenuContent` > items.
 * - Right-click can't be found by keyboard or trackpad users: offer the same actions in a visible `DropdownMenu` too.
 * - Put destructive items last, after a separator, with `danger`.
 * - Use `onSelect` (not `onClick`) on items.
 */
export function ContextMenuContent({ className, ...props }: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content className={cn(MENU_CONTENT_CLASS, className)} {...props} />
    </Menu.Portal>
  );
}

type ItemProps = ComponentProps<typeof Menu.Item> & {
  /** Red styling for destructive actions like delete. */
  danger?: boolean;
};

/** One action in the menu; a leading icon is sized and muted for you. */
export function ContextMenuItem({ className, danger, ...props }: ItemProps) {
  return <Menu.Item className={cn(menuItemClass(danger), className)} {...props} />;
}

/** Small uppercase heading for a group of items. Not selectable. */
export function ContextMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return <Menu.Label className={cn(MENU_LABEL_CLASS, className)} {...props} />;
}

/** Thin line between groups of items. */
export function ContextMenuSeparator(
  { className, ...props }: ComponentProps<typeof Menu.Separator>,
) {
  return <Menu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />;
}
