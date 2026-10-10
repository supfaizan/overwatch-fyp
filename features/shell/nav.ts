import type { Icon } from '@phosphor-icons/react';
import { CreditCard, GearSix, GitBranch, Kanban, Palette, PlugsConnected, SquaresFour, UserCircle } from '@phosphor-icons/react/ssr';

type Page = { href: string; label: string; icon: Icon; color: string };

/** Each page keeps its colour wherever its icon appears (sidebar, ⌘K). */
export const PAGES: Page[] = [
  { href: '/dashboard', label: 'Dashboard', icon: SquaresFour, color: 'text-accent-blue' },
  { href: '/board', label: 'Board', icon: Kanban, color: 'text-accent-orange' },
];

export const SETTINGS_ICON = { icon: GearSix, color: 'text-accent-slate' };

// settings pages are owned by features/settings; the URLs are the contract between the two
export const SETTINGS_PAGES: Page[] = [
  { href: '/settings/profile', label: 'Profile', icon: UserCircle, color: 'text-accent-purple' },
  { href: '/settings/preferences', label: 'Preferences', icon: Palette, color: 'text-accent-amber' },
  { href: '/settings/repositories', label: 'Repositories', icon: GitBranch, color: 'text-accent-blue' },
  { href: '/settings/integrations', label: 'Integrations', icon: PlugsConnected, color: 'text-success' },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard, color: 'text-accent-slate' },
];
