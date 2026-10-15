'use client';

import { MagnifyingGlass, SidebarSimple } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import Avatar from '@/shared/components/avatar';
import Button from '@/shared/components/button';
import Kbd from '@/shared/components/kbd';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { displayName, handle } from '@/shared/session/lib';
import { useSession } from '@/shared/session/store';
import { isActive } from '../lib';
import { PAGES, SETTINGS_ICON } from '../nav';
import RepoSwitcher from './repo-switcher';
import WorkspaceSwitcher from './workspace-switcher';

type SidebarProps = {
  /** Icons only: labels are kept for screen readers and shown as tooltips. */
  collapsed: boolean;
  /** Absent on phones, where icons are all there's room for. */
  onToggle?: () => void;
  onSearch: () => void;
  onAddRepo: () => void;
  onCreateWorkspace: () => void;
  shortcut: string;
};

export default function Sidebar({ collapsed, onToggle, onSearch, onAddRepo, onCreateWorkspace, shortcut }: SidebarProps) {
  const pathname = usePathname();
  const user = useSession((state) => state.user);
  const name = user ? displayName(user) : '';
  // collapsed items are squares the size of the toggle, so every icon sits on the same line
  const item = cn(
    'flex h-8 shrink-0 items-center gap-2 rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary [&>svg]:size-4 [&>svg]:shrink-0',
    collapsed ? 'w-8 justify-center' : 'px-2',
  );
  const label = collapsed ? 'sr-only' : 'truncate';

  return (
    <nav aria-label="Main" className={cn('flex h-full shrink-0 flex-col gap-1 rounded-lg border border-border bg-surface p-2', collapsed ? 'w-fit' : 'w-60')}>
      <div className={cn('flex gap-1 pb-1', collapsed ? 'flex-col' : 'items-center')}>
        {onToggle && (
          <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
            <Button variant="tertiary" size="sm" iconOnly aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} onClick={onToggle}>
              <SidebarSimple />
            </Button>
          </Tooltip>
        )}
        <WorkspaceSwitcher collapsed={collapsed} onCreate={onCreateWorkspace} />
      </div>

      {/* it reads ?repo=, which needs a Suspense boundary */}
      <Suspense>
        <RepoSwitcher collapsed={collapsed} onAddRepo={onAddRepo} />
      </Suspense>

      <Hint label={`Search (${shortcut})`} show={collapsed}>
        <button type="button" onClick={onSearch} className={cn(item, 'mb-2 cursor-pointer border border-border text-muted hover:border-border-hover')}>
          <MagnifyingGlass aria-hidden />
          <span className={label}>Search</span>
          {!collapsed && <Kbd className="ml-auto">{shortcut}</Kbd>}
        </button>
      </Hint>

      {PAGES.map(({ href, label: text, icon: Icon, color }) => (
        <Hint key={href} label={text} show={collapsed}>
          <NavLink href={href} active={isActive(pathname, href)} className={item}>
            <Icon weight="fill" className={color} aria-hidden />
            <span className={label}>{text}</span>
          </NavLink>
        </Hint>
      ))}

      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-2">
        <Hint label="Settings" show={collapsed}>
          <NavLink href="/settings/preferences" active={isActive(pathname, '/settings') && pathname !== '/settings/profile'} className={item}>
            <SETTINGS_ICON.icon weight="fill" className={SETTINGS_ICON.color} aria-hidden />
            <span className={label}>Settings</span>
          </NavLink>
        </Hint>
        <Hint label={name} show={collapsed}>
          <NavLink href="/settings/profile" active={pathname === '/settings/profile'} className={cn(item, !collapsed && 'h-10 px-1')}>
            <Avatar src={user?.avatar_url} name={name} size="sm" />
            <span className={cn('flex min-w-0 flex-col leading-tight', collapsed && 'sr-only')}>
              <span className="truncate font-medium text-foreground">{name}</span>
              <span className="truncate text-xs text-muted">{user && handle(user)}</span>
            </span>
          </NavLink>
        </Hint>
      </div>
    </nav>
  );
}

/** A tooltip only while the label is hidden. */
function Hint({ label, show, children }: { label: string; show: boolean; children: ReactNode }) {
  return show ? (
    <Tooltip content={label} side="right">
      {children}
    </Tooltip>
  ) : (
    children
  );
}

function NavLink({ href, active, className, children, ...props }: { href: string; active: boolean; className: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(className, active ? 'bg-fill-active font-medium text-foreground' : 'text-muted hover:bg-fill-hover hover:text-foreground')}
      // Tooltip's trigger passes its props through here
      {...props}
    >
      {children}
    </Link>
  );
}
