import { cn } from '@/shared/lib/cn';
import type { ComponentProps } from 'react';

/**
 * Plain surface container with a border. Accepts every native `<div>` prop.
 * - Override padding with `className` (`p-0` for edge-to-edge content).
 * - Don't nest cards; use a `border-t` divider or spacing inside one card instead.
 */
export default function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface p-4', className)} {...props} />
  );
}
