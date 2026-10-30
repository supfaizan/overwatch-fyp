'use client';

import Button from '@/shared/components/button';
import { MENU_CONTENT_CLASS } from '@/shared/components/dropdown-menu';
import Spinner from '@/shared/components/spinner';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { Smiley } from '@phosphor-icons/react/ssr';
import dynamic from 'next/dynamic';
import { Popover } from 'radix-ui';
import { useState } from 'react';

// the picker and its data load the first time one is opened
const Panel = dynamic(() => {
  return import('./emoji-picker-panel');
}, {
  ssr: false,
  loading: () => {
    return (
      <div className="flex h-80 w-72 items-center justify-center">
        <Spinner aria-hidden />
      </div>
    );
  },
});

/** A smiley button that opens an emoji picker; picking one calls `onPick` and closes it. */
export default function EmojiPicker(
  { label, onPick, onOpenChange }: {
    /** What picking does, e.g. "Add reaction". */
    label: string;
    onPick: (emoji: string) => void;
    /** Opened or closed (picked or not), e.g. to keep a hover toolbar showing while it's open. */
    onOpenChange?: (open: boolean) => void;
  },
) {
  const [open, setOpen] = useState(false);
  const change = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  return (
    <Popover.Root open={open} onOpenChange={change}>
      <Tooltip content={label}>
        <Popover.Trigger asChild>
          <Button size="sm" variant="tertiary" iconOnly aria-label={label}>
            <Smiley aria-hidden />
          </Button>
        </Popover.Trigger>
      </Tooltip>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          sideOffset={6}
          collisionPadding={8}
          className={cn(MENU_CONTENT_CLASS, 'p-0')}
        >
          <Panel
            onPick={(emoji) => {
              onPick(emoji);
              change(false);
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
