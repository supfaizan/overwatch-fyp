/* Active repository — the repo currently in focus across the platform
   (app bar, dashboard). Persisted to localStorage so it survives navigation
   and reloads. */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Repository } from "@/features/platform/ingestion/types";

interface RepoState {
  activeRepo: Repository | null;
  setActiveRepo: (repo: Repository) => void;
  clearActiveRepo: () => void;
}

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

/** Every graph/query endpoint keys on `repo_full_name`, so that — not an
 *  opaque id — is what features pass to the API. `null` means no repo is
 *  connected yet; dependent queries stay disabled until one is. */
export const useActiveRepoFullName = () =>
  useRepoStore((s) => s.activeRepo?.fullName ?? null);
