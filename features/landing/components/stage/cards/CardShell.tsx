import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardShellProps {
  tone?: "default" | "critical";
  className?: string;
  children: ReactNode;
}

export function CardShell({ tone = "default", className, children }: CardShellProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 font-mono text-[11px] leading-relaxed sm:text-xs",
        tone === "critical"
          ? "border-critical-border bg-critical-soft"
          : "border-line-1 bg-ink-900/80 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A single centred line of muted text, for scenes that need no card. */
export function CardCaption({ children }: { children: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center font-mono text-[11px] text-text-lo">
      {children}
    </p>
  );
}
