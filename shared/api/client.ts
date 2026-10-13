import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { endSession, refreshSession } from '@/shared/session/refresh';
import { useSession } from '@/shared/session/store';
import { useWorkspace } from '@/shared/workspaces/store';
import { API_URL, ApiError, toApiError, type ApiEnvelope } from './envelope';
import { ERROR_CODE } from './error-codes';

const http = axios.create({ baseURL: API_URL, withCredentials: true });

http.interceptors.request.use((config) => {
  const token = useSession.getState().token;
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  const workspaceId = useWorkspace.getState().id;
  if (workspaceId && !config.headers['X-Workspace-Id']) config.headers['X-Workspace-Id'] = workspaceId;
  return config;
});

// a missing or expired access token is recoverable while the refresh cookie is still good
const RECOVERABLE = new Set<string>([ERROR_CODE.invalidToken, ERROR_CODE.missingToken]);

http.interceptors.response.use(undefined, async (error: AxiosError<ApiEnvelope<null>>) => {
  const request = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
  const errorCode = error.response?.data?.meta?.error_code;

  if (error.response?.status === 401 && typeof errorCode === 'string' && RECOVERABLE.has(errorCode) && request && !request._retried) {
    request._retried = true;
    try {
      request.headers.Authorization = `Bearer ${await refreshSession()}`;
      return http(request);
    } catch (refreshError) {
      if (refreshError instanceof ApiError && refreshError.status === 401) endSession();
      throw refreshError;
    }
  }
  throw toApiError(error);
});

/** Send a request and return the envelope's `data`. */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const { data } = await http.request<ApiEnvelope<T>>(config);
  return data.data;
}

/** Send a request and return the envelope's `data` with its `meta` (totals and paging). */
async function requestWithMeta<T>(config: AxiosRequestConfig): Promise<{ data: T; meta: Record<string, unknown> }> {
  const { data } = await http.request<ApiEnvelope<T>>(config);
  return { data: data.data, meta: data.meta };
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: 'GET', url }),
  getWithMeta: <T>(url: string, config?: AxiosRequestConfig) => requestWithMeta<T>({ ...config, method: 'GET', url }),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => request<T>({ ...config, method: 'POST', url, data: body }),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => request<T>({ ...config, method: 'PATCH', url, data: body }),
  delete: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: 'DELETE', url }),
};
