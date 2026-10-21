import type { ReactNode } from 'react';

/**
 * A labelled form field with its hint or error underneath; the control inside points at them with `aria-describedby`.
 * - Spread `describedBy(id, error)` on the control so screen readers read the error or hint with it.
 * - An error replaces the hint while it shows.
 * - Use `group` for a set of controls such as a `RadioGroup`: the label becomes the group's legend.
 */
export default function FormField({
  id,
  label,
  error,
  hint,
  action,
  group,
  children,
}: {
  /** The control's `id`; the label, error and hint ids derive from it. */
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Beside the label, e.g. a "Forgot password?" link. */
  action?: ReactNode;
  /**
   * Renders a `<fieldset>` whose `<legend>` is the label, for several controls answering one question.
   * @default false
   */
  group?: boolean;
  children: ReactNode;
}) {
  const Wrapper = group ? 'fieldset' : 'div';
  const labelClass = 'text-sm font-medium';
  return (
    <Wrapper className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        {group
          ? <legend className={labelClass}>{label}</legend>
          : (
            <label htmlFor={id} className={labelClass}>
              {label}
            </label>
          )}
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
    </Wrapper>
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
