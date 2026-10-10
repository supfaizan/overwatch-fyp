import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type StepsProps = {
  /** Step names, in order. Keep them to a word or two. */
  steps: string[];
  /** Index of the step the user is on; earlier steps show as done. */
  current: number;
  className?: string;
};

/**
 * Progress through a fixed sequence, like onboarding: done, current and upcoming steps.
 * - It shows progress; it isn't navigation. Put actions in the page, not on the steps.
 * - Three to five steps. More than that and the flow should be split.
 */
export default function Steps({ steps, current, className }: StepsProps) {
  return (
    <ol className={cn('flex flex-wrap items-center gap-2', className)}>
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} aria-current={active ? 'step' : undefined} className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full border text-xs font-semibold',
                done && 'border-success bg-success text-white',
                active && 'border-primary bg-primary text-white',
                !done && !active && 'border-border-strong text-muted',
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} aria-label="done" /> : index + 1}
            </span>
            <span className={cn('text-sm', active ? 'font-semibold' : 'text-muted')}>{label}</span>
            {index < steps.length - 1 && <span className="h-px w-6 bg-border-strong" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
