import type { Role, Workspace } from './types';

const RANK: Record<Role, number> = { member: 0, admin: 1, owner: 2 };

/** At least `min`: the backend enforces this too, so it only decides what the UI offers. */
export const hasRole = (role: Role | undefined, min: Role) => role !== undefined && RANK[role] >= RANK[min];

/** The workspace asked for (?w=), else the last one used, else the personal one. Null when there are none. */
export function pickWorkspace(workspaces: Workspace[], requested: string | null, lastUsed: string | null): Workspace | null {
  const find = (id: string | null) => workspaces.find((workspace) => workspace.id === id);
  return find(requested) ?? find(lastUsed) ?? workspaces.find((workspace) => workspace.personal) ?? workspaces[0] ?? null;
}

// keyed by user: browsers get shared and accounts switched
const lastWorkspaceKey = (userId: string) => `ow_workspace:${userId}`;

export function readLastWorkspace(userId: string): string | null {
  try {
    return localStorage.getItem(lastWorkspaceKey(userId));
  } catch {
    return null;
  }
}

export function saveLastWorkspace(userId: string, workspaceId: string): void {
  try {
    localStorage.setItem(lastWorkspaceKey(userId), workspaceId);
  } catch {
    // storage blocked: the personal workspace opens next time
  }
}
