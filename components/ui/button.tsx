import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/** PostHog-style physical button: the face sits on a solid ledge, lifts on
 *  hover and sinks into it on press. The ledge's bottom edge never moves
 *  (face offset + ledge height stay constant), so the press reads as real
 *  depth instead of a jump. Variants pick the ledge colour via --ow-ledge. */
const PRESSABLE =
  "border shadow-[0_3px_0_var(--ow-ledge)] hover:-translate-y-px hover:shadow-[0_4px_0_var(--ow-ledge)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--ow-ledge)] disabled:translate-y-0"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,color,border-color] duration-150 ease-out outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: `${PRESSABLE} border-cta-ledge bg-cta text-cta-ink [--ow-ledge:var(--ow-cta-ledge)] hover:bg-cta-hover`,
        destructive:
          `${PRESSABLE} border-critical bg-destructive text-destructive-foreground [--ow-ledge:color-mix(in_oklab,var(--ow-critical)_70%,black)] focus-visible:ring-destructive/20`,
        outline:
          `${PRESSABLE} border-line-2 bg-surface-1 text-text-hi [--ow-ledge:var(--ow-line-2)] hover:border-cta-ledge hover:[--ow-ledge:var(--ow-cta-ledge)]`,
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
