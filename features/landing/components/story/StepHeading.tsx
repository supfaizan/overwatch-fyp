import { cn } from "@/lib/utils";
import { RailDot } from "./Rail";

interface StepHeadingProps {
  label: string;
  title: string;
  body: string;
  active: boolean;
  /** Chapter number; omitted for the closing step. */
  number?: number;
  terminal?: boolean;
}

/** Label, title and one line of body. On large screens, text that is not
 *  being read fades back so the active chapter stands out. The rail dot is
 *  never dimmed; it tracks the line instead. */
export function StepHeading({
  label,
  title,
  body,
  active,
  number,
  terminal = false,
}: StepHeadingProps) {
  const focus = cn(
    "transition-opacity duration-700 motion-reduce:transition-none",
    active ? "lg:opacity-100" : "lg:opacity-25",
  );

  return (
    <>
      <p className="relative flex items-center font-mono text-[11px] uppercase tracking-[0.22em] text-text-lo">
        <RailDot terminal={terminal} />
        <span className={cn("flex gap-3", focus)}>
          {number !== undefined && (
            <span
              className={cn(
                "transition-colors duration-500",
                active ? "text-signal" : "text-text-dim",
              )}
            >
              {String(number).padStart(2, "0")}
            </span>
          )}
          {label}
        </span>
      </p>
      <div className={focus}>
        <h2 className="mt-5 text-[clamp(2rem,3.6vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em] text-balance text-text-hi">
          {title}
        </h2>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-pretty text-text-mid sm:text-lg">
          {body}
        </p>
      </div>
    </>
  );
}
