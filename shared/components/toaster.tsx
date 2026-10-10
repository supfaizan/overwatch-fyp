import type { CSSProperties } from 'react';
import { Toaster as Sonner } from 'sonner';

// sonner's own vars point at our tokens, so dark mode follows the theme class for free
/**
 * Toast container (sonner), already mounted once in the root layout. Fire toasts from client code with `toast()` from `'sonner'`.
 * - Use toasts for short feedback after an action ("Saved"). Use `toast.promise` for async work.
 * - Don't put anything the user must act on in a toast; it disappears. Use a Banner or Dialog.
 * - Never mount a second `<Toaster />`.
 */
export default function Toaster() {
  return (
    <Sonner
      style={
        {
          '--normal-bg': 'var(--color-surface)',
          '--normal-text': 'var(--color-foreground)',
          '--normal-border': 'var(--color-border)',
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'font-sans shadow-chrome! shadow-border!',
          description: 'text-muted!',
        },
      }}
    />
  );
}
