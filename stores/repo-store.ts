/* Active repository — the repo currently in focus across the platform
   (app bar, training screen, dashboard). Persisted to localStorage so it
   survives navigation and reloads. */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Repository } from "@/features/platform/ingestion/types";

interface RepoState {
  activeRepo: Repository | null;
  setActiveRepo: (repo: Repository) => void;
  clearActiveRepo: () => void;
}

/** Stand-in while no repo is connected (mock/demo mode). */
export const DEFAULT_REPO_ID = "payments-core";

export const useRepoStore = create<RepoState>()(
  persist(
    (set) => ({
      activeRepo: null,
      setActiveRepo: (repo) => set({ activeRepo: repo }),
      clearActiveRepo: () => set({ activeRepo: null }),
    }),
    {
      name: "ow_active_repo",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** The repo id every feature keys its queries off. */
export const useActiveRepoId = () =>
  useRepoStore((s) => s.activeRepo?.id ?? DEFAULT_REPO_ID);
