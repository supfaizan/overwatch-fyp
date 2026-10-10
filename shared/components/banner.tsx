'use client';

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import Button from './button';

const types = {
  info: { icon: Info, box: 'border-border bg-surface', tone: 'text-foreground' },
  success: { icon: CircleCheck, box: 'border-success/40 bg-success/10', tone: 'text-success' },
  warning: { icon: TriangleAlert, box: 'border-warning/50 bg-warning/10', tone: 'text-warning-strong' },
  error: { icon: CircleAlert, box: 'border-danger/40 bg-danger/10', tone: 'text-danger' },
};

type BannerProps = {
  /**
   * Tone and icon. `error`/`warning` are announced immediately by screen readers, `info`/`success` politely.
   * @default 'info'
   */
  type?: keyof typeof types;
  /** The message. */
  children: ReactNode;
  /** Rendered on the right, e.g. a small `<Button size="sm">`. */
  action?: ReactNode;
  /** Shows an X that hides the banner. */
  dismissible?: boolean;
  /** Called after dismissing, e.g. to remember the choice in storage so it stays hidden. */
  onDismiss?: () => void;
  className?: string;
};

/**
 * Inline, page-level message: announcements, sync problems, success confirmations.
 * - For short-lived feedback after an action, use a toast instead.
 * - One banner per concern, at the top of the area it's about.
 * - Keep `error` for things the user must act on, and say what to do in the message.
 */
export default function Banner({ type = 'info', children, action, dismissible, onDismiss, className }: BannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const { icon: Icon, box, tone } = types[type];
  return (
    // alerts interrupt screen readers, info/success are announced politely
    <div
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      className={cn('flex items-center gap-3 rounded-lg border px-4 py-3 text-sm', box, className)}
    >
      <Icon className={cn('size-5 shrink-0', tone)} />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
      {dismissible && (
        <Button
          variant="tertiary"
          size="sm"
          iconOnly
          aria-label="Dismiss"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
        >
          <X />
        </Button>
      )}
    </div>
  );
}
