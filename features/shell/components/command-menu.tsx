'use client';

import { Monitor, Moon, SignOut, Sun } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/command';
import { signOut } from '@/shared/session/sign-out';
import { isCommandShortcut } from '../lib';
import { PAGES, SETTINGS_PAGES } from '../nav';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun, color: 'text-accent-amber' },
  { value: 'dark', label: 'Dark', icon: Moon, color: 'text-accent-purple' },
  { value: 'system', label: 'System', icon: Monitor, color: 'text-accent-slate' },
];

/** The ⌘K / Ctrl+K palette: go anywhere, switch theme, sign out. */
export default function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isCommandShortcut(event)) return;
      event.preventDefault();
      onOpenChange(!open);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  // close first, so the next page or dialog gets focus rather than the palette
  const run = (action: () => void) => () => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command menu">
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Go to">
          {PAGES.map(({ href, label, icon: Icon, color }) => (
            <CommandItem key={href} onSelect={run(() => router.push(href))}>
              <Icon weight="fill" className={color} /> {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Settings">
          {SETTINGS_PAGES.map(({ href, label, icon: Icon, color }) => (
            <CommandItem key={href} value={`Settings ${label}`} keywords={['settings']} onSelect={run(() => router.push(href))}>
              <Icon weight="fill" className={color} /> {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Theme">
          {THEMES.map(({ value, label, icon: Icon, color }) => (
            <CommandItem key={value} value={`Theme ${label}`} keywords={['theme', 'appearance']} onSelect={run(() => setTheme(value))}>
              <Icon weight="fill" className={color} /> {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Account">
          <CommandItem keywords={['log out', 'logout']} onSelect={run(() => void signOut().finally(() => router.replace('/sign-in')))}>
            <SignOut weight="fill" className="text-danger" /> Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
