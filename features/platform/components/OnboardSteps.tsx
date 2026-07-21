import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["CONNECT", "PROCESS", "WATCH"] as const;

export function OnboardSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-pill border px-3 py-1",
                active && "border-signal-border bg-signal-soft",
                done && "border-line-2 bg-surface-1",
                !active && !done && "border-line-1 bg-transparent",
              )}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full ow-mono-micro",
                  active && "bg-signal text-signal-ink",
                  done && "bg-line-2 text-text-hi",
                  !active && !done && "bg-surface-2 text-text-dim",
                )}
              >
                {done ? <Check className="size-2.5" /> : step}
              </span>
              <span
                className={cn(
                  "ow-mono-micro",
                  active ? "text-signal" : done ? "text-text-mid" : "text-text-dim",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="h-px w-6 bg-line-1" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
