"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveRepoFullName } from "@/stores/repo-store";
import { getGraphView, getViewOptions } from "../api";
import { graphViewKeys } from "../api/query-keys";
import { useViewQuery, useViewStore } from "../stores/view-store";
import type { Granularity } from "../types";

/** The filter vocabulary. It only changes when the backend does, so it is
 *  fetched once and kept — a new relationship type then appears in the UI
 *  without a frontend release. */
export function useViewOptions() {
  return useQuery({
    queryKey: graphViewKeys.options(),
    queryFn: getViewOptions,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useGraphView() {
  const repoFullName = useActiveRepoFullName();
  const query = useViewQuery();
  const adopt = useViewStore((state) => state.adopt);

  const result = useQuery({
    queryKey: graphViewKeys.view(repoFullName ?? "", query),
    queryFn: () => getGraphView(repoFullName!, query),
    enabled: Boolean(repoFullName),
    // Opening a folder is a different query, not a refresh of this one.
    // Holding the previous view keeps the canvas from blanking mid-click.
    placeholderData: keepPreviousData,
    // The first index runs as a background job, so an empty graph means "not
    // yet" rather than "none" — keep polling until it lands.
    refetchInterval: (entry) => {
      const status = entry.state.data?.parseStatus;
      return status === "pending" || status === "in_progress" ? 4_000 : false;
    },
  });

  // The server is the authority on what is open: an id whose parent turned
  // out to be shut is never opened, and is dropped here rather than resent on
  // every request. `adopt` ignores an unchanged set, so this settles at once.
  const expanded = result.data?.expanded;
  useEffect(() => {
    if (expanded) adopt(expanded.map((container) => container.id));
  }, [expanded, adopt]);

  return result;
}

/** Open every container down to a level, in one step.
 *
 * A one-shot request rather than a stored setting: it resolves to a concrete
 * set of open containers, which is then what the trail lists and what can be
 * closed again one at a time. */
export function useExpandTo() {
  const repoFullName = useActiveRepoFullName();
  const adopt = useViewStore((state) => state.adopt);

  const mutation = useMutation({
    mutationFn: (expandTo: Granularity) =>
      getGraphView(repoFullName!, {
        expanded: [],
        expandTo,
        nodeLabels: null,
        edgeTypes: null,
      }),
    onSuccess: (view) => adopt(view.expanded.map((container) => container.id)),
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    expandTo: (level: Granularity) => {
      if (repoFullName && !mutation.isPending) mutation.mutate(level);
    },
    isPending: mutation.isPending,
    disabled: !repoFullName,
  };
}
