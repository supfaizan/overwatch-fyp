'use client';

import { GearSix, Moon, SquaresFour } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import Button from '@/shared/components/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/shared/components/command';

const items = (
  <>
    <CommandEmpty>No results.</CommandEmpty>
    <CommandGroup heading="Navigate">
      <CommandItem>
        <SquaresFour /> Dashboard
      </CommandItem>
      <CommandItem keywords={['preferences']}>
        <GearSix /> Settings <CommandShortcut>,</CommandShortcut>
      </CommandItem>
    </CommandGroup>
    <CommandGroup heading="Theme">
      <CommandItem>
        <Moon /> Dark
      </CommandItem>
    </CommandGroup>
  </>
);

export function Inline() {
  return (
    <Command className="max-w-sm rounded-lg border border-border bg-surface">
      <CommandInput placeholder="Search…" />
      <CommandList>{items}</CommandList>
    </Command>
  );
}

export function Palette() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open palette</Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Command menu">
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>{items}</CommandList>
      </CommandDialog>
    </>
  );
}
