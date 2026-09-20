"use client";

import { useState } from "react";
import {
  CheckCircle2,
  GitBranch,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRepoStore } from "@/stores/repo-store";
import {
  useConnectRepo,
  useGithubRepos,
  useRetryGithubWebhook,
} from "../hooks";
import { DisconnectRepoButton } from "./DisconnectRepoButton";
import type { OnboardingStatus } from "../types";

interface GithubRepoStepProps {
  status: OnboardingStatus["github"];
}

export function GithubRepoStep({ status }: GithubRepoStepProps) {
  const [selectedRepo, setSelectedRepo] = useState("");
  const activeRepo = useRepoStore((state) => state.activeRepo);
  const repos = useGithubRepos(!status.repoConnected && !status.needsReauth);
  const connect = useConnectRepo();
  const retryWebhook = useRetryGithubWebhook();
  const repoFullName = status.repoFullName ?? activeRepo?.fullName;

  if (status.repoConnected) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-signal-border bg-signal-soft p-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-signal" />
        <div>
          <p className="ow-mono-data text-text-hi">
            {repoFullName ?? "GitHub repository connected"}
          </p>
          <p className="ow-mono-micro mt-1 text-text-mid">
            PARSE {status.parseStatus?.replace("_", " ") ?? "QUEUED"} · WEBHOOK{" "}
            {status.webhookStatus ?? "PENDING"}
          </p>
          {repoFullName && (
            <div className="mt-3">
              <DisconnectRepoButton repoFullName={repoFullName} />
            </div>
          )}
          {status.webhookStatus === "failed" && (
            <div className="mt-3 space-y-2">
              <p className="ow-body text-critical">
                {status.webhookError ?? "GitHub could not create the push webhook."}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!repoFullName || retryWebhook.isPending}
                onClick={() => repoFullName && retryWebhook.mutate(repoFullName)}
              >
                {retryWebhook.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                RETRY WEBHOOK SETUP
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status.needsReauth) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-critical/30 bg-critical/5 p-4">
        <ShieldAlert className="mt-0.5 size-5 text-critical" />
        <div>
          <p className="ow-mono-data text-text-hi">GitHub authorization expired</p>
          <p className="ow-body mt-1 text-text-mid">
            Sign in with GitHub again before selecting a repository.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="github-repository" className="ow-mono-micro text-text-lo">
          GITHUB REPOSITORY
        </label>
        <div className="relative mt-2">
          <GitBranch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-lo" />
          <select
            id="github-repository"
            value={selectedRepo}
            onChange={(event) => setSelectedRepo(event.target.value)}
            disabled={repos.isLoading || repos.isError}
            className="h-10 w-full appearance-none rounded-md border border-line-2 bg-ink-850 pl-9 pr-3 font-mono text-[13px] text-text-hi outline-none focus:border-signal-border disabled:opacity-50"
          >
            <option value="">
              {repos.isLoading ? "Loading repositories…" : "Select a repository"}
            </option>
            {repos.data?.map((repo) => (
              <option key={repo.fullName} value={repo.fullName} disabled={!repo.admin}>
                {repo.fullName}{repo.private ? " (private)" : ""}{!repo.admin ? " — admin required" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {repos.isError && (
        <p className="ow-body text-critical">{repos.error.message}</p>
      )}

      {repos.data?.length === 0 && (
        <p className="ow-body text-text-mid">
          No repositories are available to this GitHub account.
        </p>
      )}

      <Button
        type="button"
        className="w-full font-mono text-[12px] tracking-wide"
        disabled={!selectedRepo || connect.isPending}
        onClick={() => connect.mutate(selectedRepo)}
      >
        {connect.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Lock className="size-4" />
        )}
        CONNECT & INDEX REPOSITORY
      </Button>

      <p className="ow-mono-micro text-text-dim">
        ADMIN ACCESS IS REQUIRED TO INSTALL THE PUSH WEBHOOK
      </p>
    </div>
  );
}
