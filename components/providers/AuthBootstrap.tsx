"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AFTER_LOGIN } from "@/constants";
import { getCurrentUser } from "@/features/auth/api";
import { getTokenExpiration, isValidAccessToken } from "@/lib/auth-token";
import {
  isSessionRejected,
  onAuthBroadcast,
  redirectToLogin,
} from "@/lib/auth-session";
import { refreshAccessToken } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";

const REFRESH_BUFFER_MS = 60_000;
const AUTH_COMPLETE_PATH = "/auth/complete";

function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

function postRestoreDestination(): string {
  const from = new URLSearchParams(window.location.search).get("from");
  return from?.startsWith("/") && !from.startsWith("//") ? from : AFTER_LOGIN;
}

function endSession(): void {
  useAuthStore.getState().clearAuth();
  redirectToLogin();
}

/* Keeps the client session alive: restores it from the refresh cookie when
   the access token is missing or stale, refreshes ahead of expiry, loads the
   profile once per page load, and mirrors sign-ins/outs from other tabs.
   Successful refreshes write the store, which re-runs the effect, so every
   path converges on the "valid token" branch. */
export function AuthBootstrap() {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  // One restore attempt per lapse in the session, so a logged-out visitor
  // navigating around does not fire /auth/refresh on every page.
  const restoreAttempted = useRef(false);
  const profileLoaded = useRef(false);

  useEffect(() => {
    void useAuthStore.persist.rehydrate();

    return onAuthBroadcast((message) => {
      if (message.type === "token") {
        useAuthStore.getState().setToken(message.token);
      } else {
        endSession();
      }
    });
  }, []);

  useEffect(() => {
    if (pathname === AUTH_COMPLETE_PATH) return;

    if (!token || !isValidAccessToken(token)) {
      profileLoaded.current = false; // whoever signs in next may be someone else
      if (restoreAttempted.current) return;
      restoreAttempted.current = true;

      refreshAccessToken().catch((error: unknown) => {
        if (!isSessionRejected(error)) return; // offline or server down: keep the session
        if (token) {
          endSession();
        } else {
          useAuthStore.getState().clearAuth(); // never signed in here: stay put
        }
      });
      return;
    }

    restoreAttempted.current = false;
    if (isAuthPage(pathname)) router.replace(postRestoreDestination());

    if (!profileLoaded.current) {
      profileLoaded.current = true;
      getCurrentUser()
        .then((user) => {
          // The store outlives this effect; only guard against a sign-out
          // that landed while the request was in flight.
          if (useAuthStore.getState().token) useAuthStore.getState().setUser(user);
        })
        .catch(() => {
          profileLoaded.current = false; // retry on the next navigation
        });
    }

    const expiresAt = getTokenExpiration(token) ?? Date.now();
    const refreshTimer = setTimeout(() => {
      refreshAccessToken().catch((error: unknown) => {
        if (isSessionRejected(error)) endSession();
      });
    }, Math.max(0, expiresAt - Date.now() - REFRESH_BUFFER_MS));

    return () => clearTimeout(refreshTimer);
  }, [pathname, router, token]);

  return null;
}
