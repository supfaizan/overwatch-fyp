"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AFTER_LOGIN } from "@/constants";
import { getCurrentUser } from "@/features/auth/api";
import { getTokenExpiration, isValidAccessToken } from "@/lib/auth-token";
import { refreshAccessToken } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";

const REFRESH_BUFFER_MS = 60_000;

function postRestoreDestination(): string {
  const from = new URLSearchParams(window.location.search).get("from");
  return from?.startsWith("/") && !from.startsWith("//") ? from : AFTER_LOGIN;
}

export function AuthBootstrap() {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  // The cold-start recovery below must run at most once per mount, or every
  // client navigation while logged out would fire another /auth/refresh.
  const coldStartAttempted = useRef(false);

  useEffect(() => {
    if (pathname === "/auth/complete") return;

    // No access token at all, but the httpOnly refresh cookie may still be
    // alive — in production it lives on the API's domain, so clearing site
    // data for the frontend leaves it intact. Try to recover before giving up.
    if (!token) {
      if (coldStartAttempted.current) return;
      coldStartAttempted.current = true;

      let active = true;
      refreshAccessToken()
        .then(async (accessToken) => {
          const user = await getCurrentUser(accessToken);
          if (!active) return;
          useAuthStore.getState().setAuth({ token: accessToken, user });
          if (pathname === "/login" || pathname === "/register") {
            router.replace(postRestoreDestination());
          }
        })
        .catch(() => undefined); // genuinely logged out — stay put
      return () => {
        active = false;
      };
    }

    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const restoreUser = async (accessToken: string) => {
      const user = await getCurrentUser(accessToken);
      if (!active) return;
      useAuthStore.getState().setAuth({ token: accessToken, user });

      if (pathname === "/login" || pathname === "/register") {
        router.replace(postRestoreDestination());
      }
    };

    if (isValidAccessToken(token)) {
      if (!useAuthStore.getState().user) {
        getCurrentUser(token)
          .then((user) => {
            if (!active) return;
            useAuthStore.getState().setUser(user);
            if (pathname === "/login" || pathname === "/register") {
              router.replace(postRestoreDestination());
            }
          })
          .catch(() => undefined);
      }

      const expiresAt = getTokenExpiration(token);
      const delay = Math.max(0, (expiresAt ?? Date.now()) - Date.now() - REFRESH_BUFFER_MS);
      refreshTimer = setTimeout(() => {
        refreshAccessToken().catch(() => useAuthStore.getState().clearAuth());
      }, delay);
    } else {
      refreshAccessToken()
        .then(restoreUser)
        .catch(() => {
          if (active) useAuthStore.getState().clearAuth();
        });
    }

    return () => {
      active = false;
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [pathname, router, token]);

  return null;
}
