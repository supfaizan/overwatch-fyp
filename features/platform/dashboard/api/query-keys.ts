export const dashboardKeys = {
  all: ["dashboard"] as const,
  graph: (repoId: string) => [...dashboardKeys.all, "graph", repoId] as const,
  warnings: (repoId: string) =>
    [...dashboardKeys.all, "warnings", repoId] as const,
};
