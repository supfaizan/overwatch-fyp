export const repoKeys = {
  all: ["repos"] as const,
  list: () => [...repoKeys.all, "list"] as const,
  status: (id: string) => [...repoKeys.all, "status", id] as const,
};
