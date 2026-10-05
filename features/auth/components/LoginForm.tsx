"use client";

import { AlertTriangle } from "lucide-react";
import { GithubButton } from "./GithubButton";
import { useGithubAuth } from "../hooks";

interface LoginFormProps {
  errorMessage?: string | null;
}

export function LoginForm({ errorMessage }: LoginFormProps) {
  const github = useGithubAuth("login");

  return (
    <div className="space-y-4">
      {errorMessage && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-sm border border-critical/30 bg-critical/5 px-3 py-2 ow-micro text-critical"
        >
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          {errorMessage}
        </p>
      )}
      <GithubButton
        loading={github.isPending}
        onClick={github.start}
      />
      <p className="ow-micro text-center text-text-dim">
        GitHub securely verifies your identity. Overwatch never stores a password.
      </p>
    </div>
  );
}
