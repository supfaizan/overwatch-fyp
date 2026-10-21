import { create } from 'zustand';

type WorkspaceState = {
  /** Sent as X-Workspace-Id on every request; null until WorkspaceGate picks one. */
  id: string | null;
  setId: (id: string | null) => void;
};

export const useWorkspace = create<WorkspaceState>()((set) => {
  return {
    id: null,
    setId: (id) => {
      return set({ id });
    },
  };
});
