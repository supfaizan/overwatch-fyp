'use client';

import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from 'input-otp';
import { useContext, type ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Every `input-otp` prop: `maxLength` (the code's length), `value`/`onChange`, `onComplete`, `disabled`, and
 * `pattern` (which characters may be typed or pasted).
 * @default pattern REGEXP_ONLY_DIGITS
 */
type InputOTPProps = ComponentProps<typeof OTPInput>;

/**
 * One-time code field: one real input drawn as a box per character, with paste, autofill and
 * keyboard navigation handled for you. Compose it from `InputOTPGroup`, `InputOTPSlot` and `InputOTPSeparator`.
 * - Digits only by default, with a numeric keyboard and `autoComplete="one-time-code"` so phones offer the code from the email or SMS.
 * - Label it with `aria-label` (or a `<label htmlFor>` pointing at its `id`), and set `aria-invalid` when the code was wrong.
 * - Use `onComplete` to submit as soon as the last character is entered.
 */
export function InputOTP({ className, containerClassName, pattern = REGEXP_ONLY_DIGITS, ...props }: InputOTPProps) {
  return (
    <OTPInput
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern={pattern}
      containerClassName={cn('group flex items-center gap-2 has-disabled:opacity-60', containerClassName)}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  );
}

/** A row of slots that sit edge to edge. */
export function InputOTPGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center', className)} {...props} />;
}

type InputOTPSlotProps = ComponentProps<'div'> & {
  /** Which character of the code this box shows, from 0. */
  index: number;
};

/** One character's box; it reads its character and focus state from the surrounding `InputOTP`. */
export function InputOTPSlot({ index, className, ...props }: InputOTPSlotProps) {
  const slot = useContext(OTPInputContext).slots[index];
  return (
    <div
      data-active={slot?.isActive}
      className={cn(
        'relative flex size-11 items-center justify-center border-y border-r border-border-strong bg-surface font-mono text-lg font-semibold transition-[border-color,box-shadow] first:rounded-l-md first:border-l last:rounded-r-md',
        'data-[active=true]:z-10 data-[active=true]:border-primary data-[active=true]:ring-3 data-[active=true]:ring-primary/15',
        'group-has-[[aria-invalid=true]]:border-danger data-[active=true]:group-has-[[aria-invalid=true]]:ring-danger/15',
        className,
      )}
      {...props}
    >
      {slot?.char}
      {slot?.hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-pulse bg-foreground" />
        </div>
      )}
    </div>
  );
}

/** A dash between groups, e.g. 123–456. */
export function InputOTPSeparator(props: ComponentProps<'div'>) {
  return (
    <div role="separator" aria-hidden className="text-muted" {...props}>
      –
    </div>
  );
}
