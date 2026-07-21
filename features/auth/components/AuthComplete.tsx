"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AFTER_LOGIN, AFTER_REGISTER } from "@/constants";
import { useAuthStore } from "@/stores/auth-store";
import {
  completeGithubAuth,
  consumeAuthIntent,
} from "../api";
import { AuthShell } from "./AuthShell";

function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.hash.slice(1)).get("access_token");
}

export function AuthComplete() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useRef<string | null>(readAccessToken());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = accessToken.current;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );

    if (!token) {
      setError("GitHub did not return an access token. Please try again.");
      return;
    }

    let active = true;

    completeGithubAuth(token)
      .then((auth) => {
        if (!active) return;
        setAuth(auth);
        const destination =
          consumeAuthIntent() === "register" ? AFTER_REGISTER : AFTER_LOGIN;
        router.replace(destination);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to complete GitHub authentication.",
        );
      });

    return () => {
      active = false;
    };
  }, [router, setAuth]);

  return (
    <AuthShell
      eyebrow="ACCESS // GITHUB"
      title={error ? "Authentication failed" : "Completing sign in"}
      subtitle={
        error
          ? error
          : "Verifying your GitHub identity and preparing your workspace."
      }
      footer={
        error ? (
          <Link href="/login" className="text-signal hover:underline">
            RETURN TO SIGN IN
          </Link>
        ) : (
          "DO NOT CLOSE THIS WINDOW"
        )
      }
    >
      <div className="flex justify-center py-6 text-signal">
        {error ? (
          <AlertTriangle className="size-8" aria-hidden />
        ) : (
          <Loader2 className="size-8 animate-spin" aria-label="Signing in" />
        )}
      </div>
    </AuthShell>
  );
}
