"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRepoStore } from "@/stores/repo-store";
import {
  hasPendingOnboarding,
  useOnboardingStatus,
} from "@/features/platform/ingestion/hooks";

export function OnboardingStatusBadge() {
  const activeRepo = useRepoStore((state) => state.activeRepo);
  const status = useOnboardingStatus();
  const wasPending = useRef<boolean | null>(null);

  const pending = hasPendingOnboarding(status.data);
  const failed = Boolean(
    status.data &&
      (status.data.github.parseStatus === "failed" ||
        status.data.github.webhookStatus === "failed" ||
        status.data.jira.syncStatus === "failed"),
  );

  useEffect(() => {
    if (!status.data) return;
    if (wasPending.current === true && !pending && !failed) {
      toast.success("Workspace setup complete. Repository and tickets are up to date.");
    }
    wasPending.current = pending;
  }, [failed, pending, status.data]);

  if (status.isLoading) {
    return (
      <div className="hidden items-center gap-2 rounded-sm border border-line-1 bg-surface-1 px-3 py-1.5 sm:flex">
        <Loader2 className="size-3.5 animate-spin text-text-lo" />
        <span className="ow-micro text-text-mid">CHECKING SETUP</span>
      </div>
    );
  }

  if (!status.data?.github.repoConnected) {
    return (
      <Link
        href="/connect"
        className="hidden items-center gap-2 rounded-sm border border-line-1 bg-surface-1 px-3 py-1.5 sm:flex"
      >
        <GitBranch className="size-3.5 text-text-lo" />
        <span className="ow-micro text-text-mid">CONNECT REPOSITORY</span>
      </Link>
    );
  }

  if (failed) {
    return (
      <Link
        href="/connect"
        className="hidden items-center gap-2 rounded-sm border border-critical/30 bg-critical/5 px-3 py-1.5 sm:flex"
      >
        <AlertTriangle className="size-3.5 text-critical" />
        <span className="ow-micro text-critical">SETUP NEEDS ATTENTION</span>
      </Link>
    );
  }

  return (
    <Link
      href="/connect"
      className="hidden items-center gap-2 rounded-sm border border-line-1 bg-surface-1 px-3 py-1.5 sm:flex"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin text-signal" />
      ) : (
        <CheckCircle2 className="size-3.5 text-success" />
      )}
      <span className="max-w-40 truncate ow-micro text-text-mid">
        {pending ? "SETTING UP WORKSPACE" : activeRepo?.fullName ?? "WORKSPACE READY"}
      </span>
    </Link>
  );
}
