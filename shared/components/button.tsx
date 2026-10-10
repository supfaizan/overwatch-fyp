import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps, CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';
import Spinner from './spinner';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none transition-[translate,box-shadow,background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      // --btn-* vars hold the defaults; the matching props override them via inline style
      /**
       * Visual weight: `primary` for the one main action, `secondary` for the rest, `tertiary` for low-emphasis/toolbar actions.
       * @default 'secondary'
       */
      variant: {
        primary:
          '[--btn-bg:var(--color-primary)] [--btn-border:var(--color-primary-strong)] [--btn-edge:var(--color-primary-strong)] [--btn-text:var(--color-white)]',
        // inline style beats the hover var, so a `border` prop sticks on hover too
        secondary:
          '[--btn-bg:var(--color-surface)] [--btn-border:var(--color-border-strong)] [--btn-edge:var(--color-border-strong)] [--btn-text:var(--color-foreground)] hover:[--btn-border:var(--color-border-hover)]',
        tertiary: 'hover:bg-fill-hover active:bg-fill-active',
      },
      /** @default 'md' */
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-9 px-3 text-sm',
        lg: 'h-11 px-4 text-base',
      },
      /**
       * PostHog's 3D edge (primary/secondary only): lifts on hover, sinks on press. `false` gives a flat button.
       * @default true
       */
      raised: { true: '', false: '' },
      /** Square button for a lone icon. Always pair with `aria-label`. */
      iconOnly: { true: 'aspect-square px-0', false: '' },
    },
    compoundVariants: [
      {
        variant: ['primary', 'secondary'],
        class: 'border border-(--btn-border) bg-(--btn-bg) text-(--btn-text)',
      },
      // PostHog's 3D look: bottom edge always visible, lifts on hover, sinks on press (edge bottom stays put)
      {
        variant: ['primary', 'secondary'],
        raised: true,
        class:
          'shadow-chrome shadow-(color:--btn-edge) hover:-translate-y-px hover:shadow-chrome-hover active:translate-y-0.75 active:shadow-chrome-press',
      },
    ],
    defaultVariants: { variant: 'secondary', size: 'md', raised: true },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Render as the child element instead, e.g. `<Button asChild><Link href="/" /></Button>`. */
    asChild?: boolean;
    /** Disables the button and shows a spinner. Ignored with `asChild` (Slot needs a single child). */
    loading?: boolean;
    /** Background color override, any CSS color (`'var(--color-success)'`, `'#0a0'`). Primary/secondary only. */
    bg?: string;
    /** Border color override. Primary/secondary only. */
    border?: string;
    /** Bottom 3D edge color override. Primary/secondary only. */
    edge?: string;
    /** Text color override. Primary/secondary only. */
    text?: string;
  };

/**
 * The app's button, styled after PostHog's raised buttons. Also accepts every native `<button>` prop.
 * - Use one `primary` per view for the main action; everything else is `secondary` or `tertiary`.
 * - Use `asChild` with `<Link>` for navigation instead of `onClick={() => router.push()}`.
 * - Prefer the color override props over `className` for colors, so hover/press states keep working.
 * - Give icon-only buttons an `aria-label`, and a `Tooltip` when the icon isn't obvious.
 */
export default function Button({
  className,
  variant,
  size,
  raised,
  iconOnly,
  asChild,
  loading,
  bg,
  border,
  edge,
  text,
  style,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  const vars = { '--btn-bg': bg, '--btn-border': border, '--btn-edge': edge, '--btn-text': text };
  const busy = loading && !asChild;
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, raised, iconOnly }), className)}
      // undefined vars are skipped by React, so the variant defaults kick in
      style={{ ...vars, ...style } as CSSProperties}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {/* Slot needs a single child; aria-busy already announces loading; icon-only buttons swap their icon for the spinner */}
      {asChild ? (
        children
      ) : (
        <>
          {busy && <Spinner aria-hidden />}
          {!(busy && iconOnly) && children}
        </>
      )}
    </Comp>
  );
}
