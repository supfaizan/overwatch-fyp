import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

const tagVariants = cva(
  'inline-flex h-5 items-center gap-1 rounded border px-1.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3',
  {
    variants: {
      /**
       * Status color. `warning` uses the darker warning tone so text stays readable.
       * @default 'default'
       */
      variant: {
        default: 'border-border-strong bg-fill-hover text-foreground',
        primary: 'border-primary/30 bg-primary/10 text-primary',
        success: 'border-success/30 bg-success/10 text-success',
        warning: 'border-warning/50 bg-warning/10 text-warning-strong',
        danger: 'border-danger/30 bg-danger/10 text-danger',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

/**
 * Small status label, e.g. `<Tag variant="warning">Beta</Tag>`. Accepts every native `<span>` prop.
 * - Keep it to one or two words; it labels, it doesn't explain.
 * - Don't rely on color alone: the text itself should carry the meaning.
 * - Not clickable. For a filter chip or toggle, use a Button.
 */
export default function Tag({ className, variant, ...props }: ComponentProps<'span'> & VariantProps<typeof tagVariants>) {
  return <span className={cn(tagVariants({ variant }), className)} {...props} />;
}
