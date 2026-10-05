"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { OnboardingStatusBadge } from "./OnboardingStatusBadge";
import { RepoSwitcher } from "./RepoSwitcher";
import { UserMenu } from "./UserMenu";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tickets", label: "Tickets" },
  { href: "/connect", label: "Repositories" },
];

export function AppBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line-1 bg-ink-900/90 px-2.5 backdrop-blur-md">
      <div className="flex items-center gap-6 self-stretch">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="ow-live-dot" aria-hidden />
          <span className="ow-label !text-[13px] text-text-hi">OVERWATCH</span>
        </Link>

        <nav className="hidden items-stretch gap-1 self-stretch md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // PostHog tab: full-height hit area, underline grows in from the left
                  "relative flex items-center px-3 text-[14px] font-medium transition-colors",
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-signal after:transition-transform after:duration-300 after:ease-out",
                  active
                    ? "text-signal after:scale-x-100"
                    : "text-text-mid after:scale-x-0 hover:text-text-hi",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <RepoSwitcher />
        <OnboardingStatusBadge />
        <UserMenu />
      </div>
    </header>
  );
}
