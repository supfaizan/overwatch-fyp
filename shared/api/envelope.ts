import axios from 'axios';
import { ERROR_CODE } from './error-codes';

/** Every backend response has this shape; see the BE README "API responses". */
export type ApiEnvelope<T> = {
  status: 'success' | 'error';
  code: number;
  data: T;
  meta: Record<string, unknown>;
};

/** A failed request: HTTP status, the backend's stable `error_code`, and any messages per form field. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorCode: string,
    readonly fields: Record<string, string> = {},
    readonly meta: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

function toFields(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => {
      return typeof entry[1] === 'string';
    }),
  );
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
/** A browser navigation, not a fetch: the backend redirects to GitHub and back. */
export const GITHUB_SIGN_IN_URL = `${API_URL}/auth/github/login`;

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (axios.isAxiosError<ApiEnvelope<null>>(error) && error.response) {
    const { meta } = error.response.data ?? {};
    const message = typeof meta?.message === 'string' ? meta.message : 'Something went wrong';
    const code = typeof meta?.error_code === 'string' ? meta.error_code : 'unknown';
    return new ApiError(message, error.response.status, code, toFields(meta?.fields), meta ?? {});
  }
  return new ApiError(
    "Can't reach the server. Check your connection and try again.",
    0,
    ERROR_CODE.networkError,
  );
}
