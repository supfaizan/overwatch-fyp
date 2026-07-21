"use client";

import Cookies from "js-cookie";
import { create } from "zustand";
import { COOKIE_TOKEN } from "@/constants";
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

export const useAuthStore = create<AuthState>((set) => ({
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
}));
