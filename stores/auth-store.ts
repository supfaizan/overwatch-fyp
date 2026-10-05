"use client";

import Cookies from "js-cookie";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COOKIE_TOKEN, USER_STORAGE_KEY } from "@/constants";
import type { AuthResponse, User } from "@/types";

const ACCESS_COOKIE_DAYS = 30;

function cookieOptions(): Cookies.CookieAttributes {
  return {
    expires: ACCESS_COOKIE_DAYS,
    sameSite: "lax",
    secure: window.location.protocol === "https:",
    path: "/",
  };
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return Cookies.get(COOKIE_TOKEN) ?? null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (data: AuthResponse) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

/* Only the public profile is persisted (localStorage), so the app shell can
   show who is signed in on first paint. The access token stays in its cookie
   and never touches localStorage. Hydration is skipped at creation and run by
   AuthBootstrap after mount, so server and client render the same first tree. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: readToken(),
      user: null,
      isAuthenticated: Boolean(readToken()),

      setAuth: ({ token, user }) => {
        Cookies.set(COOKIE_TOKEN, token, cookieOptions());
        set({ token, user, isAuthenticated: true });
      },

      setToken: (token) => {
        Cookies.set(COOKIE_TOKEN, token, cookieOptions());
        set({ token, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        Cookies.remove(COOKIE_TOKEN, { path: "/" });
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: USER_STORAGE_KEY,
      partialize: (state) => ({ user: state.user }),
      skipHydration: true,
    },
  ),
);
