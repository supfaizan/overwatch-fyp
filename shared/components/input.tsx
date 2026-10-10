import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

// shared field chrome; focus/invalid/disabled are read off the inner control via has-*
const field =
  'rounded-md border border-border-strong bg-surface transition-[border-color,box-shadow] hover:border-border-hover focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15 has-disabled:opacity-60 has-[[aria-invalid=true]]:border-danger has-[[aria-invalid=true]]:ring-danger/15';

const sizes = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-9 px-2.5 text-sm',
  lg: 'h-11 px-3 text-base',
};

type InputProps = Omit<ComponentProps<'input'>, 'size' | 'prefix'> & {
  /**
   * Matches the Button heights, so inputs and buttons line up in a row.
   * @default 'md'
   */
  size?: keyof typeof sizes;
  /** Rendered inside the field before the text, e.g. a search icon. SVGs are sized and muted for you. */
  prefix?: ReactNode;
  /** Rendered inside the field after the text, e.g. a `<Kbd>` hint or a clear button. */
  suffix?: ReactNode;
};

/**
 * Text input with optional prefix/suffix slots. Also accepts every native `<input>` prop.
 * - `className` goes on the outer field (width, margins); every other prop goes to the `<input>`.
 * - Always label it: a visible `<label htmlFor>` or `aria-label`. Placeholders aren't labels.
 * - Set `aria-invalid` to show the error state, and point `aria-describedby` at the error message.
 */
export function Input({ className, size = 'md', prefix, suffix, ...props }: InputProps) {
  return (
    <div className={cn(field, sizes[size], 'flex items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted', className)}>
      {prefix}
      <input
        className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted disabled:cursor-not-allowed"
        {...props}
      />
      {suffix}
    </div>
  );
}

/**
 * Multi-line text field with the same look and states as `Input`. Accepts every native `<textarea>` prop.
 * - Label it the same way as `Input`, and use `rows` or `className` for height.
 */
export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(field, 'min-h-20 w-full px-2.5 py-2 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed', className)}
      {...props}
    />
  );
}
