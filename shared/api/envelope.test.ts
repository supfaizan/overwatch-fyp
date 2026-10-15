import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { toApiError } from './envelope';

function failed(status: number, meta: Record<string, unknown>) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('failed', 'ERR', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data: { status: 'error', code: status, data: null, meta },
  });
}

describe('toApiError', () => {
  it('keeps field messages and the rest of meta', () => {
    const error = toApiError(
      failed(422, {
        error_code: 'validation_error',
        message: 'Check',
        fields: { password: 'Too short', bad: 3 },
        retry_after_seconds: 5,
      }),
    );
    expect(error.fields).toEqual({ password: 'Too short' });
    expect(error.meta.retry_after_seconds).toBe(5);
    expect(error.errorCode).toBe('validation_error');
  });

  it('has no fields when the server sent none', () => {
    expect(
      toApiError(
        failed(401, { error_code: 'invalid_credentials', message: 'Invalid email or password.' }),
      ).fields,
    ).toEqual({});
  });
});
