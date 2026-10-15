import type { ReactNode } from 'react';

/** A labelled field with its hint or error underneath; the control inside points at them with `aria-describedby`. */
export default function FormField({
  id,
  label,
  error,
  hint,
  action,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Beside the label, e.g. a "Forgot password?" link. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error
        ? (
          <p id={`${id}-error`} className="text-xs text-danger">
            {error}
          </p>
        )
        : (
          hint && (
            <p id={`${id}-hint`} className="text-xs text-muted">
              {hint}
            </p>
          )
        )}
    </div>
  );
}

/** Props that tie a control to its FormField's error or hint. */
export function describedBy(id: string, error: string | undefined, hasHint = false) {
  return {
    id,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  };
}
