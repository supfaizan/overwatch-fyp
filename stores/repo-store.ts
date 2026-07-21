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
