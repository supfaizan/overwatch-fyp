export const dashboardKeys = {
  all: ["dashboard"] as const,
  warnings: (repoId: string) =>
    [...dashboardKeys.all, "warnings", repoId] as const,
};
