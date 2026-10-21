'use client';

import { cn } from '@/shared/lib/cn';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

type RadioGroupProps<T extends string> =
  & Omit<ComponentProps<typeof RadioGroupPrimitive.Root>, 'value' | 'onValueChange' | 'children'>
  & {
    /** One radio per option, in order. */
    options: readonly { value: T; label: string }[];
    value?: T;
    onValueChange?: (value: T) => void;
  };

/**
 * A set of radios where exactly one can be picked (Radix RadioGroup). Arrow keys move between options.
 * - Prefer it over `Select` for a handful of options that are worth seeing at once.
 * - Inside a form, put it in a `FormField` with `group` and spread `describedBy` on it.
 * - With react-hook-form, wire it through `Controller`: it isn't a native input, so `register` won't work.
 */
export default function RadioGroup<T extends string>(
  { options, value, onValueChange, className, ...props }: RadioGroupProps<T>,
) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(next) => {
        const option = options.find((candidate) => {
          return candidate.value === next;
        });
        if (option) {
          onValueChange?.(option.value);
        }
      }}
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      {options.map((option) => {
        return (
          <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm">
            <RadioGroupPrimitive.Item
              value={option.value}
              className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border-strong bg-surface transition-colors hover:border-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-primary"
            >
              <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary" />
            </RadioGroupPrimitive.Item>
            {option.label}
          </label>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
