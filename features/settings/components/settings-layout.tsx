'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

// grouped so workspace settings can join the second group later
const GROUPS = [
  {
    label: 'Account',
    pages: [
      { href: '/settings/profile', label: 'Profile' },
      { href: '/settings/preferences', label: 'Preferences' },
    ],
  },
  {
    label: 'Workspace',
    pages: [
      { href: '/settings/repositories', label: 'Repositories' },
      { href: '/settings/integrations', label: 'Integrations' },
      { href: '/settings/billing', label: 'Billing' },
    ],
  },
];

/** Settings pages: section nav beside the page on desktop, a scrolling row above it on phones. */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:flex-row md:gap-8">
        <nav aria-label="Settings" className="flex shrink-0 gap-1 overflow-x-auto border-b border-border pb-2 md:w-48 md:flex-col md:gap-4 md:overflow-visible md:border-r md:border-b-0 md:self-start md:pr-4">
          {GROUPS.map((group) => (
            <div key={group.label} className="flex gap-1 md:flex-col">
              <span className="hidden px-2 pb-1 text-xs font-semibold tracking-wide text-foreground uppercase md:block">{group.label}</span>
              {group.pages.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? 'page' : undefined}
                  className={cn(
                    'flex h-8 shrink-0 items-center rounded-md px-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                    pathname === href ? 'bg-fill-active font-medium' : 'text-muted hover:bg-fill-hover hover:text-foreground',
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="min-w-0 flex-1 pb-6">{children}</div>
      </div>
    </div>
  );
}

/** A settings page's heading, an optional action beside it, and the body. */
export function SettingsSection({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="text-sm text-muted">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
