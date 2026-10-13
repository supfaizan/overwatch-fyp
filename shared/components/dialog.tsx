import { X } from '@phosphor-icons/react/ssr';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { popIn } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/cn';
import Button from './button';

// unstyled Radix parts; Close is handy as <DialogClose asChild><Button>Cancel</Button></DialogClose>
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

type DialogContentProps = {
  /** Required: the heading, also used as the dialog's accessible name. */
  title: ReactNode;
  /** One line under the title explaining what's going on. */
  description?: ReactNode;
  /** The body. */
  children?: ReactNode;
  /** Action row, right-aligned: secondary actions first, the primary action last. */
  footer?: ReactNode;
  className?: string;
  /** Esc was pressed inside; call `event.preventDefault()` to keep the dialog open (e.g. Esc cancels an edit instead). */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
};

/**
 * Modal dialog (Radix Dialog). Compose `Dialog` > `DialogTrigger asChild` + `DialogContent`; wrap footer buttons in `DialogClose asChild` to close on click.
 * Focus is trapped inside, and Esc or a click outside closes it.
 * - For confirmations, name the action in the button ("Delete dashboard", not "OK").
 * - Keep it to one task. Long forms belong on a page.
 * - Control it with `open`/`onOpenChange` on `Dialog` when an async action must finish before closing.
 * - Fixed height: pass `flex h-… flex-col` in `className`; the body then fills what's left, so its parts can scroll inside.
 */
export function DialogContent({ title, description, children, footer, className, onEscapeKeyDown }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      {/* the overlay doubles as the centering + scroll container, so tall dialogs scroll */}
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0">
        <DialogPrimitive.Content
          // without a description Radix warns unless this is explicitly undefined
          {...(!description && { 'aria-describedby': undefined })}
          onEscapeKeyDown={onEscapeKeyDown}
          className={cn('w-full max-w-lg rounded-xl border border-border bg-surface shadow-chrome shadow-border outline-none', popIn, className)}
        >
          <div className="flex items-start gap-3 px-5 pt-4">
            <div className="flex-1">
              <DialogPrimitive.Title className="text-base font-semibold">{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted">{description}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="tertiary" size="sm" iconOnly aria-label="Close">
                <X />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children && <div className="min-h-0 flex-1 px-5 py-4 text-sm">{children}</div>}
          {footer && (
            <div className={cn('flex justify-end gap-2 rounded-b-xl border-t border-border bg-background px-5 py-3', !children && 'mt-4')}>
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Overlay>
    </DialogPrimitive.Portal>
  );
}
