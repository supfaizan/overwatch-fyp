import { Loader2 } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Loading spinner, announced as "Loading" to screen readers. Inherits text color; size via `className` (`size-6`).
 * - Inside buttons, use `<Button loading>` instead.
 * - For content that has a known shape (lists, cards), prefer a Skeleton.
 */
export default function Spinner({ className, ...props }: ComponentProps<typeof Loader2>) {
  return <Loader2 role="status" aria-label="Loading" className={cn('size-4 animate-spin', className)} {...props} />;
}
