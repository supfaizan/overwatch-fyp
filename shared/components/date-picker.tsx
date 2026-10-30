'use client';

import { popIn } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/cn';
import { fromIsoDay, toIsoDay } from '@/shared/lib/time';
import { CalendarBlank, CaretLeft, CaretRight, X } from '@phosphor-icons/react/ssr';
import { Popover } from 'radix-ui';
import { useState } from 'react';
import { type ChevronProps, DayPicker } from 'react-day-picker';
import { field, fieldSizes } from './input';

function Chevron({ orientation }: ChevronProps) {
  return orientation === 'left'
    ? <CaretLeft className="size-4" />
    : <CaretRight className="size-4" />;
}

const displayFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

type DatePickerProps = {
  /** The picked day as `YYYY-MM-DD`, or `null` when empty. */
  value: string | null;
  /** Called with the new `YYYY-MM-DD` day, or `null` when cleared. */
  onChange: (value: string | null) => void;
  /** Earliest pickable day, `YYYY-MM-DD`. */
  min?: string;
  /** Latest pickable day, `YYYY-MM-DD`. */
  max?: string;
  /**
   * Matches Input and Button heights.
   * @default 'md'
   */
  size?: keyof typeof fieldSizes;
  /**
   * Shown when no day is picked.
   * @default 'Pick a date'
   */
  placeholder?: string;
  /** Hides the clear button and the calendar. */
  disabled?: boolean;
  /** Set on the trigger, for a `<label htmlFor>`. */
  id?: string;
  /** Required unless a visible `<label htmlFor>` points at `id`. */
  'aria-label'?: string;
  /** Goes on the outer field (width, margins). */
  className?: string;
};

/**
 * Pick a single day from a calendar popover. The field looks like an Input; clicking anywhere on it opens the calendar.
 * - Values are `YYYY-MM-DD` strings in local time, matching the API, so no timezone shift creeps in.
 * - Label it with `aria-label` or a visible `<label htmlFor>` pointing at `id`.
 * - Use `min`/`max` for ranges, e.g. an end date's `min` is the start date.
 */
export function DatePicker(
  {
    value,
    onChange,
    min,
    max,
    size = 'md',
    placeholder = 'Pick a date',
    disabled,
    id,
    className,
    ...props
  }: DatePickerProps,
) {
  const [open, setOpen] = useState(false);
  const selected = value ? fromIsoDay(value) : undefined;
  const bounds = [
    ...(min ? [{ before: fromIsoDay(min) }] : []),
    ...(max ? [{ after: fromIsoDay(max) }] : []),
  ];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          field,
          fieldSizes[size],
          'flex items-center gap-2',
          className,
        )}
      >
        <Popover.Trigger
          id={id}
          disabled={disabled}
          aria-label={props['aria-label']}
          className={cn(
            'flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 text-left outline-none disabled:cursor-not-allowed',
            !selected && 'text-muted',
          )}
        >
          <CalendarBlank className="size-4 shrink-0 text-muted" />
          <span className="truncate">
            {selected ? displayFormat.format(selected) : placeholder}
          </span>
        </Popover.Trigger>
        {selected && !disabled && (
          <button
            type="button"
            aria-label="Clear date"
            className="flex cursor-pointer rounded-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => {
              return onChange(null);
            }}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className={cn(
            'z-50 rounded-lg border border-border bg-surface p-3 shadow-chrome shadow-border',
            popIn,
          )}
        >
          <DayPicker
            mode="single"
            autoFocus
            showOutsideDays
            selected={selected}
            defaultMonth={selected}
            disabled={bounds}
            onSelect={(day) => {
              onChange(day ? toIsoDay(day) : null);
              setOpen(false);
            }}
            components={{ Chevron }}
            classNames={{
              root: 'relative text-sm',
              months: 'flex',
              month: 'flex flex-col gap-2',
              month_caption: 'flex h-8 items-center px-1 font-medium',
              nav: 'absolute top-0 right-0 flex gap-1',
              button_previous:
                'flex size-8 cursor-pointer items-center justify-center rounded-md text-muted outline-none hover:bg-fill-hover focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40',
              button_next:
                'flex size-8 cursor-pointer items-center justify-center rounded-md text-muted outline-none hover:bg-fill-hover focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40',
              month_grid: 'border-collapse',
              weekday: 'size-8 text-xs font-normal text-muted',
              day: 'size-8 p-0 text-center',
              day_button:
                'size-8 cursor-pointer rounded-md outline-none hover:bg-fill-hover focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
              today: 'font-semibold text-primary',
              selected: '[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary',
              outside: 'text-muted/60',
              disabled: 'opacity-40',
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
