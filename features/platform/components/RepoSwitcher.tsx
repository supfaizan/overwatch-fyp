"use client";

import { useEffect } from "react";
import { ChevronDown, GitBranch, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRepoStore } from "@/stores/repo-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConnectedRepos } from "../ingestion/hooks";
import type { ConnectedRepository, JobStatus } from "../ingestion/types";

function toRepository(repo: ConnectedRepository) {
  return {
    id: repo.repoFullName,
    fullName: repo.repoFullName,
    state:
      repo.parseStatus === "done"
        ? ("ready" as const)
        : repo.parseStatus === "failed"
          ? ("failed" as const)
          : ("indexing" as const),
  };
}

function statusDot(status: JobStatus) {
  if (status === "done") return "bg-success";
  if (status === "failed") return "bg-critical";
  return "bg-warn";
}

export function RepoSwitcher() {
  const { data: repos } = useConnectedRepos();
  const activeRepo = useRepoStore((s) => s.activeRepo);
  const setActiveRepo = useRepoStore((s) => s.setActiveRepo);

  // Adopt the first connected repo when nothing is selected yet — a fresh
  // browser has an empty persisted store but the account may already have
  // repos connected. Also recovers if the stored repo was disconnected.
  useEffect(() => {
    if (!repos || repos.length === 0) return;
    const stillConnected = repos.some(
      (r) => r.repoFullName === activeRepo?.fullName,
    );
    if (!stillConnected) setActiveRepo(toRepository(repos[0]));
  }, [repos, activeRepo, setActiveRepo]);

  if (!repos || repos.length === 0) return null;

  const active = repos.find((r) => r.repoFullName === activeRepo?.fullName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-sm border border-line-1 bg-surface-1 px-2.5 py-1.5",
          "ow-micro text-text-mid transition-colors hover:border-signal-border hover:text-text-hi",
        )}
      >
        <GitBranch className="size-3.5 text-text-dim" />
        <span className="max-w-[180px] truncate">
          {active?.repoFullName ?? "SELECT REPOSITORY"}
        </span>
        {active && (
          <span
            className={cn("size-1.5 rounded-full", statusDot(active.parseStatus))}
          />
        )}
        <ChevronDown className="size-3 text-text-dim" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[260px]">
        <DropdownMenuLabel className="ow-micro text-text-dim">
          CONNECTED REPOSITORIES
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {repos.map((repo) => {
          const selected = repo.repoFullName === activeRepo?.fullName;
          return (
            <DropdownMenuItem
              key={repo.repoFullName}
              onSelect={() => setActiveRepo(toRepository(repo))}
              className="flex items-center gap-2"
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  statusDot(repo.parseStatus),
                )}
              />
              <span className="flex-1 truncate font-mono text-[12px]">
                {repo.repoFullName}
              </span>
              {selected && <Check className="size-3.5 text-signal" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
