"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubMark } from "@/components/shared/GithubMark";

interface GithubButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

export function GithubButton({ onClick, loading, label }: GithubButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className="w-full border-line-2 bg-surface-1 font-mono text-[12px] tracking-wide text-text-hi hover:bg-surface-2 hover:text-text-hi"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GithubMark className="size-4" />
      )}
      {label ?? "Continue with GitHub"}
    </Button>
  );
}
