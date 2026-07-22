"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { OnboardingStatusBadge } from "./OnboardingStatusBadge";
import { RepoSwitcher } from "./RepoSwitcher";
import { UserMenu } from "./UserMenu";

const LINKS = [
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/tickets", label: "TICKETS" },
  { href: "/connect", label: "REPOSITORIES" },
];

export function AppBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line-1 bg-ink-900/90 px-2.5 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="ow-live-dot" aria-hidden />
          <span className="ow-label !text-[13px] text-text-hi">OVERWATCH</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-sm px-3 py-1.5 ow-mono-micro transition-colors",
                  active
                    ? "bg-signal-soft text-signal"
                    : "text-text-lo hover:text-text-hi",
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
