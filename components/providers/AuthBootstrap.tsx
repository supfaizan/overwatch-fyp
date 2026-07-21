"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (!token || pathname === "/auth/complete") return;

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
