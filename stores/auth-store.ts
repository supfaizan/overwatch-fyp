/* Global auth state (Zustand).

   Persisted to cookies — deliberately, not localStorage — so the `proxy.ts`
   middleware can read the token server-side before any JS runs.
   - ow_token : the raw JWT (URL-safe, read directly by the proxy)
   - ow_user  : base64(JSON) of the user, for client hydration */

import { create } from "zustand";
import Cookies from "js-cookie";
import { COOKIE_TOKEN, COOKIE_USER } from "@/constants";
import type { AuthResponse, User } from "@/types";

const COOKIE_OPTS: Cookies.CookieAttributes = {
  expires: 7,
  sameSite: "lax",
  path: "/",
};

function readUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = Cookies.get(COOKIE_USER);
  if (!raw) return null;
  try {
    return JSON.parse(atob(raw)) as User;
  } catch {
    return null;
  }
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
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: readToken(),
  user: readUser(),
  isAuthenticated: Boolean(readToken()),

  setAuth: ({ token, user }) => {
    Cookies.set(COOKIE_TOKEN, token, COOKIE_OPTS);
    Cookies.set(COOKIE_USER, btoa(JSON.stringify(user)), COOKIE_OPTS);
    set({ token, user, isAuthenticated: true });
  },

  setUser: (user) => {
    Cookies.set(COOKIE_USER, btoa(JSON.stringify(user)), COOKIE_OPTS);
    set({ user });
  },

  logout: () => {
    Cookies.remove(COOKIE_TOKEN, { path: "/" });
    Cookies.remove(COOKIE_USER, { path: "/" });
    set({ token: null, user: null, isAuthenticated: false });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
}));
