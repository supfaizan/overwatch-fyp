import type { ViewQuery } from "../types";

/* Keys for the graph view. The query is part of the key, so opening a folder
   is a new cache entry rather than a refetch of the old one — closing it again
   is then instant and shows exactly what it showed before. Scoped by
   repository so switching repos can never show another repository's graph. */

export const graphViewKeys = {
  all: ["graph-view"] as const,
  options: () => [...graphViewKeys.all, "options"] as const,
  view: (repoId: string, query: ViewQuery) =>
    [
      ...graphViewKeys.all,
      "view",
      repoId,
      // Sorted so two selections that differ only in order share one entry.
      [...query.expanded].sort().join("|"),
      query.expandTo ?? "none",
      query.nodeLabels ? [...query.nodeLabels].sort().join("|") : "all",
      query.edgeTypes ? [...query.edgeTypes].sort().join("|") : "all",
    ] as const,
};
