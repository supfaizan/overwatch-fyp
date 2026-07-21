"use client";

import { GithubButton } from "./GithubButton";
import { useGithubAuth } from "../hooks";

export function RegisterForm() {
  const github = useGithubAuth("register");

  return (
    <div className="space-y-4">
      <GithubButton
        label="Sign up with GitHub"
        loading={github.isPending}
        onClick={github.start}
      />
      <p className="ow-mono-micro text-center text-text-dim">
        Your GitHub profile creates your Overwatch account automatically.
      </p>
    </div>
  );
}
