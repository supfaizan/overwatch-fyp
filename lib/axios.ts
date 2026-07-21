/* The single shared Axios client. No feature creates its own instance or calls
   fetch for this backend.
   - request interceptor pulls the JWT from the auth store and sets Bearer
   - response interceptor auto-logs-out on 401 and normalizes errors */

import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/stores/auth-store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    const message =
      error.response?.data?.message ?? error.message ?? "Something went wrong";
    return Promise.reject(new Error(message));
  },
);
