/* Query keys for the explorer. Scoped by repository so switching repos never
   shows another repository's cached results. */

export const explorerKeys = {
  all: ["explorer"] as const,
  node: (repoId: string, nodeId: string) =>
    [...explorerKeys.all, "node", repoId, nodeId] as const,
  neighbours: (repoId: string, nodeId: string) =>
    [...explorerKeys.all, "neighbours", repoId, nodeId] as const,
  search: (repoId: string, term: string) =>
    [...explorerKeys.all, "search", repoId, term] as const,
  coverage: (repoId: string) => [...explorerKeys.all, "coverage", repoId] as const,
};
