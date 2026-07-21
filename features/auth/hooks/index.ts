"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import {
  logout,
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

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuth();
      window.location.assign("/login");
    },
  });
}
