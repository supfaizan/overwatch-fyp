"use client";

import { GithubButton } from "./GithubButton";
import { useGithubAuth } from "../hooks";

export function LoginForm() {
  const github = useGithubAuth("login");

  return (
    <div className="space-y-4">
      <GithubButton
        loading={github.isPending}
        onClick={github.start}
      />
      <p className="ow-mono-micro text-center text-text-dim">
        GitHub securely verifies your identity. Overwatch never stores a password.
      </p>
    </div>
  );
}
