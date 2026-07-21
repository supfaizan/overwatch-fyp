import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/stores/auth-store";

interface ApiError {
  error_code?: string;
  message?: string;
}

interface RefreshResponse {
  access_token: string;
  token_type: "bearer";
}

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const authTransport = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = authTransport
      .post<RefreshResponse>("/auth/refresh")
      .then(({ data }) => {
        useAuthStore.getState().setToken(data.access_token);
        return data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const request = error.config as RetryableRequest | undefined;
    const shouldRefresh =
      error.response?.status === 401 &&
      error.response.data?.error_code === "invalid_token" &&
      request &&
      !request._retry;

    if (shouldRefresh) {
      request._retry = true;
      try {
        const token = await refreshAccessToken();
        request.headers.Authorization = `Bearer ${token}`;
        return api(request);
      } catch {
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") {
          const from = `${window.location.pathname}${window.location.search}`;
          window.location.assign(`/login?from=${encodeURIComponent(from)}`);
        }
      }
    }

    const message =
      error.response?.data?.message ?? error.message ?? "Something went wrong";
    return Promise.reject(new Error(message));
  },
);
