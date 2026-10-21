import { ApiError } from '@/shared/api/envelope';
import { describe, expect, it, vi } from 'vitest';
import { applyServerErrors } from './form-errors';

type Values = { email: string; password: string };

describe('applyServerErrors', () => {
  it('puts field messages on their fields, focusing the first', () => {
    const setError = vi.fn();
    applyServerErrors<Values>(
      new ApiError('Check the fields', 422, 'validation_error', {
        password: 'Too short',
        other: 'x',
      }),
      setError,
      ['email', 'password'],
    );
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith('password', { type: 'server', message: 'Too short' }, {
      shouldFocus: true,
    });
  });

  it('puts anything else on the form itself', () => {
    const setError = vi.fn();
    const error = applyServerErrors<Values>(
      new ApiError('Invalid email or password.', 401, 'invalid_credentials'),
      setError,
      ['email', 'password'],
    );
    expect(setError).toHaveBeenCalledWith('root', {
      type: 'server',
      message: 'Invalid email or password.',
    });
    expect(error.errorCode).toBe('invalid_credentials');
  });
});
