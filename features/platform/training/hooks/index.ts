"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRepoStore } from "@/stores/repo-store";
import { getTrainingStatus, resetTrainingMock } from "../api";
import { trainingKeys } from "../api/query-keys";

export function useTraining() {
  const router = useRouter();
  const activeRepo = useRepoStore((s) => s.activeRepo);
  const setActiveRepo = useRepoStore((s) => s.setActiveRepo);
  const repoId = activeRepo?.id ?? "unknown";

  // Fresh run each mount (mock only — no-op against a real backend).
  useEffect(() => {
    resetTrainingMock();
  }, []);

  const query = useQuery({
    queryKey: trainingKeys.status(repoId),
    queryFn: () => getTrainingStatus(repoId),
    refetchInterval: (q) => (q.state.data?.done ? false : 600),
  });

  const done = query.data?.done ?? false;

  useEffect(() => {
    if (!done) return;
    if (activeRepo) setActiveRepo({ ...activeRepo, state: "ready" });
    toast.success("Model trained — opening the operational view");
    const t = setTimeout(() => router.push("/dashboard"), 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return query;
}
