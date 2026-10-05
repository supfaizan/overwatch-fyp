"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useActiveRepoFullName } from "@/stores/repo-store";
import { getCoverage, getNeighbours, getNodeDetail, searchGraph } from "../api";
import { explorerKeys } from "../api/query-keys";
import { groupRelations } from "../lib/relations";
import type { GraphNodeSummary } from "../types";

/** How long to wait after typing before asking the backend. */
const SEARCH_DEBOUNCE_MS = 250;
/** Shorter terms match too much to be useful, and the API rejects them. */
export const MIN_SEARCH_LENGTH = 2;

/** Detail for one node: what it is, and what it contains. */
export function useNodeDetail(nodeId: string | null) {
  const repoFullName = useActiveRepoFullName();

  return useQuery({
    queryKey: explorerKeys.node(repoFullName ?? "", nodeId ?? ""),
    queryFn: () => getNodeDetail(repoFullName!, nodeId!),
    enabled: Boolean(repoFullName && nodeId),
  });
}

/** What a node uses and what uses it, grouped for rendering. */
export function useNeighbours(nodeId: string | null) {
  const repoFullName = useActiveRepoFullName();

  const query = useQuery({
    queryKey: explorerKeys.neighbours(repoFullName ?? "", nodeId ?? ""),
    queryFn: () => getNeighbours(repoFullName!, nodeId!),
    enabled: Boolean(repoFullName && nodeId),
  });

  const groups = useMemo(
    () => (query.data && nodeId ? groupRelations(nodeId, query.data) : []),
    [query.data, nodeId],
  );

  return { ...query, groups };
}

/** Debounced name search across files and symbols. */
export function useGraphSearch(term: string) {
  const repoFullName = useActiveRepoFullName();
  const [debounced, setDebounced] = useState(term);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const trimmed = debounced.trim();
  const enabled = Boolean(repoFullName) && trimmed.length >= MIN_SEARCH_LENGTH;

  const query = useQuery({
    queryKey: explorerKeys.search(repoFullName ?? "", trimmed),
    queryFn: () => searchGraph(repoFullName!, trimmed),
    enabled,
    // Results only change when the repository is re-indexed.
    staleTime: 60_000,
    // Keep the last results on screen while the next term is fetched, rather
    // than flashing an empty list on every keystroke.
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    // Placeholder data outlives the search: cleared, it must show nothing.
    results: enabled ? (query.data ?? []) : ([] as GraphNodeSummary[]),
    /** True while the user has typed something we have not searched for yet. */
    isTyping: enabled && debounced !== term,
    isTermTooShort: trimmed.length > 0 && trimmed.length < MIN_SEARCH_LENGTH,
  };
}

/** What the graph contains, and how much of the code resolved. */
export function useGraphCoverage() {
  const repoFullName = useActiveRepoFullName();

  return useQuery({
    queryKey: explorerKeys.coverage(repoFullName ?? ""),
    queryFn: () => getCoverage(repoFullName!),
    enabled: Boolean(repoFullName),
  });
}
