export const ticketKeys = {
  all: ["tickets"] as const,
  list: (repoId: string) => [...ticketKeys.all, "list", repoId] as const,
};
