import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";
import { NAV_ACTIONS } from "../static/story";

export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line-1/60 bg-ink-850/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="ow-live-dot" aria-hidden />
          <span className="text-[13px] font-semibold uppercase tracking-[0.22em] text-text-hi">
            {APP_NAME}
          </span>
        </Link>

        <nav aria-label="Account" className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="text-text-mid">
            <Link href={NAV_ACTIONS.signIn.href}>{NAV_ACTIONS.signIn.label}</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-4">
            <Link href={NAV_ACTIONS.start.href}>{NAV_ACTIONS.start.label}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
