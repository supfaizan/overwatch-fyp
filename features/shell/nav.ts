import type { Icon } from '@phosphor-icons/react';
import {
  Buildings,
  ChartBar,
  CreditCard,
  Files,
  GearSix,
  GitBranch,
  Kanban,
  Palette,
  PlugsConnected,
  Scales,
  SquaresFour,
  UserCircle,
  UsersThree,
} from '@phosphor-icons/react/ssr';

type Page = { href: string; label: string; icon: Icon; color: string };

/** Shows a count of the decisions waiting on you beside it. */
export const DECISIONS_HREF = '/decisions';

/** Each page keeps its colour wherever its icon appears (sidebar, ⌘K). */
export const PAGES: Page[] = [
  { href: '/dashboard', label: 'Dashboard', icon: SquaresFour, color: 'text-accent-blue' },
  { href: '/board', label: 'Board', icon: Kanban, color: 'text-accent-orange' },
  { href: '/documents', label: 'Docs', icon: Files, color: 'text-accent-purple' },
  { href: DECISIONS_HREF, label: 'Decisions', icon: Scales, color: 'text-accent-amber' },
];

export const SETTINGS_ICON = { icon: GearSix, color: 'text-accent-slate' };

// settings pages are owned by features/settings; the URLs are the contract between the two
export const SETTINGS_PAGES: Page[] = [
  { href: '/settings/profile', label: 'Profile', icon: UserCircle, color: 'text-accent-purple' },
  {
    href: '/settings/preferences',
    label: 'Preferences',
    icon: Palette,
    color: 'text-accent-amber',
  },
  { href: '/settings/workspace', label: 'Workspace', icon: Buildings, color: 'text-accent-purple' },
  { href: '/settings/members', label: 'Members', icon: UsersThree, color: 'text-accent-orange' },
  {
    href: '/settings/repositories',
    label: 'Repositories',
    icon: GitBranch,
    color: 'text-accent-blue',
  },
  {
    href: '/settings/integrations',
    label: 'Integrations',
    icon: PlugsConnected,
    color: 'text-success',
  },
  { href: '/settings/decisions', label: 'Decisions', icon: Scales, color: 'text-accent-amber' },
  { href: '/settings/usage', label: 'Usage', icon: ChartBar, color: 'text-accent-blue' },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard, color: 'text-accent-slate' },
];
