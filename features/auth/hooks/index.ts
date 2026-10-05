"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { GUEST_REDIRECT } from "@/constants";
import { broadcastAuth } from "@/lib/auth-session";
import { useAuthStore } from "@/stores/auth-store";
import {
  logout,
  logoutEverywhere,
  startGithubAuth,
  type AuthIntent,
} from "../api";

export function useGithubAuth(intent: AuthIntent) {
  const [isPending, setIsPending] = useState(false);

  const start = useCallback(() => {
    setIsPending(true);
    startGithubAuth(intent);
  }, [intent]);

  return { start, isPending };
}

/* Local state is cleared even if the request fails: the user asked to sign
   out, and a dead network must not keep them signed in on this device. */
function useSignOut(request: () => Promise<void>) {
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: request,
    onSettled: () => {
      clearAuth();
      broadcastAuth({ type: "logout" });
      window.location.assign(GUEST_REDIRECT);
    },
  });
}

export function useLogout() {
  return useSignOut(logout);
}

export function useLogoutEverywhere() {
  return useSignOut(logoutEverywhere);
}
