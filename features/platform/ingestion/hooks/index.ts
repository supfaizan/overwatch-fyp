"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRepoStore } from "@/stores/repo-store";
import { connectRepo, getRepos } from "../api";
import { repoKeys } from "../api/query-keys";
import type { Repository } from "../types";

export function useConnectRepo() {
  const router = useRouter();
  const setActiveRepo = useRepoStore((s) => s.setActiveRepo);

  return useMutation({
    mutationFn: connectRepo,
    onSuccess: ({ repo }) => {
      setActiveRepo({ ...repo, state: "indexing" });
      toast.success(`Connected ${repo.fullName} — indexing started`);
      router.push("/training");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** One-click connect of a sample repo (already-known metadata, no parsing). */
export function useConnectSample() {
  const router = useRouter();
  const setActiveRepo = useRepoStore((s) => s.setActiveRepo);

  return (repo: Repository) => {
    setActiveRepo({ ...repo, state: "indexing" });
    toast.success(`Connected ${repo.fullName} — indexing started`);
    router.push("/training");
  };
}

export function useRepos() {
  return useQuery({ queryKey: repoKeys.list(), queryFn: getRepos });
}
