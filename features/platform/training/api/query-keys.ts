export const trainingKeys = {
  all: ["training"] as const,
  status: (repoId: string) => [...trainingKeys.all, "status", repoId] as const,
};
