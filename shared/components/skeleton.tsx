import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Pulsing loading placeholder. Accepts every native `<div>` prop.
 * - Give it the size and shape of what it stands in for, so the layout doesn't jump when content loads.
 * - It's hidden from screen readers; mark the loading region with `aria-busy` instead.
 */
export default function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-fill-active', className)} {...props} />;
}
