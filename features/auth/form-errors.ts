import { toApiError } from '@/shared/api/envelope';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

/**
 * Put the server's messages on the fields they belong to; anything else goes in the form-level error.
 * Returns the error, so callers can still react to its code.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  const apiError = toApiError(error);
  const known = new Set<string>(fields);
  let placed = false;
  for (const [field, message] of Object.entries(apiError.fields)) {
    if (!known.has(field)) {
      continue;
    }
    setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !placed });
    placed = true;
  }
  if (!placed) {
    setError('root', { type: 'server', message: apiError.message });
  }
  return apiError;
}
