'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import CommandMenu from './components/command-menu';
import Sidebar from './components/sidebar';
import { readCollapsed, saveCollapsed, shortcutLabel } from './lib';

const desktop = () => window.matchMedia('(min-width: 48rem)');
const subscribe = (onChange: () => void) => {
  const query = desktop();
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

/** The signed-in app frame: sidebar + page + ⌘K menu. The sidebar collapses to an icon rail, and is always one on phones. */
export default function AppShell({ children }: { children: ReactNode }) {
  // the shell renders client-side only (inside SessionGate), so browser APIs are safe here
  const isDesktop = useSyncExternalStore(subscribe, () => desktop().matches, () => true);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [searching, setSearching] = useState(false);
  const [shortcut] = useState(() => shortcutLabel(/Mac|iPhone|iPad/.test(navigator.userAgent)));

  const toggle = () => {
    setCollapsed(!collapsed);
    saveCollapsed(!collapsed);
  };

  return (
    <div className="flex h-[calc(100dvh-1rem)] gap-2">
      <Sidebar
        collapsed={collapsed || !isDesktop}
        onToggle={isDesktop ? toggle : undefined}
        onSearch={() => setSearching(true)}
        shortcut={shortcut}
      />
      <main className="min-w-0 flex-1">{children}</main>
      <CommandMenu open={searching} onOpenChange={setSearching} />
    </div>
  );
}
